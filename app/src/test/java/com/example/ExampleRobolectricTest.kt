package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.ui.theme.Typography
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

  @Test
  fun appContext_andRangpurFeaturedListings_areConfiguredCorrectly() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertEquals("com.aistudio.bikroybd.marketplace", context.packageName)
    assertEquals("Recycle Bin Rangpur", context.getString(R.string.app_name))
    assertEquals("ca-app-pub-3940256099942544/9257395921", AdMobConfig.APP_OPEN_AD_UNIT_ID)
    assertEquals("ca-app-pub-3940256099942544/2247696110", AdMobConfig.NATIVE_AD_UNIT_ID)

    val featured = SAMPLE_PRODUCTS.filter { it.isFeatured }
    assertTrue("Should contain featured listings for Rangpur City", featured.isNotEmpty())
    assertTrue("All sample products must belong to Rangpur City areas",
      SAMPLE_PRODUCTS.all { it.areaIndex in 0 until RANGPUR_CITY_AREAS.size }
    )
  }

  @Test
  fun localEmailAccountStore_supportsSignUpAndLoginFlow() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val store = LocalEmailAccountStore(context)
    store.clearSession()
    assertNull(store.getActiveSession())

    val registerResult = store.registerUser(
      name = "তানভীর আহমেদ",
      email = "tanvir.rangpur@example.com",
      pass = "secret123",
      phone = "01799887766"
    )
    assertTrue("Register should succeed", registerResult.isSuccess)
    val user = registerResult.getOrThrow()
    assertEquals("tanvir.rangpur@example.com", user.email)
    assertEquals("তানভীর আহমেদ", user.displayName)

    // Active session should be set
    val session = store.getActiveSession()
    assertNotNull(session)
    assertEquals("tanvir.rangpur@example.com", session?.email)

    // Clear session and log in again
    store.clearSession()
    assertNull(store.getActiveSession())

    val loginResult = store.loginUser("tanvir.rangpur@example.com", "secret123")
    assertTrue("Login should succeed with correct credentials", loginResult.isSuccess)
    assertEquals("tanvir.rangpur@example.com", loginResult.getOrThrow().email)
  }

  @Test
  fun globalSearch_matchesProductsByNameAcrossMarketplace() {
    val query = "Galaxy"
    val matches = SAMPLE_PRODUCTS.filter {
      it.titleBn.contains(query, ignoreCase = true) || it.titleEn.contains(query, ignoreCase = true)
    }
    assertTrue("Should find Galaxy phone in sample products", matches.isNotEmpty())
  }

  @Test
  fun typography_hasEnlargedFontSizes() {
    assertTrue("Title Large should be enlarged for readability", Typography.titleLarge.fontSize.value >= 22f)
    assertTrue("Body Large should be at least 17sp", Typography.bodyLarge.fontSize.value >= 17f)
  }

  @Test
  fun categories_includePetsClothingCosmeticsFoodAndOthers() {
    val categoryNamesBn = BIKROY_CATEGORY_LIST.map { it.nameBn }
    assertTrue(categoryNamesBn.any { it.contains("প্রাণী") })
    assertTrue(categoryNamesBn.any { it.contains("পোশাক") })
    assertTrue(categoryNamesBn.any { it.contains("কসমেটিকস") })
    assertTrue(categoryNamesBn.any { it.contains("খাদ্য") })
    assertTrue(categoryNamesBn.any { it.contains("অন্যান্য") })
    assertEquals(11, BIKROY_CATEGORY_LIST.size)
  }

  @Test
  fun postOwnership_allowsOnlyCreatorAndAdminToModify() {
    val samplePost = SAMPLE_PRODUCTS.first() // owned by seller_ariful_1 / ariful.rangpur@example.com
    val ownerUser = AuthenticatedUser(
      uid = "seller_ariful_1",
      displayName = "আরিফুল",
      email = "ariful.rangpur@example.com"
    )
    val adminUser = AuthenticatedUser(
      uid = "admin_uid_99",
      displayName = "Admin",
      email = ADMIN_EMAIL
    )
    val otherUser = AuthenticatedUser(
      uid = "other_user_22",
      displayName = "অন্য ইউজার",
      email = "someone.else@example.com"
    )

    assertTrue("Post creator should be allowed to modify", canUserModifyProduct(samplePost, ownerUser))
    assertTrue("Admin should be allowed to modify any post", canUserModifyProduct(samplePost, adminUser))
    assertEquals("Other regular user must NOT be allowed to modify", false, canUserModifyProduct(samplePost, otherUser))
    assertEquals("Guest (null user) must NOT be allowed to modify", false, canUserModifyProduct(samplePost, null))
  }
}
