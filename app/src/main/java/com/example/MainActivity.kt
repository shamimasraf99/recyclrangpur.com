package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.theme.RecyclRangpurTheme
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      RecyclRangpurTheme {
        RecyclRangpurApp()
      }
    }
  }
}

enum class AppScreen {
  HOME,
  POST_AD,
  PROFILE_DASHBOARD,
  PRODUCT_DETAIL
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecyclRangpurApp() {
  val context = LocalContext.current

  // Language state: true = Bangla (বাংলা), false = English
  var isBangla by remember { mutableStateOf(true) }

  // Authentication & Guest Mode state
  var currentUser by remember { mutableStateOf<AuthenticatedUser?>(null) }
  val authManager = remember {
    GoogleAuthManager(context) { user ->
      currentUser = user
    }
  }

  // Preloader state: show animated preloader on launch for 900ms
  var showPreloader by remember { mutableStateOf(true) }
  // Startup Safety Warning Popup: opens immediately when the app opens!
  var showStartupSafetyPopup by remember { mutableStateOf(true) }
  // AdMob App Open Ad Modal state
  var showAppOpenAdModal by remember { mutableStateOf(false) }

  LaunchedEffect(Unit) {
    delay(900L)
    showPreloader = false
  }

  // Navigation State
  var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
  var previousScreenBeforeDetail by remember { mutableStateOf(AppScreen.HOME) }
  var previousScreenBeforePostAd by remember { mutableStateOf(AppScreen.HOME) }
  var productToEdit by remember { mutableStateOf<MarketProduct?>(null) }
  var selectedProductForDetail by remember { mutableStateOf<MarketProduct?>(null) }

  // Admin Panel Mode inside Dashboard
  var isAdminPanelActive by remember { mutableStateOf(true) }

  // APK Update Configuration & Popup State controlled by Admin Panel
  var apkUpdateConfig by remember { mutableStateOf(ApkUpdateConfig()) }
  var showApkUpdatePopup by remember { mutableStateOf(false) }

  // Managed Platform Users for Admin User Management Panel
  var managedUsers by remember { mutableStateOf(INITIAL_PLATFORM_USERS) }

  // Sync current logged-in user into managedUsers list
  LaunchedEffect(currentUser) {
    val u = currentUser
    if (u != null && managedUsers.none { it.email.equals(u.email, ignoreCase = true) || it.uid == u.uid }) {
      val newManaged = ManagedPlatformUser(
        uid = u.uid,
        name = u.displayName,
        email = u.email,
        phone = u.phone ?: "01711223344",
        areaBn = "রংপুর শহর",
        role = if (u.email.equals(ADMIN_EMAIL, ignoreCase = true)) "Admin" else "Verified Seller",
        isVerified = true,
        isBlocked = false,
        adsCount = 1,
        joinedAgoBn = "সক্রিয় ইউজার"
      )
      managedUsers = listOf(newManaged) + managedUsers
    }
  }

  // Ensure Profile Dashboard is never shown when logged out
  LaunchedEffect(currentUser, currentScreen) {
    if (currentUser == null && currentScreen == AppScreen.PROFILE_DASHBOARD) {
      currentScreen = AppScreen.HOME
    }
  }

  // Auth Modal State
  var showAuthModal by remember { mutableStateOf(false) }
  var pendingActionAfterAuth by remember { mutableStateOf<(() -> Unit)?>(null) }

  // Global Search State in Navbar
  var searchQuery by remember { mutableStateOf("") }

  // Location selector sheet state
  var showLocationSheet by remember { mutableStateOf(false) }

  // Category and Rangpur Area filters
  var selectedCategoryIdx by remember { mutableIntStateOf(0) }
  var selectedAreaIdx by remember { mutableIntStateOf(0) }

  // In-memory products combined with sample items
  var allProducts by remember { mutableStateOf(SAMPLE_PRODUCTS) }

  // Repository & ViewModel for Firebase Firestore sync
  val repository = remember { RecyclRangpurRepository(context) }
  val viewModel = remember(currentUser?.uid) {
    val uid = currentUser?.uid ?: "guest_user"
    RecyclRangpurViewModel(repository, uid)
  }

  val userListingsUiState by viewModel.userListingsState.collectAsStateWithLifecycle()
  val savedProductIdsUiState by viewModel.savedProductIdsState.collectAsStateWithLifecycle()

  // Merge Firestore listings with local products
  LaunchedEffect(userListingsUiState) {
    if (userListingsUiState is UiState.Success) {
      val remoteItems = (userListingsUiState as UiState.Success<List<MarketProduct>>).data
      if (remoteItems.isNotEmpty()) {
        val nonRemote = allProducts.filter { it.firestoreDocId == null }
        allProducts = remoteItems + nonRemote
      }
    }
  }

  // Active saved items set
  var localSavedIds by remember { mutableStateOf(setOf(1, 3)) }
  val activeSavedIds = remember(localSavedIds, savedProductIdsUiState) {
    if (savedProductIdsUiState is UiState.Success) {
      localSavedIds + (savedProductIdsUiState as UiState.Success<Set<Int>>).data
    } else {
      localSavedIds
    }
  }

  // Filtered products across the marketplace by Search Query, Category, and Rangpur Area
  val displayedProducts = remember(allProducts, searchQuery, selectedCategoryIdx, selectedAreaIdx) {
    allProducts.filter { product ->
      val matchesSearch = if (searchQuery.isBlank()) {
        true
      } else {
        val query = searchQuery.trim().lowercase()
        product.titleBn.lowercase().contains(query) ||
          product.titleEn.lowercase().contains(query) ||
          product.descriptionBn.lowercase().contains(query) ||
          product.descriptionEn.lowercase().contains(query) ||
          product.locationBn.lowercase().contains(query) ||
          product.locationEn.lowercase().contains(query) ||
          product.sellerName.lowercase().contains(query)
      }

      val matchesCategory = if (selectedCategoryIdx == 0) {
        true
      } else {
        product.categoryId == selectedCategoryIdx
      }

      val matchesArea = if (selectedAreaIdx == 0) {
        true
      } else {
        product.areaIndex == selectedAreaIdx || product.districtBn.contains(RANGPUR_CITY_AREAS[selectedAreaIdx].first)
      }

      matchesSearch && matchesCategory && matchesArea
    }
  }

  // Featured ads for the carousel
  val featuredProducts = remember(allProducts) {
    allProducts.filter { it.isFeatured }.ifEmpty { allProducts.take(4) }
  }

  // Helper to open full-page E-Commerce Product Detail Screen
  fun openProductDetailPage(product: MarketProduct) {
    if (currentScreen != AppScreen.PRODUCT_DETAIL) {
      previousScreenBeforeDetail = currentScreen
    }
    selectedProductForDetail = product
    currentScreen = AppScreen.PRODUCT_DETAIL
  }

  // Helper to open Post Ad (with guest auth gate AND strict ownership/admin check for edits)
  fun handleStartPostAd(editTarget: MarketProduct? = null, allowAdminOverride: Boolean = false) {
    if (currentUser == null) {
      pendingActionAfterAuth = {
        if (editTarget == null || canUserModifyProduct(editTarget, currentUser, allowAdminOverride)) {
          previousScreenBeforePostAd = currentScreen
          productToEdit = editTarget
          currentScreen = AppScreen.POST_AD
        }
      }
      showAuthModal = true
    } else {
      if (editTarget != null && !canUserModifyProduct(editTarget, currentUser, allowAdminOverride)) {
        return
      }
      previousScreenBeforePostAd = currentScreen
      productToEdit = editTarget
      currentScreen = AppScreen.POST_AD
    }
  }

  // Helper to delete a product (only owner or admin)
  fun handleDeleteProduct(target: MarketProduct, allowAdminOverride: Boolean = false) {
    if (!canUserModifyProduct(target, currentUser, allowAdminOverride)) return
    allProducts = allProducts.filter { it.id != target.id }
    if (selectedProductForDetail?.id == target.id) {
      selectedProductForDetail = null
      if (currentScreen == AppScreen.PRODUCT_DETAIL) {
        currentScreen = previousScreenBeforeDetail
      }
    }
    if (currentUser != null && !target.firestoreDocId.isNullOrBlank()) {
      viewModel.deleteProduct(target)
    }
  }

  Box(modifier = Modifier.fillMaxSize()) {
    Scaffold(
      modifier = Modifier.fillMaxSize(),
      topBar = {
        if (currentScreen != AppScreen.PRODUCT_DETAIL) {
          BikroyStyleHeader(
            isBangla = isBangla,
            currentUser = currentUser,
            selectedAreaName = if (isBangla) RANGPUR_CITY_AREAS[selectedAreaIdx].first else RANGPUR_CITY_AREAS[selectedAreaIdx].second,
            searchQuery = searchQuery,
            onSearchQueryChange = {
              searchQuery = it
              if (currentScreen != AppScreen.HOME && it.isNotBlank()) {
                currentScreen = AppScreen.HOME
              }
            },
            onOpenLocationSelector = { showLocationSheet = true },
            onToggleLanguage = { isBangla = !isBangla },
            onAuthOrProfileClick = {
              if (currentUser == null) {
                pendingActionAfterAuth = null
                showAuthModal = true
              } else {
                currentScreen = AppScreen.PROFILE_DASHBOARD
              }
            }
          )
        }
      },
      bottomBar = {
        if (currentScreen != AppScreen.PRODUCT_DETAIL) {
          NavigationBar(
            containerColor = Color.White,
            tonalElevation = 6.dp,
            modifier = Modifier.testTag("bottom_navigation_bar")
          ) {
            NavigationBarItem(
              selected = currentScreen == AppScreen.HOME,
              onClick = { currentScreen = AppScreen.HOME },
              icon = {
                Icon(
                  imageVector = if (currentScreen == AppScreen.HOME) Icons.Default.Home else Icons.Default.Storefront,
                  contentDescription = "Home"
                )
              },
              label = {
                Text(
                  text = if (isBangla) "হোম মার্কেট" else "Home",
                  fontWeight = FontWeight.Bold,
                  fontSize = 11.sp
                )
              },
              colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF007A64),
                selectedTextColor = Color(0xFF007A64),
                indicatorColor = Color(0xFF007A64).copy(alpha = 0.12f)
              ),
              modifier = Modifier.testTag("nav_home_tab")
            )

            NavigationBarItem(
              selected = currentScreen == AppScreen.POST_AD,
              onClick = { handleStartPostAd(null) },
              icon = {
                Icon(
                  imageVector = Icons.Default.AddCircle,
                  contentDescription = "Post Ad"
                )
              },
              label = {
                Text(
                  text = if (isBangla) "বিজ্ঞাপন দিন" else "Post Ad",
                  fontWeight = FontWeight.Bold,
                  fontSize = 11.sp
                )
              },
              colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF007A64),
                selectedTextColor = Color(0xFF007A64),
                indicatorColor = Color(0xFF007A64).copy(alpha = 0.12f)
              ),
              modifier = Modifier.testTag("nav_post_ad_tab")
            )

            // Before login: show Login button (no Panel). After login: hide Login button and show User/Admin Panel!
            if (currentUser == null) {
              NavigationBarItem(
                selected = false,
                onClick = {
                  pendingActionAfterAuth = null
                  showAuthModal = true
                },
                icon = {
                  Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Login"
                  )
                },
                label = {
                  Text(
                    text = if (isBangla) "লগইন" else "Login",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                  )
                },
                colors = NavigationBarItemDefaults.colors(
                  selectedIconColor = Color(0xFF007A64),
                  selectedTextColor = Color(0xFF007A64),
                  indicatorColor = Color(0xFF007A64).copy(alpha = 0.12f)
                ),
                modifier = Modifier.testTag("nav_login_tab")
              )
            } else {
              NavigationBarItem(
                selected = currentScreen == AppScreen.PROFILE_DASHBOARD,
                onClick = { currentScreen = AppScreen.PROFILE_DASHBOARD },
                icon = {
                  Icon(
                    imageVector = Icons.Default.AdminPanelSettings,
                    contentDescription = "User & Admin Panel"
                  )
                },
                label = {
                  Text(
                    text = if (isBangla) "ইউজার প্যানেল" else "User Panel",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                  )
                },
                colors = NavigationBarItemDefaults.colors(
                  selectedIconColor = Color(0xFF007A64),
                  selectedTextColor = Color(0xFF007A64),
                  indicatorColor = Color(0xFF007A64).copy(alpha = 0.12f)
                ),
                modifier = Modifier.testTag("nav_profile_dashboard_tab")
              )
            }
          }
        }
      },
      floatingActionButton = {
        if (currentScreen == AppScreen.HOME) {
          ExtendedFloatingActionButton(
            onClick = { handleStartPostAd(null) },
            icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(22.dp)) },
            text = {
              Text(
                text = if (isBangla) "বিজ্ঞাপন দিন" else "Post Ad",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
              )
            },
            containerColor = Color(0xFF007A64),
            contentColor = Color.White,
            modifier = Modifier.testTag("post_ad_fab")
          )
        }
      }
    ) { innerPadding ->
      Box(
        modifier = Modifier
          .fillMaxSize()
          .padding(innerPadding)
      ) {
        when (currentScreen) {
          AppScreen.HOME -> {
            LazyColumn(
              modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .testTag("home_marketplace_list"),
              contentPadding = PaddingValues(bottom = 90.dp)
            ) {
              // 1. Bikroy-Style Clean Category Grid (All 11 items including Pets, Clothing, Cosmetics, Food, Others)
              item(key = "categories_section") {
                BikroyCategoryGrid(
                  isBangla = isBangla,
                  selectedCategoryIdx = selectedCategoryIdx,
                  onSelectCategory = { selectedCategoryIdx = it }
                )
              }

              // 2. Location quick-pills row
              item(key = "quick_location_row") {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.SpaceBetween
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    Icon(
                      imageVector = Icons.Default.LocationOn,
                      contentDescription = null,
                      tint = Color(0xFF007A64),
                      modifier = Modifier.size(16.dp)
                    )
                    Text(
                      text = if (isBangla) "রংপুর সিটি এলাকা" else "Rangpur City Areas",
                      style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                      ),
                      color = Color(0xFF334155)
                    )
                  }

                  Text(
                    text = if (isBangla) "সব এলাকা ▾" else "All Areas ▾",
                    style = MaterialTheme.typography.labelSmall.copy(
                      fontWeight = FontWeight.Bold,
                      fontSize = 12.sp
                    ),
                    color = Color(0xFF007A64),
                    modifier = Modifier.clickable { showLocationSheet = true }
                  )
                }

                LazyRow(
                  contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                  horizontalArrangement = Arrangement.spacedBy(8.dp),
                  modifier = Modifier.fillMaxWidth()
                ) {
                  items(RANGPUR_CITY_AREAS.indices.toList()) { idx ->
                    val pair = RANGPUR_CITY_AREAS[idx]
                    val isSelected = selectedAreaIdx == idx
                    Surface(
                      shape = RoundedCornerShape(20.dp),
                      color = if (isSelected) Color(0xFF007A64) else Color.White,
                      border = androidx.compose.foundation.BorderStroke(
                        width = 1.dp,
                        color = if (isSelected) Color(0xFF007A64) else Color(0xFFE2E8F0)
                      ),
                      modifier = Modifier
                        .clickable { selectedAreaIdx = idx }
                        .testTag("area_chip_$idx")
                    ) {
                      Text(
                        text = if (isBangla) pair.first else pair.second,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) Color.White else Color(0xFF475569),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                      )
                    }
                  }
                }
              }

              // 3. Featured Ads Carousel
              item(key = "featured_carousel") {
                FeaturedAdsCarousel(
                  featuredProducts = featuredProducts,
                  isBangla = isBangla,
                  savedProductIds = activeSavedIds,
                  onToggleSave = { product ->
                    val isSaved = activeSavedIds.contains(product.id)
                    localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
                    if (currentUser != null) {
                      viewModel.toggleSavedProduct(product, isSaved)
                    }
                  },
                  onProductClick = { product ->
                    openProductDetailPage(product)
                  }
                )
              }

              // Google AdMob Native Ad Bar (Live Rotating)
              item(key = "admob_native_bar") {
                AdMobNativeAdBar(isBangla = isBangla)
              }

              // 4. Feed Section Header
              item(key = "feed_header") {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                  ) {
                    Text(
                      text = if (isBangla) "সকল বিজ্ঞাপন" else "All Listings",
                      style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                      ),
                      color = Color(0xFF0F172A)
                    )
                    Surface(
                      shape = RoundedCornerShape(10.dp),
                      color = Color(0xFFE2E8F0)
                    ) {
                      Text(
                        text = "${displayedProducts.size}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = Color(0xFF334155),
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                      )
                    }
                  }

                  if (selectedCategoryIdx != 0 || selectedAreaIdx != 0 || searchQuery.isNotBlank()) {
                    Text(
                      text = if (isBangla) "ফিল্টার সাফ করুন" else "Clear filters",
                      style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp
                      ),
                      color = Color(0xFF007A64),
                      modifier = Modifier.clickable {
                        selectedCategoryIdx = 0
                        selectedAreaIdx = 0
                        searchQuery = ""
                      }
                    )
                  }
                }
              }

              // 5. Empty State
              if (displayedProducts.isEmpty()) {
                item(key = "empty_listings") {
                  Card(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp)
                  ) {
                    Column(
                      modifier = Modifier
                        .fillMaxWidth()
                        .padding(28.dp),
                      horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                      Icon(
                        imageVector = Icons.Default.SearchOff,
                        contentDescription = null,
                        tint = Color(0xFF94A3B8),
                        modifier = Modifier.size(44.dp)
                      )
                      Spacer(modifier = Modifier.height(8.dp))
                      Text(
                        text = if (isBangla) "কোনো বিজ্ঞাপন মেলেনি" else "No matching ads",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color(0xFF1E293B)
                      )
                      Text(
                        text = if (isBangla) "অন্য ক্যাটাগরি বা এলাকা নির্বাচন করে দেখুন" else "Try another category or area filter",
                        fontSize = 13.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(top = 4.dp)
                      )
                    }
                  }
                }
              }

              // 6. Bikroy-Style Listings Cards
              items(
                items = displayedProducts,
                key = { "product_${it.id}_${it.firestoreDocId ?: ""}" }
              ) { product ->
                val canModify = canUserModifyProduct(product, currentUser)
                BikroyListingCard(
                  product = product,
                  isBangla = isBangla,
                  isSaved = activeSavedIds.contains(product.id),
                  canModify = canModify,
                  onToggleSave = {
                    val isSaved = activeSavedIds.contains(product.id)
                    localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
                    if (currentUser != null) {
                      viewModel.toggleSavedProduct(product, isSaved)
                    }
                  },
                  onEditClick = { handleStartPostAd(product) },
                  onClick = { openProductDetailPage(product) },
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp)
                )
              }
            }
          }

          AppScreen.POST_AD -> {
            PostAdScreen(
              isBangla = isBangla,
              initialProductToEdit = productToEdit,
              currentUser = currentUser,
              defaultSellerName = currentUser?.displayName ?: "রংপুরের বিক্রেতা",
              defaultSellerPhone = currentUser?.phone ?: "01711223344",
              onPublishProduct = { newProduct ->
                val stampedProduct = newProduct.copy(
                  ownerUid = newProduct.ownerUid.ifBlank { currentUser?.uid ?: "" },
                  ownerEmail = newProduct.ownerEmail.ifBlank { currentUser?.email ?: "" }
                )
                if (currentUser != null) {
                  viewModel.publishOrUpdateProduct(stampedProduct) {
                    allProducts = listOf(stampedProduct) + allProducts.filter { it.id != stampedProduct.id }
                  }
                } else {
                  allProducts = listOf(stampedProduct) + allProducts.filter { it.id != stampedProduct.id }
                }
                if (selectedProductForDetail?.id == stampedProduct.id) {
                  selectedProductForDetail = stampedProduct
                }
                currentScreen = if (previousScreenBeforePostAd == AppScreen.PROFILE_DASHBOARD && currentUser != null) {
                  AppScreen.PROFILE_DASHBOARD
                } else {
                  AppScreen.HOME
                }
              },
              onCancel = {
                currentScreen = if (previousScreenBeforePostAd == AppScreen.PROFILE_DASHBOARD && currentUser != null) {
                  AppScreen.PROFILE_DASHBOARD
                } else {
                  AppScreen.HOME
                }
              }
            )
          }

          AppScreen.PROFILE_DASHBOARD -> {
            UserDashboardScreen(
              isBangla = isBangla,
              currentUser = currentUser,
              isAdminPanelActive = isAdminPanelActive,
              onToggleAdminPanelMode = { isAdminPanelActive = it },
              allProducts = allProducts,
              managedUsers = managedUsers,
              savedProductIds = activeSavedIds,
              onPostNewAd = { handleStartPostAd(null) },
              onEditProduct = { product -> handleStartPostAd(product, allowAdminOverride = isAdminPanelActive) },
              onDeleteProduct = { product -> handleDeleteProduct(product, allowAdminOverride = isAdminPanelActive) },
              onToggleFeaturedProduct = { product ->
                allProducts = allProducts.map {
                  if (it.id == product.id) it.copy(isFeatured = !it.isFeatured) else it
                }
              },
              onProductClick = { product -> openProductDetailPage(product) },
              onToggleSave = { product ->
                val isSaved = activeSavedIds.contains(product.id)
                localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
                if (currentUser != null) {
                  viewModel.toggleSavedProduct(product, isSaved)
                }
              },
              onAddOrUpdateUser = { updatedUser ->
                val exists = managedUsers.any { it.uid == updatedUser.uid }
                managedUsers = if (exists) {
                  managedUsers.map { if (it.uid == updatedUser.uid) updatedUser else it }
                } else {
                  listOf(updatedUser) + managedUsers
                }
              },
              onToggleVerifyUser = { targetUser ->
                managedUsers = managedUsers.map {
                  if (it.uid == targetUser.uid) it.copy(isVerified = !it.isVerified) else it
                }
              },
              onToggleBlockUser = { targetUser ->
                managedUsers = managedUsers.map {
                  if (it.uid == targetUser.uid) it.copy(isBlocked = !it.isBlocked) else it
                }
              },
              onDeleteUser = { targetUser ->
                managedUsers = managedUsers.filter { it.uid != targetUser.uid }
              },
              onTriggerAppOpenAd = { showAppOpenAdModal = true },
              onTriggerSafetyPopup = { showStartupSafetyPopup = true },
              apkUpdateConfig = apkUpdateConfig,
              onUpdateApkConfig = { newConfig ->
                apkUpdateConfig = newConfig
              },
              onTriggerApkUpdatePopup = { showApkUpdatePopup = true },
              onLogoutClick = {
                authManager.signOut()
                currentScreen = AppScreen.HOME
              },
              onBackToHome = {
                currentScreen = AppScreen.HOME
              }
            )
          }

          AppScreen.PRODUCT_DETAIL -> {
            val product = selectedProductForDetail
            if (product == null) {
              currentScreen = AppScreen.HOME
            } else {
              val canModify = canUserModifyProduct(product, currentUser)
              ProductDetailScreen(
                product = product,
                allProducts = allProducts,
                isBangla = isBangla,
                isSaved = activeSavedIds.contains(product.id),
                canModify = canModify,
                onToggleSave = {
                  val isSaved = activeSavedIds.contains(product.id)
                  localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
                  if (currentUser != null) {
                    viewModel.toggleSavedProduct(product, isSaved)
                  }
                },
                onAddPhotoToProduct = { newPhoto ->
                  if (canModify) {
                    val updated = product.copy(photos = product.photos + newPhoto)
                    allProducts = allProducts.map { if (it.id == product.id) updated else it }
                    selectedProductForDetail = updated
                    if (currentUser != null && !product.firestoreDocId.isNullOrBlank()) {
                      viewModel.publishOrUpdateProduct(updated) {}
                    }
                  }
                },
                onEditListingWithPhotos = {
                  if (canModify) {
                    handleStartPostAd(product)
                  }
                },
                onDeleteListing = if (canModify) {
                  { handleDeleteProduct(product) }
                } else null,
                onSelectOtherProduct = { otherProduct ->
                  selectedProductForDetail = otherProduct
                },
                onBack = {
                  currentScreen = if (previousScreenBeforeDetail == AppScreen.PROFILE_DASHBOARD && currentUser != null) {
                    AppScreen.PROFILE_DASHBOARD
                  } else {
                    AppScreen.HOME
                  }
                }
              )
            }
          }
        }
      }
    }

    // Location Selector Bottom Sheet Dialog
    if (showLocationSheet) {
      RangpurLocationSheet(
        isBangla = isBangla,
        selectedAreaIdx = selectedAreaIdx,
        onSelectArea = { idx ->
          selectedAreaIdx = idx
          showLocationSheet = false
        },
        onDismiss = { showLocationSheet = false }
      )
    }

    // Auth Modal (Google & Email/Password - Clean & Professional)
    RecyclRangpurAuthModal(
      isOpen = showAuthModal,
      isBangla = isBangla,
      authManager = authManager,
      onSuccess = { authedUser ->
        currentUser = authedUser
        showAuthModal = false
        pendingActionAfterAuth?.invoke()
        pendingActionAfterAuth = null
      },
      onDismiss = {
        showAuthModal = false
        pendingActionAfterAuth = null
      }
    )

    // AdMob App Open Ad Overlay
    AdMobAppOpenAdModal(
      isOpen = showAppOpenAdModal,
      isBangla = isBangla,
      onDismiss = { showAppOpenAdModal = false }
    )

    // Startup Safety Warning Popup (“অগ্রমী লেনদেন করা থেকে বিরত থাকুন” / “সরাসরি দেখা করে পণ্য ক্রয় -বিক্রয় করুন ।”)
    SafetyNoticeStartupPopup(
      isOpen = showStartupSafetyPopup && !showPreloader,
      isBangla = isBangla,
      onDismiss = { showStartupSafetyPopup = false }
    )

    // In-App APK Update Popup Dialog controlled from Admin Panel
    if (showApkUpdatePopup) {
      ApkUpdatePopupDialog(
        apkConfig = apkUpdateConfig,
        isBangla = isBangla,
        onDismiss = { showApkUpdatePopup = false }
      )
    }

    // Animated Startup Preloader Overlay
    AnimatedVisibility(
      visible = showPreloader,
      enter = fadeIn(),
      exit = fadeOut()
    ) {
      RecyclRangpurPreloader(isBangla = isBangla)
    }
  }
}

