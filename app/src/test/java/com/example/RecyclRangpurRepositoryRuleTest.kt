package com.example

import com.example.base.FirestoreEmulatorTestBase
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.UUID

class RecyclRangpurRepositoryRuleTest : FirestoreEmulatorTestBase() {

  private fun buildSampleRangpurProduct(): MarketProduct {
    val uniqueSuffix = UUID.randomUUID().toString().take(6)
    return MarketProduct(
      id = (1000..9999).random(),
      titleBn = "স্যামসাং ফোন রংপুর $uniqueSuffix",
      titleEn = "Samsung Phone Rangpur $uniqueSuffix",
      priceBdt = 24500,
      condition = "যেমন নতুন",
      locationBn = "জাহাজ কোম্পানি মোড়, রংপুর শহর",
      locationEn = "Jahaj Company More, Rangpur City",
      categoryId = 1,
      isNegotiable = true,
      phone = "01711223344",
      sellerName = "রাশেদুল ইসলাম",
      descriptionBn = "রংপুর শহরের জাহাজ কোম্পানি মোড়ে সরাসরি এসে দেখে নিন।",
      descriptionEn = "Inspect directly at Jahaj Company More, Rangpur City.",
      areaIndex = 1,
      districtBn = "জাহাজ কোম্পানি মোড়",
      districtEn = "Jahaj Company More",
      photos = listOf(
        ProductPhoto(
          id = "p_1",
          studioPresetId = 1,
          captionBn = "প্রধান ছবি",
          captionEn = "Main Cover Photo"
        )
      )
    )
  }

  @Test
  fun createListing_validPayload_createsDocumentAndReturnsId() = runBlocking {
    signInTestUser(ALICE_EMAIL)
    val repository = RecyclRangpurRepository(firestore)
    val sample = buildSampleRangpurProduct()

    val createResult = withTimeout(DEFAULT_TIMEOUT_MS) { repository.createListing(sample) }
    assertTrue("Expected listing creation to succeed", createResult.isSuccess)
    val docId = createResult.getOrThrow()
    assertTrue(docId.isNotBlank())
  }

  @Test
  fun getUserListings_authenticatedOwner_returnsMatchingListings() = runBlocking {
    signInTestUser(ALICE_EMAIL)
    val repository = RecyclRangpurRepository(firestore)
    val sample = buildSampleRangpurProduct()
    val docId = withTimeout(DEFAULT_TIMEOUT_MS) { repository.createListing(sample).getOrThrow() }

    val listingsResult = withTimeout(DEFAULT_TIMEOUT_MS) { repository.getUserListings() }
    assertTrue(listingsResult.isSuccess)
    assertTrue(listingsResult.getOrThrow().any { it.id == docId })
  }

  @Test
  fun observeUserListings_authenticatedOwner_emitsRealtimeUpdates() = runBlocking {
    val uid = signInTestUser(ALICE_EMAIL)
    val repository = RecyclRangpurRepository(firestore)
    val sample = buildSampleRangpurProduct()
    val docId = withTimeout(DEFAULT_TIMEOUT_MS) { repository.createListing(sample).getOrThrow() }

    val emitted = withTimeout(FLOW_TIMEOUT_MS) {
      repository.observeUserListings(uid).first { list -> list.any { it.id == docId } }
    }
    assertTrue(emitted.any { it.id == docId })
  }

  @Test
  fun getListingById_crossUserAccess_failsWithPermissionDenied() = runBlocking {
    signInTestUser(ALICE_EMAIL)
    val aliceRepo = RecyclRangpurRepository(firestore)
    val docId = withTimeout(DEFAULT_TIMEOUT_MS) {
      aliceRepo.createListing(buildSampleRangpurProduct()).getOrThrow()
    }

    signInTestUser(BOB_EMAIL)
    val bobRepo = RecyclRangpurRepository(firestore)
    val bobResult = withTimeout(DEFAULT_TIMEOUT_MS) { bobRepo.getListingById(docId) }
    assertTrue("Cross-user access must fail", bobResult.isFailure)
    val ex = bobResult.exceptionOrNull() as? FirebaseFirestoreException
    assertNotNull(ex)
    assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, ex?.code)
  }

  @Test
  fun observeUserListings_unauthenticatedUser_failsWithPermissionDenied() = runBlocking {
    auth.signOut()
    val repository = RecyclRangpurRepository(firestore)

    var caughtException: Throwable? = null
    try {
      withTimeout(FLOW_TIMEOUT_MS) {
        repository.observeUserListings("unauthenticated_uid").first()
      }
    } catch (e: Throwable) {
      caughtException = e
    }
    assertNotNull("Expected unauthenticated observation to throw", caughtException)
    val firestoreEx = caughtException as? FirebaseFirestoreException
    assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, firestoreEx?.code)
  }

  private companion object {
    const val ALICE_EMAIL = "alice_rangpur@test.com"
    const val BOB_EMAIL = "bob_rangpur@test.com"
    const val DEFAULT_TIMEOUT_MS = 10000L
    const val FLOW_TIMEOUT_MS = 10000L
  }
}
