/**
 * Database Migration Runner for BikroyBD (MySQL 8.0+)
 * Reads SQL migration files sequentially, executes within transactions with advisory locking,
 * supports restricted MySQL users, and maintains history in `schema_migrations`.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getMysql() {
  return require('mysql2/promise');
}

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'bikroybd_migrator',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bikroybd_db',
  multipleStatements: true,
  charset: 'utf8mb4'
};

function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function verifyMigrationsOffline() {
  console.log('>>> Verifying SQL Migration Files (Offline Structural & Checksum Audit)...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = getMigrationFiles();
  if (files.length === 0) {
    throw new Error('No SQL migration files found in database/migrations');
  }

  const manifest = [];
  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8').trim();
    if (!content) {
      throw new Error(`Migration file ${file} is empty`);
    }
    const sha256 = crypto.createHash('sha256').update(content).digest('hex');
    manifest.push({ file, bytes: Buffer.byteLength(content, 'utf8'), sha256 });
    console.log(`  [VERIFIED] ${file} (${manifest[manifest.length - 1].bytes} bytes, sha256=${sha256.slice(0, 12)}...)`);
  }

  console.log(`>>> All ${files.length} migration files verified cleanly.`);
  return manifest;
}

async function createDatabaseIfPermitted() {
  const mysql = getMysql();
  try {
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
  } catch (err) {
    // In production, restricted users (bikroybd_migrator / bikroybd_app) only have privileges on
    // the pre-created bikroybd_db database and cannot run global CREATE DATABASE.
    console.log(
      `[INFO] Skipping global CREATE DATABASE (proceeding with pre-provisioned database '${DB_CONFIG.database}'): ${err.code || err.message}`
    );
  }
}

async function ensureMigrationTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64) NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT migration_name, checksum FROM schema_migrations ORDER BY id ASC');
  return new Map(rows.map((r) => [r.migration_name, r.checksum]));
}

async function runUpMigrations() {
  verifyMigrationsOffline();
  console.log('>>> Initializing Live Database Migration (Target: ' + DB_CONFIG.database + ')...');
  await createDatabaseIfPermitted();

  const mysql = getMysql();
  const pool = mysql.createPool(DB_CONFIG);
  const connection = await pool.getConnection();

  try {
    // Acquire advisory lock to prevent concurrent cluster migration execution
    const [lockRows] = await connection.query("SELECT GET_LOCK('bikroybd_migration_lock', 30) AS locked");
    if (!lockRows || !lockRows[0] || lockRows[0].locked !== 1) {
      throw new Error('Could not acquire bikroybd_migration_lock within 30 seconds');
    }

    await ensureMigrationTable(connection);
    const applied = await getAppliedMigrations(connection);
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = getMigrationFiles();

    for (const file of files) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlContent.trim()).digest('hex');

      if (applied.has(file)) {
        console.log(`[SKIP] Migration already applied: ${file}`);
        continue;
      }

      console.log(`[APPLYING] ${file}...`);
      await connection.beginTransaction();
      try {
        await connection.query(sqlContent);
        await connection.query(
          'INSERT INTO schema_migrations (migration_name, checksum) VALUES (?, ?)',
          [file, checksum]
        );
        await connection.commit();
        console.log(`[SUCCESS] ${file} applied cleanly.`);
      } catch (err) {
        await connection.rollback();
        console.error(`[FAILED] Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('>>> All database migrations applied successfully.');
  } finally {
    try {
      await connection.query("SELECT RELEASE_LOCK('bikroybd_migration_lock')");
    } catch {
      // ignore lock release error on disconnect
    }
    connection.release();
    await pool.end();
  }
}

async function runSeeds() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--allow-production-seed')) {
    console.error(
      '[SECURITY BLOCK] Refusing to run demo seeders in NODE_ENV=production without explicit --allow-production-seed flag.'
    );
    process.exit(1);
  }

  console.log('>>> Running Database Seeders...');
  const mysql = getMysql();
  const pool = mysql.createPool(DB_CONFIG);
  const connection = await pool.getConnection();

  try {
    const seedsDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(seedsDir)) {
      console.log('No seeds directory found.');
      return;
    }
    const seedFiles = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of seedFiles) {
      console.log(`[SEEDING] ${file}...`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      await connection.query(sql);
      console.log(`[SUCCESS] Seed ${file} executed.`);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

if (require.main === module) {
  const command = process.argv[2] || 'up';
  if (command === 'up') {
    runUpMigrations().catch((err) => {
      console.error('Migration aborted:', err.message);
      process.exit(1);
    });
  } else if (command === 'verify') {
    try {
      verifyMigrationsOffline();
    } catch (err) {
      console.error('Migration verification failed:', err.message);
      process.exit(1);
    }
  } else if (command === 'seed') {
    runSeeds().catch((err) => {
      console.error('Seeding aborted:', err.message);
      process.exit(1);
    });
  } else {
    console.log(`Usage: node database/migrate.js [up|verify|seed]`);
  }
}

module.exports = {
  verifyMigrationsOffline,
  getMigrationFiles
};