/**
 * Bikroy.com styled top navigation header.
 * Before login: shows ONLY the Login button (no Panel button).
 * After login: Login button is hidden and replaced by the User Profile / Panel button.
 */
@Composable
fun BikroyStyleHeader(
  isBangla: Boolean,
  currentUser: AuthenticatedUser?,
  selectedAreaName: String,
  searchQuery: String,
  onSearchQueryChange: (String) -> Unit,
  onOpenLocationSelector: () -> Unit,
  onToggleLanguage: () -> Unit,
  onAuthOrProfileClick: () -> Unit
) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .background(Color(0xFF007A64)) // Signature Bikroy Teal
      .testTag("global_navbar")
  ) {
    // 1. Top Brand & Actions Bar
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .statusBarsPadding()
        .padding(horizontal = 14.dp, vertical = 8.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      // Brand Name with logo and location subtitle
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.clickable { onOpenLocationSelector() }
      ) {
        Image(
          painter = painterResource(id = R.drawable.app_logo),
          contentDescription = "Recycle Bin Rangpur",
          modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(8.dp))
        )
        Column {
          Text(
            text = "Recycle Bin Rangpur",
            style = MaterialTheme.typography.titleMedium.copy(
              fontWeight = FontWeight.ExtraBold,
              fontSize = 16.sp
            ),
            color = Color.White
          )
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp)
          ) {
            Icon(
              imageVector = Icons.Default.LocationOn,
              contentDescription = null,
              tint = Color(0xFFFFD166),
              modifier = Modifier.size(13.dp)
            )
            Text(
              text = "$selectedAreaName ▾",
              style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp
              ),
              color = Color(0xFFFFD166)
            )
          }
        }
      }

      // Actions: Language Toggle & (Login button before login OR User Profile/Panel button after login)
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        // Language Toggle Pill
        Surface(
          shape = RoundedCornerShape(12.dp),
          color = Color.White.copy(alpha = 0.2f),
          modifier = Modifier
            .clickable { onToggleLanguage() }
            .testTag("language_toggle_button")
        ) {
          Text(
            text = if (isBangla) "English" else "বাংলা",
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
          )
        }

        if (currentUser == null) {
          // Before login: Show ONLY Login button (no Panel)
          Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFFFFD166),
            modifier = Modifier
              .clickable { onAuthOrProfileClick() }
              .testTag("navbar_login_button")
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
              Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                tint = Color(0xFF0F172A),
                modifier = Modifier.size(14.dp)
              )
              Text(
                text = if (isBangla) "লগইন" else "Login",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = Color(0xFF0F172A)
              )
            }
          }
        } else {
          // After login: Hide Login button and show User Profile / Panel button
          Surface(
            shape = RoundedCornerShape(14.dp),
            color = Color(0xFFFFD166),
            modifier = Modifier
              .clickable { onAuthOrProfileClick() }
              .testTag("navbar_user_profile_chip")
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(22.dp)
                  .clip(CircleShape)
                  .background(Color(0xFF007A64)),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = currentUser.displayName.take(1).uppercase(),
                  color = Color.White,
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 11.sp
                )
              }
              Text(
                text = if (isBangla) "প্রোফাইল প্যানেল" else "User Panel",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 12.sp,
                color = Color(0xFF0F172A),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
            }
          }
        }
      }
    }

    // 2. Global Search Box (Bikroy Style)
    Surface(
      shape = RoundedCornerShape(10.dp),
      color = Color.White,
      modifier = Modifier
        .fillMaxWidth()
        .padding(start = 14.dp, end = 14.dp, bottom = 10.dp)
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 12.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Icon(
          imageVector = Icons.Default.Search,
          contentDescription = null,
          tint = Color(0xFF007A64),
          modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        TextField(
          value = searchQuery,
          onValueChange = onSearchQueryChange,
          placeholder = {
            Text(
              text = if (isBangla) "রংপুরের ব্যবহৃত পণ্য খুঁজুন..." else "Search used items in Rangpur...",
              fontSize = 14.sp,
              color = Color(0xFF94A3B8)
            )
          },
          singleLine = true,
          colors = TextFieldDefaults.colors(
            focusedContainerColor = Color.Transparent,
            unfocusedContainerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent
          ),
          modifier = Modifier
            .weight(1f)
            .testTag("navbar_global_search_input")
        )
        if (searchQuery.isNotEmpty()) {
          IconButton(onClick = { onSearchQueryChange("") }, modifier = Modifier.size(26.dp)) {
            Icon(Icons.Default.Close, contentDescription = "মুছুন", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
          }
        }
      }
    }
  }
}

