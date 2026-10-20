const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";

const [emulatorHost, emulatorPortStr] = (
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085"
).split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

function validListingPayload(userId) {
  const ts = new Date(Date.now() - 1000);
  return {
    userId,
    titleBn: "স্যামসাং গ্যালাক্সি এ৫৪ (রংপুর শহর)",
    titleEn: "Samsung Galaxy A54 (Rangpur City)",
    priceBdt: 28500,
    condition: "যেমন নতুন",
    locationBn: "জাহাজ কোম্পানি মোড়, রংপুর শহর",
    locationEn: "Jahaj Company More, Rangpur City",
    districtBn: "জাহাজ কোম্পানি মোড়",
    districtEn: "Jahaj Company More",
    areaIndex: 1,
    categoryId: 1,
    isNegotiable: true,
    sellerName: "মোঃ রাশেদুল ইসলাম",
    phone: "01711223344",
    descriptionBn: "যত্ন সহকারে ব্যবহৃত ফোন, জাহাজ কোম্পানি মোড়ে সরাসরি দেখে নিবেন।",
    descriptionEn: "Carefully used phone, inspect at Jahaj Company More, Rangpur City.",
    photoPresetIds: [1, 6],
    photoCaptions: ["সামনের ভিউ", "ক্যামেরা ভিউ"],
    photoUris: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

function validSavedItemPayload(userId) {
  const ts = new Date(Date.now() - 1000);
  return {
    userId,
    productId: 101,
    titleBn: "iPhone 13 Pro 128GB",
    titleEn: "iPhone 13 Pro 128GB",
    priceBdt: 65000,
    districtBn: "জাহাজ কোম্পানি মোড়",
    createdAt: ts,
    updatedAt: ts,
  };
}

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user: cannot read or create listings", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("listings").doc("listing_1").get());
  await assertFails(
    unauthDb.collection("listings").doc("listing_1").set(validListingPayload(ALICE_UID))
  );
});

test("Authenticated user: can create and read own listing in Rangpur City", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("listings").doc("alice_listing_1").set(validListingPayload(ALICE_UID))
  );
  await assertSucceeds(aliceDb.collection("listings").doc("alice_listing_1").get());
});

test("Authenticated user: cannot read another user's listing (PII & ownership isolation)", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection("listings")
      .doc("bob_listing_1")
      .set(validListingPayload(BOB_UID));
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("listings").doc("bob_listing_1").get());
});

test("Authenticated user: can query own listings with matching userId filter", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("listings").doc("alice_listing_1").set(validListingPayload(ALICE_UID))
  );
  await assertSucceeds(
    aliceDb.collection("listings").where("userId", "==", ALICE_UID).get()
  );
});

test("Authenticated user: fails listing query without userId filter (rules are not filters)", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("listings").get());
});

test("Shadow update & value poisoning: rejects ghost fields and invalid prices", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const docRef = aliceDb.collection("listings").doc("alice_listing_1");
  await assertSucceeds(docRef.set(validListingPayload(ALICE_UID)));

  // Reject ghost field
  await assertFails(
    docRef.update({
      isVerifiedAdmin: true,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Reject negative price
  await assertFails(
    docRef.update({
      priceBdt: -500,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Valid update succeeds
  await assertSucceeds(
    docRef.update({
      priceBdt: 26000,
      updatedAt: new Date(Date.now() - 500),
    })
  );
});

test("Saved items: owner can create, query, and delete own saved item; cross-user fails", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();

  await assertSucceeds(
    aliceDb.collection("saved_items").doc("saved_1").set(validSavedItemPayload(ALICE_UID))
  );
  await assertSucceeds(
    aliceDb.collection("saved_items").where("userId", "==", ALICE_UID).get()
  );
  await assertFails(bobDb.collection("saved_items").doc("saved_1").get());
  await assertFails(bobDb.collection("saved_items").doc("saved_1").delete());
  await assertSucceeds(aliceDb.collection("saved_items").doc("saved_1").delete());
});
