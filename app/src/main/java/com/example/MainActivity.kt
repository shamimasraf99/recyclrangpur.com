package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.material.icons.automirrored.filled.Logout
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
  POST_AD
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

  // Preloader state: show animated preloader on launch for 1.2 seconds
  var showPreloader by remember { mutableStateOf(true) }
  LaunchedEffect(Unit) {
    delay(1200L)
    showPreloader = false
  }

  // Navigation State
  var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
  var productToEdit by remember { mutableStateOf<MarketProduct?>(null) }
  var selectedProductForDetail by remember { mutableStateOf<MarketProduct?>(null) }

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

  // Helper to open Post Ad (with guest auth gate)
  fun handleStartPostAd(editTarget: MarketProduct? = null) {
    if (currentUser == null) {
      pendingActionAfterAuth = {
        productToEdit = editTarget
        currentScreen = AppScreen.POST_AD
      }
      showAuthModal = true
    } else {
      productToEdit = editTarget
      currentScreen = AppScreen.POST_AD
    }
  }

  Box(modifier = Modifier.fillMaxSize()) {
    Scaffold(
      modifier = Modifier.fillMaxSize(),
      topBar = {
        BikroyStyleHeader(
          isBangla = isBangla,
          currentUser = currentUser,
          selectedAreaName = if (isBangla) RANGPUR_CITY_AREAS[selectedAreaIdx].first else RANGPUR_CITY_AREAS[selectedAreaIdx].second,
          searchQuery = searchQuery,
          onSearchQueryChange = { searchQuery = it },
          onOpenLocationSelector = { showLocationSheet = true },
          onToggleLanguage = { isBangla = !isBangla },
          onAuthClick = {
            if (currentUser == null) {
              pendingActionAfterAuth = null
              showAuthModal = true
            } else {
              authManager.signOut()
            }
          }
        )
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
              // 1. Bikroy-Style Clean Category Grid (3x2 neatly organized)
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

              // 3. Featured Ads Carousel (Kept as user confirmed it's good)
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
                    selectedProductForDetail = product
                  }
                )
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
                BikroyListingCard(
                  product = product,
                  isBangla = isBangla,
                  isSaved = activeSavedIds.contains(product.id),
                  onToggleSave = {
                    val isSaved = activeSavedIds.contains(product.id)
                    localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
                    if (currentUser != null) {
                      viewModel.toggleSavedProduct(product, isSaved)
                    }
                  },
                  onClick = { selectedProductForDetail = product },
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
              defaultSellerName = currentUser?.displayName ?: "রংপুরের বিক্রেতা",
              defaultSellerPhone = currentUser?.phone ?: "01711223344",
              onPublishProduct = { newProduct ->
                if (currentUser != null) {
                  viewModel.publishOrUpdateProduct(newProduct) {
                    allProducts = listOf(newProduct) + allProducts.filter { it.id != newProduct.id }
                  }
                } else {
                  allProducts = listOf(newProduct) + allProducts.filter { it.id != newProduct.id }
                }
                currentScreen = AppScreen.HOME
              },
              onCancel = {
                currentScreen = AppScreen.HOME
              }
            )
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

    // Product Detail Sheet Dialog
    selectedProductForDetail?.let { product ->
      ProductDetailDialog(
        product = product,
        isBangla = isBangla,
        isSaved = activeSavedIds.contains(product.id),
        onToggleSave = {
          val isSaved = activeSavedIds.contains(product.id)
          localSavedIds = if (isSaved) localSavedIds - product.id else localSavedIds + product.id
          if (currentUser != null) {
            viewModel.toggleSavedProduct(product, isSaved)
          }
        },
        onAddPhotoToProduct = { newPhoto ->
          val updated = product.copy(photos = product.photos + newPhoto)
          allProducts = allProducts.map { if (it.id == product.id) updated else it }
          selectedProductForDetail = updated
          if (currentUser != null && !product.firestoreDocId.isNullOrBlank()) {
            viewModel.publishOrUpdateProduct(updated) {}
          }
        },
        onEditListingWithPhotos = {
          selectedProductForDetail = null
          handleStartPostAd(product)
        },
        onDismiss = { selectedProductForDetail = null }
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
 * Bikroy.com styled top navigation header with integrated search and location.
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
  onAuthClick: () -> Unit
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
      // Brand Name with location subtitle
      Column(
        modifier = Modifier.clickable { onOpenLocationSelector() }
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Text(
            text = "Recycl Rangpur",
            style = MaterialTheme.typography.titleLarge.copy(
              fontWeight = FontWeight.ExtraBold,
              fontSize = 20.sp
            ),
            color = Color.White
          )
        }
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
              fontSize = 12.sp
            ),
            color = Color(0xFFFFD166)
          )
        }
      }

      // Actions: Language Toggle & User Button
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        // Language Toggle Pill
        Surface(
          shape = RoundedCornerShape(12.dp),
          color = Color.White.copy(alpha = 0.2f),
          modifier = Modifier.clickable { onToggleLanguage() }.testTag("language_toggle_button")
        ) {
          Text(
            text = if (isBangla) "English" else "বাংলা",
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
          )
        }

        // Profile / Login Button
        if (currentUser == null) {
          Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFFFFD166),
            modifier = Modifier.clickable { onAuthClick() }.testTag("navbar_login_button")
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
          Surface(
            shape = RoundedCornerShape(14.dp),
            color = Color.White.copy(alpha = 0.22f),
            modifier = Modifier.clickable { onAuthClick() }.testTag("navbar_user_profile_chip")
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(20.dp)
                  .clip(CircleShape)
                  .background(Color.White),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = currentUser.displayName.take(1).uppercase(),
                  color = Color(0xFF007A64),
                  fontWeight = FontWeight.Bold,
                  fontSize = 11.sp
                )
              }
              Text(
                text = currentUser.displayName.take(7),
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
              Icon(
                imageVector = Icons.AutoMirrored.Filled.Logout,
                contentDescription = "লগআউট",
                tint = Color.White.copy(alpha = 0.8f),
                modifier = Modifier.size(12.dp)
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
 * Neat, organized Bikroy-style 3x2 Category Grid with clear icons and labels.
 */
@Composable
fun BikroyCategoryGrid(
  isBangla: Boolean,
  selectedCategoryIdx: Int,
  onSelectCategory: (Int) -> Unit
) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 14.dp, vertical = 8.dp),
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
  ) {
    Column(modifier = Modifier.padding(12.dp)) {
      Text(
        text = if (isBangla) "ক্যাটাগরি সমূহ" else "All Categories",
        fontWeight = FontWeight.Bold,
        fontSize = 15.sp,
        color = Color(0xFF1E293B),
        modifier = Modifier.padding(bottom = 10.dp, start = 4.dp)
      )

      // 3x2 Grid
      val rows = BIKROY_CATEGORY_LIST.chunked(3)
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
    "phone" -> Icons.Default.PhoneAndroid
    "laptop" -> Icons.Default.Laptop
    "bike" -> Icons.Default.TwoWheeler
    "tv" -> Icons.Default.Tv
    "furniture" -> Icons.Default.Weekend
    else -> Icons.Default.Widgets
  }

  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = modifier
      .padding(horizontal = 4.dp)
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
    // Tinted circular icon container
    Box(
      modifier = Modifier
        .size(46.dp)
        .clip(CircleShape)
        .background(Color(item.accentColor).copy(alpha = if (isSelected) 0.25f else 0.12f)),
      contentAlignment = Alignment.Center
    ) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        tint = Color(item.accentColor),
        modifier = Modifier.size(24.dp)
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
 * Bikroy-style horizontal listing card. Clean, uncluttered, professional e-commerce card.
 */
@Composable
fun BikroyListingCard(
  product: MarketProduct,
  isBangla: Boolean,
  isSaved: Boolean,
  onToggleSave: () -> Unit,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val primaryPhoto = product.photos.firstOrNull() ?: ProductPhoto(
    id = "card_photo_${product.id}",
    studioPresetId = product.categoryId.coerceIn(1, 8)
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

        // Condition badge
        Surface(
          shape = RoundedCornerShape(4.dp),
          color = Color(0xFFF1F5F9),
          modifier = Modifier.padding(top = 1.dp)
        ) {
          Text(
            text = product.condition,
            fontSize = 11.sp,
            color = Color(0xFF475569),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
          )
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
            color = Color(0xFF007A64) // Signature Bikroy Price color
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