/**
 * Neat, organized Bikroy-style Category Grid that shows 8 categories initially
 * and hides the remaining categories behind a "See More / আরও দেখুন" button.
 */
@Composable
fun BikroyCategoryGrid(
  isBangla: Boolean,
  selectedCategoryIdx: Int,
  onSelectCategory: (Int) -> Unit
) {
  var showAllCategories by remember { mutableStateOf(false) }
  val initialVisibleCount = 8
  val hiddenCount = (BIKROY_CATEGORY_LIST.size - initialVisibleCount).coerceAtLeast(0)
  val visibleCategories = if (showAllCategories) {
    BIKROY_CATEGORY_LIST
  } else {
    BIKROY_CATEGORY_LIST.take(initialVisibleCount)
  }

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 14.dp, vertical = 8.dp),
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
  ) {
    Column(modifier = Modifier.padding(12.dp)) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(bottom = 10.dp, start = 4.dp, end = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(
          text = if (isBangla) "ক্যাটাগরি সমূহ" else "Browse Categories",
          fontWeight = FontWeight.Bold,
          fontSize = 15.sp,
          color = Color(0xFF1E293B)
        )
        if (hiddenCount > 0) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            modifier = Modifier
              .clip(RoundedCornerShape(8.dp))
              .clickable { showAllCategories = !showAllCategories }
              .padding(horizontal = 6.dp, vertical = 2.dp)
          ) {
            Text(
              text = if (showAllCategories) {
                if (isBangla) "কম দেখুন" else "See Less"
              } else {
                if (isBangla) "আরও দেখুন (+$hiddenCount)" else "See More (+$hiddenCount)"
              },
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF007A64)
            )
            Icon(
              imageVector = if (showAllCategories) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
              contentDescription = null,
              tint = Color(0xFF007A64),
              modifier = Modifier.size(16.dp)
            )
          }
        }
      }

      // 4-column responsive grid (2 rows = 8 categories by default)
      val columns = 4
      val rows = visibleCategories.chunked(columns)
      for (rowItems in rows) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          for (item in rowItems) {
            val isSelected = selectedCategoryIdx == item.id
            BikroyCategoryItemTile(
              item = item,
              isBangla = isBangla,
              isSelected = isSelected,
              onClick = { onSelectCategory(item.id) },
              modifier = Modifier.weight(1f)
            )
          }
          val remaining = columns - rowItems.size
          repeat(remaining) {
            Spacer(modifier = Modifier.weight(1f))
          }
        }
      }

      // Prominent "See More / আরও দেখুন" toggle bar below the 8 categories
      if (hiddenCount > 0) {
        Spacer(modifier = Modifier.height(6.dp))
        Surface(
          shape = RoundedCornerShape(10.dp),
          color = Color(0xFFF0FDF4),
          modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF007A64).copy(alpha = 0.22f), RoundedCornerShape(10.dp))
            .clickable { showAllCategories = !showAllCategories }
            .testTag("category_see_more_button")
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Text(
              text = if (showAllCategories) {
                if (isBangla) "কম ক্যাটাগরি দেখুন (See Less)" else "Show Fewer Categories (See Less)"
              } else {
                if (isBangla) "আরও দেখুন • বাকি ${hiddenCount}টি ক্যাটাগরি (See More)" else "See More Categories (+$hiddenCount)"
              },
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF007A64)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
              imageVector = if (showAllCategories) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
              contentDescription = null,
              tint = Color(0xFF007A64),
              modifier = Modifier.size(18.dp)
            )
          }
        }
      }
    }
  }
}

