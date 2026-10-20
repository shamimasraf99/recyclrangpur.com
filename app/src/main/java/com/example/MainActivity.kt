package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
import kotlinx.coroutines.launch

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
  val coroutineScope = rememberCoroutineScope()

  // Language state: true = Bangla (বাংলা), false = English
  var isBangla by remember { mutableStateOf(true) }

  // Authentication & Guest Mode state
  var currentUser by remember { mutableStateOf<AuthenticatedUser?>(null) }
  val authManager = remember {
    GoogleAuthManager(context) { user ->
      currentUser = user
    }
  }

  // Preloader state: show animated preloader on launch for 1.5 seconds
  var showPreloader by remember { mutableStateOf(true) }
  LaunchedEffect(Unit) {
    delay(1500L)
    showPreloader = false
  }

  // Navigation State
  var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
  var productToEdit by remember { mutableStateOf<MarketProduct?>(null) }
  var selectedProductForDetail by remember { mutableStateOf<MarketProduct?>(null) }

  // Auth Modal State
  var showAuthModal by remember { mutableStateOf(false) }
  var pendingActionAfterAuth by remember { mutableStateOf<(() -> Unit)?>(null) }
  var authModalTitle by remember { mutableStateOf("") }
  var authModalSubtitle by remember { mutableStateOf("") }

  // Global Search State in Navbar
  var searchQuery by remember { mutableStateOf("") }
  var isSearchExpandedInNavbar by remember { mutableStateOf(false) }

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
      // User is a guest: show auth modal
      authModalTitle = if (isBangla) "বিজ্ঞাপন দিতে লগইন বা সাইন আপ করুন" else "Sign In or Sign Up to Post an Ad"
      authModalSubtitle = if (isBangla) {
        "গেস্ট মুড থেকে সকল বিজ্ঞাপন দেখা যাবে। তবে নতুন বিজ্ঞাপন দিতে বা তথ্য সংরক্ষণ করতে লগইন করুন।"
      } else {
        "Guests can freely browse all listings. Please sign in with Google or Email to post ads."
      }
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
        RecyclRangpurNavbar(
          isBangla = isBangla,
          currentUser = currentUser,
          searchQuery = searchQuery,
          isSearchExpanded = isSearchExpandedInNavbar,
          onSearchQueryChange = { searchQuery = it },
          onToggleSearchExpanded = { isSearchExpandedInNavbar = !isSearchExpandedInNavbar },
          onToggleLanguage = { isBangla = !isBangla },
          onAuthClick = {
            if (currentUser == null) {
              authModalTitle = if (isBangla) "অ্যাকাউন্টে সাইন ইন করুন" else "Sign In to Your Account"
              authModalSubtitle = if (isBangla) {
                "গুগল কিংবা আপনার ইমেইল ও পাসওয়ার্ড দিয়ে সহজেই লগইন অথবা নতুন অ্যাকাউন্ট খুলুন।"
              } else {
                "Sign in with Google or use your Email and Password."
              }
              pendingActionAfterAuth = null
              showAuthModal = true
            } else {
              // Sign out option
              authManager.signOut()
            }
          }
        )
      },
      floatingActionButton = {
        if (currentScreen == AppScreen.HOME) {
          ExtendedFloatingActionButton(
            onClick = { handleStartPostAd(null) },
            icon = { Icon(Icons.Default.AddPhotoAlternate, contentDescription = null) },
            text = {
              Text(
                text = if (isBangla) "বিজ্ঞাপন দিন" else "Post Ad",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
              )
            },
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
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
                .testTag("home_marketplace_list"),
              contentPadding = PaddingValues(bottom = 96.dp)
            ) {
              // Location Notice Banner (Exclusively Rangpur City)
              item(key = "rangpur_banner") {
                Surface(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                  shape = RoundedCornerShape(12.dp),
                  color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
                ) {
                  Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                  ) {
                    Icon(
                      imageVector = Icons.Default.LocationCity,
                      contentDescription = null,
                      tint = MaterialTheme.colorScheme.primary,
                      modifier = Modifier.size(20.dp)
                    )
                    Text(
                      text = if (isBangla) "শুধুমাত্র রংপুর সিটি কর্পোরেশন এলাকার ব্যবহৃত পণ্যের বাজার" else "Exclusively for Rangpur City Corporation Area",
                      style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                      ),
                      color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                  }
                }
              }

              // Active search query notification badge if filtering
              if (searchQuery.isNotBlank()) {
                item(key = "search_feedback_bar") {
                  Surface(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(horizontal = 16.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer
                  ) {
                    Row(
                      modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                      Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                      ) {
                        Icon(
                          imageVector = Icons.Default.Search,
                          contentDescription = null,
                          tint = MaterialTheme.colorScheme.primary,
                          modifier = Modifier.size(18.dp)
                        )
                        Text(
                          text = if (isBangla) {
                            "\"$searchQuery\" দিয়ে অনুসন্ধান: ${displayedProducts.size}টি বিজ্ঞাপন"
                          } else {
                            "Search for \"$searchQuery\": ${displayedProducts.size} ads"
                          },
                          style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                          ),
                          color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                      }
                      IconButton(
                        onClick = { searchQuery = "" },
                        modifier = Modifier.size(28.dp)
                      ) {
                        Icon(
                          imageVector = Icons.Default.Close,
                          contentDescription = "সার্চ মুছুন",
                          modifier = Modifier.size(16.dp)
                        )
                      }
                    }
                  }
                }
              }

              // Featured Ads Carousel (Local Rangpur Top Listings)
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

              // Categories Chips Row
              item(key = "categories_filter") {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                  Text(
                    text = if (isBangla) "ক্যাটাগরি অনুযায়ী খুঁজুন" else "Browse by Category",
                    style = MaterialTheme.typography.titleMedium.copy(
                      fontWeight = FontWeight.Bold,
                      fontSize = 17.sp
                    ),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                  )
                  LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                  ) {
                    items(CATEGORIES.indices.toList()) { idx ->
                      val pair = CATEGORIES[idx]
                      val isSelected = selectedCategoryIdx == idx
                      FilterChip(
                        selected = isSelected,
                        onClick = { selectedCategoryIdx = idx },
                        label = {
                          Text(
                            text = if (isBangla) pair.first else pair.second,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 14.sp
                          )
                        },
                        modifier = Modifier.testTag("category_chip_$idx")
                      )
                    }
                  }
                }
              }

              // Rangpur City Areas Filter Chips Row
              item(key = "areas_filter") {
                Column(modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)) {
                  Text(
                    text = if (isBangla) "রংপুর শহরের এলাকা নির্বাচন করুন" else "Rangpur City Areas",
                    style = MaterialTheme.typography.titleMedium.copy(
                      fontWeight = FontWeight.Bold,
                      fontSize = 17.sp
                    ),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                  )
                  LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                  ) {
                    items(RANGPUR_CITY_AREAS.indices.toList()) { idx ->
                      val pair = RANGPUR_CITY_AREAS[idx]
                      val isSelected = selectedAreaIdx == idx
                      FilterChip(
                        selected = isSelected,
                        onClick = { selectedAreaIdx = idx },
                        label = {
                          Text(
                            text = if (isBangla) pair.first else pair.second,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp
                          )
                        },
                        leadingIcon = if (idx == 0) {
                          { Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        } else null,
                        modifier = Modifier.testTag("area_chip_$idx")
                      )
                    }
                  }
                }
              }

              // All Listings Header
              item(key = "all_listings_title") {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Text(
                    text = if (isBangla) "সকল বিজ্ঞাপন (${displayedProducts.size})" else "All Listings (${displayedProducts.size})",
                    style = MaterialTheme.typography.titleLarge.copy(
                      fontWeight = FontWeight.ExtraBold,
                      fontSize = 20.sp
                    )
                  )

                  if (currentUser == null) {
                    Surface(
                      shape = RoundedCornerShape(8.dp),
                      color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.6f)
                    ) {
                      Text(
                        text = if (isBangla) "গেস্ট মোড" else "Guest Mode",
                        style = MaterialTheme.typography.labelMedium.copy(
                          fontWeight = FontWeight.Bold,
                          fontSize = 12.sp
                        ),
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                      )
                    }
                  }
                }
              }

              // Empty State if no products match
              if (displayedProducts.isEmpty()) {
                item(key = "empty_listings") {
                  Card(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(16.dp)
                  ) {
                    Column(
                      modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                      horizontalAlignment = Alignment.CenterHorizontally,
                      verticalArrangement = Arrangement.Center
                    ) {
                      Icon(
                        imageVector = Icons.Default.SearchOff,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.outline,
                        modifier = Modifier.size(48.dp)
                      )
                      Spacer(modifier = Modifier.height(12.dp))
                      Text(
                        text = if (isBangla) "কোনো বিজ্ঞাপন খুঁজে পাওয়া যায়নি" else "No listings found",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, fontSize = 17.sp),
                        color = MaterialTheme.colorScheme.onSurface
                      )
                      Text(
                        text = if (isBangla) "ভিন্ন শব্দ দিয়ে খুঁজুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।" else "Try different search terms or clear filters.",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
                        color = MaterialTheme.colorScheme.outline,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                      )
                      Spacer(modifier = Modifier.height(16.dp))
                      Button(
                        onClick = {
                          searchQuery = ""
                          selectedCategoryIdx = 0
                          selectedAreaIdx = 0
                        }
                      ) {
                        Text(if (isBangla) "সকল ফিল্টার সাফ করুন" else "Clear All Filters")
                      }
                    }
                  }
                }
              }

              // Product Listings Cards
              items(
                items = displayedProducts,
                key = { "product_${it.id}_${it.firestoreDocId ?: ""}" }
              ) { product ->
                MarketProductCard(
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
                    .padding(horizontal = 16.dp, vertical = 6.dp)
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
                    // Update locally
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

    // Auth Modal (Google & Email/Password)
    RecyclRangpurAuthModal(
      isOpen = showAuthModal,
      isBangla = isBangla,
      authManager = authManager,
      titleText = authModalTitle,
      subtitleText = authModalSubtitle,
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
 * Top Navbar with Global Search Bar, language toggle, and authentication profile button.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecyclRangpurNavbar(
  isBangla: Boolean,
  currentUser: AuthenticatedUser?,
  searchQuery: String,
  isSearchExpanded: Boolean,
  onSearchQueryChange: (String) -> Unit,
  onToggleSearchExpanded: () -> Unit,
  onToggleLanguage: () -> Unit,
  onAuthClick: () -> Unit
) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .background(MaterialTheme.colorScheme.surface)
      .shadow(elevation = 2.dp)
      .testTag("global_navbar")
  ) {
    TopAppBar(
      title = {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Box(
            modifier = Modifier
              .size(38.dp)
              .clip(CircleShape)
              .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              imageVector = Icons.Default.Autorenew,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onPrimary,
              modifier = Modifier.size(24.dp)
            )
          }

          Column {
            Text(
              text = "Recycl Rangpur",
              style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.ExtraBold,
                fontSize = 19.sp
              ),
              color = MaterialTheme.colorScheme.primary,
              maxLines = 1
            )
            Text(
              text = if (isBangla) "রংপুর সিটি মার্কেটপ্লেস" else "Rangpur City Marketplace",
              style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      },
      actions = {
        // Toggle Global Search Bar in Navbar
        IconButton(
          onClick = onToggleSearchExpanded,
          modifier = Modifier.testTag("toggle_global_search_button")
        ) {
          Icon(
            imageVector = if (isSearchExpanded) Icons.Default.SearchOff else Icons.Default.Search,
            contentDescription = "সার্চ করুন",
            tint = if (isSearchExpanded || searchQuery.isNotBlank()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
          )
        }

        // Language toggle (বাং / EN)
        TextButton(
          onClick = onToggleLanguage,
          modifier = Modifier
            .padding(horizontal = 2.dp)
            .testTag("language_toggle_button")
        ) {
          Text(
            text = if (isBangla) "EN" else "বাং",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.primary
          )
        }

        // Auth action button
        if (currentUser == null) {
          Button(
            onClick = onAuthClick,
            modifier = Modifier
              .padding(end = 8.dp)
              .height(36.dp)
              .testTag("navbar_login_button"),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(10.dp)
          ) {
            Icon(
              imageVector = Icons.Default.AccountCircle,
              contentDescription = null,
              modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
              text = if (isBangla) "লগইন" else "Login",
              fontWeight = FontWeight.Bold,
              fontSize = 13.sp
            )
          }
        } else {
          // Logged in user profile chip
          Surface(
            modifier = Modifier
              .padding(end = 8.dp)
              .clip(RoundedCornerShape(18.dp))
              .clickable { onAuthClick() }
              .testTag("navbar_user_profile_chip"),
            color = MaterialTheme.colorScheme.primaryContainer,
            shape = RoundedCornerShape(18.dp)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(24.dp)
                  .clip(CircleShape)
                  .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = currentUser.displayName.take(1).uppercase(),
                  color = MaterialTheme.colorScheme.onPrimary,
                  fontWeight = FontWeight.Bold,
                  fontSize = 12.sp
                )
              }
              Text(
                text = currentUser.displayName.take(8),
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
              Icon(
                imageVector = Icons.AutoMirrored.Filled.Logout,
                contentDescription = "লগআউট",
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(14.dp)
              )
            }
          }
        }
      },
      colors = TopAppBarDefaults.topAppBarColors(
        containerColor = MaterialTheme.colorScheme.surface
      )
    )

    // Global Search Bar in the Navbar
    // Prominently accessible to search for products by name across the entire marketplace
    Surface(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 14.dp, vertical = 6.dp),
      shape = RoundedCornerShape(14.dp),
      color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
      border = androidx.compose.foundation.BorderStroke(
        width = 1.dp,
        color = if (searchQuery.isNotBlank()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
      )
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Icon(
          imageVector = Icons.Default.Search,
          contentDescription = "সার্চ আইকন",
          tint = if (searchQuery.isNotBlank()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.size(22.dp)
        )

        Spacer(modifier = Modifier.width(10.dp))

        TextField(
          value = searchQuery,
          onValueChange = onSearchQueryChange,
          placeholder = {
            Text(
              text = if (isBangla) "পণ্য খুঁজুন (নাম বা ব্র্যান্ড দিয়ে)..." else "Search products by name or brand...",
              style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
              color = MaterialTheme.colorScheme.outline
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
          IconButton(
            onClick = { onSearchQueryChange("") },
            modifier = Modifier.size(28.dp)
          ) {
            Icon(
              imageVector = Icons.Default.Close,
              contentDescription = "মুছুন",
              tint = MaterialTheme.colorScheme.onSurfaceVariant,
              modifier = Modifier.size(18.dp)
            )
          }
        }
      }
    }
  }
}

/**
 * Standard product listing card in the marketplace feed.
 */
@Composable
fun MarketProductCard(
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
      .shadow(elevation = 2.dp, shape = RoundedCornerShape(18.dp))
      .clip(RoundedCornerShape(18.dp))
      .clickable { onClick() }
      .testTag("market_product_card_${product.id}"),
    colors = CardDefaults.cardColors(
      containerColor = MaterialTheme.colorScheme.surface
    ),
    shape = RoundedCornerShape(18.dp)
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(12.dp),
      horizontalArrangement = Arrangement.spacedBy(14.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      // Product image thumbnail with photo count indicator
      Box(
        modifier = Modifier
          .size(105.dp)
          .clip(RoundedCornerShape(14.dp))
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
            shape = RoundedCornerShape(6.dp),
            color = Color.Black.copy(alpha = 0.65f)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
              Icon(
                imageVector = Icons.Default.PhotoLibrary,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(11.dp)
              )
              Text(
                text = "${product.photos.size}",
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }
      }

      // Details column
      Column(
        modifier = Modifier.weight(1f),
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        // Price and bookmark icon
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = "৳ ${product.priceBdt}",
            style = MaterialTheme.typography.titleLarge.copy(
              fontWeight = FontWeight.ExtraBold,
              fontSize = 19.sp
            ),
            color = MaterialTheme.colorScheme.primary
          )

          IconButton(
            onClick = onToggleSave,
            modifier = Modifier.size(28.dp)
          ) {
            Icon(
              imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
              contentDescription = "পছন্দের তালিকায় রাখুন",
              tint = if (isSaved) Color(0xFFEF4444) else MaterialTheme.colorScheme.outline,
              modifier = Modifier.size(20.dp)
            )
          }
        }

        // Title
        Text(
          text = if (isBangla) product.titleBn else product.titleEn,
          style = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
          ),
          maxLines = 2,
          overflow = TextOverflow.Ellipsis,
          color = MaterialTheme.colorScheme.onSurface
        )

        // Location in Rangpur City
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Icon(
            imageVector = Icons.Default.LocationOn,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.outline,
            modifier = Modifier.size(13.dp)
          )
          Text(
            text = if (isBangla) product.locationBn else product.locationEn,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            color = MaterialTheme.colorScheme.outline,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
        }

        // Condition & Posted time tags
        Row(
          modifier = Modifier.padding(top = 2.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Surface(
            shape = RoundedCornerShape(6.dp),
            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f)
          ) {
            Text(
              text = product.condition,
              style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
              ),
              color = MaterialTheme.colorScheme.onSecondaryContainer,
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
          }

          Text(
            text = if (isBangla) product.postedAgoBn else product.postedAgoEn,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
            color = MaterialTheme.colorScheme.outline
          )
        }
      }
    }
  }
}
