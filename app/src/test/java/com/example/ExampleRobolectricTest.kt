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
}
