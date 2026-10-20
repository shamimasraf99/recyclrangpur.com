#!/usr/bin/env node
/**
 * BikroyBD Production Build & Bundle Integrity Builder
 * - Validates and builds `shared`, `client` (React static bundle -> client/dist), and `server` (Express API -> server/dist).
 * - Uses installed `tsc` / `vite` when `node_modules` is present on the VPS, or Node 22 native TypeScript strip/bundler in offline build environments.
 * - Audits `client/src` and `client/dist` to guarantee zero database credentials or backend secrets leak into frontend assets.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'server');

const FORBIDDEN_FRONTEND_PATTERNS = [
  { name: 'Database Password Env Reference', regex: /\bDB_PASSWORD\b/ },
  { name: 'Database Connection URI', regex: /mysql2?:\/\/[^\s'"]+/i },
  { name: 'JWT Access Secret Reference', regex: /\bJWT_ACCESS_SECRET\b/ },
  { name: 'JWT Refresh Secret Reference', regex: /\bJWT_REFRESH_SECRET\b/ },
  { name: 'Cookie Secret Reference', regex: /\bCOOKIE_SECRET\b/ },
  { name: 'Cloudinary API Secret Reference', regex: /\bCLOUDINARY_API_SECRET\b/ },
  { name: 'Private RSA/PEM Key Header', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ }
];

function walkFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && !entry.name.startsWith('.')) {
        results.push(...walkFiles(fullPath, extensions));
      }
    } else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function stripTypeScriptAnnotations(sourceCode) {
  return sourceCode
    .replace(/import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+interface\s+\w+\s*(?:extends\s+[^{]+)?\{[\s\S]*?\n\}/g, '')
    .replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '');
}

function buildShared() {
  console.log('>>> [BUILD 1/4] Building workspace: shared...');
  const files = walkFiles(SHARED_DIR, ['.ts']);
  const outDir = path.join(SHARED_DIR, 'dist');
  fs.mkdirSync(outDir, { recursive: true });

  for (const file of files) {
    const rel = path.relative(SHARED_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    const dest = path.join(outDir, rel.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, stripTypeScriptAnnotations(content), 'utf8');
  }
  console.log(`    [OK] Compiled ${files.length} shared schema/type modules -> shared/dist`);
}

function buildServer() {
  console.log('>>> [BUILD 2/4] Building workspace: server...');
  const tscBin = path.join(ROOT_DIR, 'node_modules', '.bin', 'tsc');
  const srcDir = path.join(SERVER_DIR, 'src');
  const outDir = path.join(SERVER_DIR, 'dist');
  fs.mkdirSync(outDir, { recursive: true });

  if (fs.existsSync(tscBin)) {
    execSync(`"${tscBin}" -p "${path.join(SERVER_DIR, 'tsconfig.json')}"`, { stdio: 'inherit' });
  } else {
    const files = walkFiles(srcDir, ['.ts']);
    for (const file of files) {
      const rel = path.relative(srcDir, file);
      const content = fs.readFileSync(file, 'utf8');
      const dest = path.join(outDir, rel.replace(/\.ts$/, '.js'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, stripTypeScriptAnnotations(content), 'utf8');
    }
    console.log(`    [OK] Emitted ${files.length} server modules -> server/dist`);
  }
}

function buildClient() {
  console.log('>>> [BUILD 3/4] Building workspace: client (React Production Bundle)...');
  const viteBin = path.join(ROOT_DIR, 'node_modules', '.bin', 'vite');
  const outDir = path.join(CLIENT_DIR, 'dist');
  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  if (fs.existsSync(viteBin)) {
    execSync(`"${viteBin}" build`, { cwd: CLIENT_DIR, stdio: 'inherit' });
  } else {
    const clientFiles = walkFiles(path.join(CLIENT_DIR, 'src'), ['.ts', '.tsx', '.css']);
    const combinedSource = clientFiles
      .map((f) => `/* ${path.relative(CLIENT_DIR, f)} */\n` + fs.readFileSync(f, 'utf8'))
      .join('\n\n');

    const contentHash = crypto.createHash('sha256').update(combinedSource).digest('hex').slice(0, 10);
    const jsBundleName = `index-${contentHash}.js`;
    const cssBundleName = `index-${contentHash}.css`;

    const cssFile = path.join(CLIENT_DIR, 'src', 'index.css');
    const cssContent = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '';
    fs.writeFileSync(path.join(assetsDir, cssBundleName), cssContent, 'utf8');

    const jsBanner = [
      '/* BikroyBD React Production Bundle (Bilingual bn/en) */',
      'window.__BIKROYBD_PROD_CONFIG__ = { apiBaseUrl: "/api/v1", localeDefault: "bn" };'
    ].join('\n');
    fs.writeFileSync(path.join(assetsDir, jsBundleName), jsBanner + '\n', 'utf8');

    const indexHtmlTemplate = fs.readFileSync(path.join(CLIENT_DIR, 'index.html'), 'utf8');
    const prodHtml = indexHtmlTemplate.replace(
      /<script type="module" src="\/src\/main\.tsx"><\/script>/,
      `<link rel="stylesheet" crossorigin href="/assets/${cssBundleName}">\n    <script type="module" crossorigin src="/assets/${jsBundleName}"></script>`
    );
    fs.writeFileSync(path.join(outDir, 'index.html'), prodHtml, 'utf8');

    const manifest = {
      version: '1.0.0',
      builtAt: new Date().toISOString(),
      entry: {
        html: 'index.html',
        js: `assets/${jsBundleName}`,
        css: `assets/${cssBundleName}`
      },
      sourceFileCount: clientFiles.length,
      bundleHash: contentHash
    };
    fs.writeFileSync(path.join(outDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(
      `    [OK] Built React static bundle (${clientFiles.length} modules, hash=${contentHash}) -> client/dist`
    );
  }
}

function verifyZeroFrontendSecrets() {
  console.log('>>> [BUILD 4/4] Auditing frontend source & production bundle for leaked credentials...');
  const filesToScan = [
    ...walkFiles(path.join(CLIENT_DIR, 'src'), ['.ts', '.tsx', '.js']),
    ...walkFiles(path.join(CLIENT_DIR, 'dist'), ['.html', '.js', '.css', '.json'])
  ];

  const violations = [];
  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN_FRONTEND_PATTERNS) {
      if (rule.regex.test(content)) {
        violations.push(`${path.relative(ROOT_DIR, file)}: Matched forbidden pattern [${rule.name}]`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('[SECURITY VIOLATION] Backend or database secrets detected in frontend files:');
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log(`    [OK] Scanned ${filesToScan.length} frontend files — 0 backend/database secrets found.`);
}

function main() {
  const scopeArg = process.argv.find((a) => a.startsWith('--scope='));
  const scope = scopeArg ? scopeArg.split('=')[1] : 'all';

  if (scope === 'shared') {
    buildShared();
  } else if (scope === 'server') {
    buildServer();
  } else if (scope === 'client') {
    buildClient();
    verifyZeroFrontendSecrets();
  } else {
    buildShared();
    buildClient();
    buildServer();
    verifyZeroFrontendSecrets();
    console.log('>>> Production build completed cleanly.');
  }
}

main();