@Composable
fun BikroyCategoryItemTile(
  item: BikroyCategoryItem,
  isBangla: Boolean,
  isSelected: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val icon: ImageVector = when (item.iconType) {
    "all" -> Icons.Default.GridView
    "phone" -> Icons.Default.PhoneAndroid
    "laptop" -> Icons.Default.LaptopMac
    "bike" -> Icons.Default.TwoWheeler
    "tv" -> Icons.Default.Tv
    "furniture" -> Icons.Default.Weekend
    "pets" -> Icons.Default.Pets
    "clothing" -> Icons.Default.Checkroom
    "cosmetics" -> Icons.Default.AutoAwesome
    "food" -> Icons.Default.Restaurant
    "others" -> Icons.Default.Category
    else -> Icons.Default.Widgets
  }

  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = modifier
      .padding(horizontal = 3.dp)
      .clip(RoundedCornerShape(12.dp))
      .background(if (isSelected) Color(0xFF007A64).copy(alpha = 0.08f) else Color.Transparent)
      .border(
        width = if (isSelected) 1.5.dp else 0.dp,
        color = if (isSelected) Color(0xFF007A64) else Color.Transparent,
        shape = RoundedCornerShape(12.dp)
      )
      .clickable { onClick() }
      .padding(vertical = 8.dp)
      .testTag("category_chip_${item.id}")
  ) {
    Box(
      modifier = Modifier
        .size(44.dp)
        .clip(CircleShape)
        .background(Color(item.accentColor).copy(alpha = if (isSelected) 0.25f else 0.12f)),
      contentAlignment = Alignment.Center
    ) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        tint = Color(item.accentColor),
        modifier = Modifier.size(22.dp)
      )
    }

    Spacer(modifier = Modifier.height(6.dp))

    Text(
      text = if (isBangla) item.nameBn else item.nameEn,
      fontSize = 11.sp,
      fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
      color = if (isSelected) Color(0xFF007A64) else Color(0xFF334155),
      textAlign = TextAlign.Center,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis
    )
  }
}

