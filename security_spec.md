# Recycl Rangpur — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Authentication Invariant**: No unauthenticated user (`request.auth == null`) may read, list, create, update, or delete any document in `/listings/{listingId}` or `/saved_items/{savedId}`.
2. **Ownership & PII Isolation Invariant**: Every document in `/listings/{listingId}` and `/saved_items/{savedId}` contains a mandatory `userId` field that must match `request.auth.uid`. Because listings contain seller contact details (`phone`), read/list/update/delete access is isolated to the document owner (`resource.data.userId == request.auth.uid`).
3. **Immutable Metadata Invariant**: On `update`, `userId` and `createdAt` (and `productId` on `saved_items`) must remain strictly equal to their existing stored values.
4. **Temporal & Structural Integrity**: Timestamps (`createdAt`, `updatedAt`) must be server-populated Firestore `timestamp` objects (`<= request.time`), strings must satisfy strict length bounds, prices must be positive integers (`1..100000000`), and arrays (`photoPresetIds`, `photoCaptions`, `photoUris`) are bounded to at most 5 elements.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read**: `unauthDb.collection("listings").doc("item_1").get()` -> Reject (`PERMISSION_DENIED`).
2. **Unauthenticated Write**: `unauthDb.collection("listings").doc("item_1").set(...)` -> Reject (`PERMISSION_DENIED`).
3. **Cross-User Read (PII Leak Attempt)**: Alice reading Bob's listing (`userId: "bob_456"`) -> Reject (`PERMISSION_DENIED`).
4. **Unfiltered Collection List (Query Enforcer Check)**: Alice running `db.collection("listings").get()` without `.where("userId", "==", ALICE_UID)` -> Reject (`PERMISSION_DENIED`).
5. **Identity Spoofing on Create**: Alice creating a listing with `userId: "bob_456"` -> Reject (`PERMISSION_DENIED`).
6. **Shadow Update / Ghost Field Injection**: Alice updating her listing with an undeclared field `isVerifiedAdmin: true` -> Reject via `affectedKeys().hasOnly(...)`.
7. **Ownership Hijack on Update**: Alice attempting to mutate `userId` from `"alice_123"` to `"bob_456"` -> Reject (`incoming().userId == existing().userId`).
8. **Timestamp Tampering on Update**: Alice attempting to overwrite `createdAt` during an update -> Reject (`incoming().createdAt == existing().createdAt`).
9. **Future Timestamp Spoofing**: Client submitting a `createdAt` timestamp in the future (`> request.time`) -> Reject.
10. **Value Poisoning (Negative/Zero Price or String Price)**: Submitting `priceBdt: -500` or `priceBdt: "free"` -> Reject via `isValidListing()`.
11. **Denial-of-Wallet Oversized String / Array**: Submitting a 2000-character title or 10 photo elements -> Reject via `.size()` bounds.
12. **Cross-User Delete**: Alice attempting to delete Bob's saved item or listing -> Reject (`existing().userId == request.auth.uid`).