/**
 * Bikroy-style horizontal listing card with owner/admin quick edit badge.
 */
@Composable
fun BikroyListingCard(
  product: MarketProduct,
  isBangla: Boolean,
  isSaved: Boolean,
  canModify: Boolean = false,
  onToggleSave: () -> Unit,
  onEditClick: () -> Unit = {},
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val primaryPhoto = product.photos.firstOrNull() ?: ProductPhoto(
    id = "card_photo_${product.id}",
    studioPresetId = product.categoryId.coerceIn(1, 13)
  )

  Card(
    modifier = modifier
      .shadow(elevation = 1.dp, shape = RoundedCornerShape(12.dp))
      .clip(RoundedCornerShape(12.dp))
      .clickable { onClick() }
      .testTag("market_product_card_${product.id}"),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    shape = RoundedCornerShape(12.dp)
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(10.dp),
      horizontalArrangement = Arrangement.spacedBy(12.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      // 100x100 Image container with photo count
      Box(
        modifier = Modifier
          .size(100.dp)
          .clip(RoundedCornerShape(10.dp))
      ) {
        ProductPhotoView(
          photo = primaryPhoto,
          modifier = Modifier.fillMaxSize(),
          showCaptionBadge = false,
          isBangla = isBangla
        )

        if (product.photos.size > 1) {
          Surface(
            modifier = Modifier
              .align(Alignment.BottomEnd)
              .padding(4.dp),
            shape = RoundedCornerShape(4.dp),
            color = Color.Black.copy(alpha = 0.65f)
          ) {
            Text(
              text = "📷 ${product.photos.size}",
              color = Color.White,
              fontSize = 9.sp,
              fontWeight = FontWeight.Bold,
              modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
            )
          }
        }
      }

      // Details
      Column(
        modifier = Modifier.weight(1f),
        verticalArrangement = Arrangement.spacedBy(3.dp)
      ) {
        // Title
        Text(
          text = if (isBangla) product.titleBn else product.titleEn,
          style = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
          ),
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
          color = Color(0xFF0F172A)
        )

        // Location & Time
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Text(
            text = if (isBangla) product.locationBn else product.locationEn,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            color = Color(0xFF64748B),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f, fill = false)
          )
          Text(
            text = "• ${if (isBangla) product.postedAgoBn else product.postedAgoEn}",
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
            color = Color(0xFF94A3B8)
          )
        }

        // Condition & Ownership badge row
        Row(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier.padding(top = 1.dp)
        ) {
          Surface(
            shape = RoundedCornerShape(4.dp),
            color = Color(0xFFF1F5F9)
          ) {
            Text(
              text = product.condition,
              fontSize = 11.sp,
              color = Color(0xFF475569),
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
          }

          if (canModify) {
            Surface(
              shape = RoundedCornerShape(4.dp),
              color = Color(0xFF007A64).copy(alpha = 0.12f),
              modifier = Modifier
                .clickable { onEditClick() }
                .testTag("card_edit_badge_${product.id}")
            ) {
              Row(
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp)
              ) {
                Icon(
                  imageVector = Icons.Default.Edit,
                  contentDescription = null,
                  tint = Color(0xFF007A64),
                  modifier = Modifier.size(11.dp)
                )
                Text(
                  text = if (isBangla) "এডিট" else "Edit",
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFF007A64)
                )
              }
            }
          }
        }

        // Price & Favorite row
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(top = 2.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = "Tk ${product.priceBdt}",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 17.sp,
            color = Color(0xFF007A64)
          )

          IconButton(
            onClick = onToggleSave,
            modifier = Modifier.size(28.dp)
          ) {
            Icon(
              imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
              contentDescription = null,
              tint = if (isSaved) Color(0xFFEF4444) else Color(0xFF94A3B8),
              modifier = Modifier.size(18.dp)
            )
          }
        }
      }
    }
  }
}

/**
 * Dedicated Location Picker Modal for Rangpur City neighborhoods.
 */
@Composable
fun RangpurLocationSheet(
  isBangla: Boolean,
  selectedAreaIdx: Int,
  onSelectArea: (Int) -> Unit,
  onDismiss: () -> Unit
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    confirmButton = {},
    title = {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        Icon(
          imageVector = Icons.Default.LocationOn,
          contentDescription = null,
          tint = Color(0xFF007A64)
        )
        Text(
          text = if (isBangla) "রংপুর শহরের এলাকা বাছুন" else "Select Rangpur City Area",
          fontWeight = FontWeight.Bold,
          fontSize = 17.sp
        )
      }
    },
    text = {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .heightIn(max = 400.dp)
      ) {
        Text(
          text = if (isBangla) "রংপুর সিটি কর্পোরেশনের এলাকা অনুযায়ী বিজ্ঞাপন ফিল্টার করুন:" else "Filter ads by Rangpur City neighborhood:",
          fontSize = 13.sp,
          color = Color(0xFF64748B),
          modifier = Modifier.padding(bottom = 8.dp)
        )

        LazyColumn {
          items(RANGPUR_CITY_AREAS.indices.toList()) { idx ->
            val area = RANGPUR_CITY_AREAS[idx]
            val isSelected = selectedAreaIdx == idx
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(if (isSelected) Color(0xFF007A64).copy(alpha = 0.1f) else Color.Transparent)
                .clickable { onSelectArea(idx) }
                .padding(horizontal = 12.dp, vertical = 10.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Text(
                text = if (isBangla) area.first else area.second,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                fontSize = 14.sp,
                color = if (isSelected) Color(0xFF007A64) else Color(0xFF1E293B)
              )
              if (isSelected) {
                Icon(
                  imageVector = Icons.Default.Check,
                  contentDescription = null,
                  tint = Color(0xFF007A64),
                  modifier = Modifier.size(18.dp)
                )
              }
            }
          }
        }
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) {
        Text(if (isBangla) "বন্ধ করুন" else "Close", color = Color(0xFF64748B))
      }
    }
  )
}
