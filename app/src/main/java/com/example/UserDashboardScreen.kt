package com.example

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun UserDashboardScreen(
  isBangla: Boolean,
  currentUser: AuthenticatedUser?,
  isAdminPanelActive: Boolean,
  onToggleAdminPanelMode: (Boolean) -> Unit,
  allProducts: List<MarketProduct>,
  managedUsers: List<ManagedPlatformUser>,
  savedProductIds: Set<Int>,
  onPostNewAd: () -> Unit,
  onEditProduct: (MarketProduct) -> Unit,
  onDeleteProduct: (MarketProduct) -> Unit,
  onToggleFeaturedProduct: (MarketProduct) -> Unit,
  onProductClick: (MarketProduct) -> Unit,
  onToggleSave: (MarketProduct) -> Unit,
  onAddOrUpdateUser: (ManagedPlatformUser) -> Unit,
  onToggleVerifyUser: (ManagedPlatformUser) -> Unit,
  onToggleBlockUser: (ManagedPlatformUser) -> Unit,
  onDeleteUser: (ManagedPlatformUser) -> Unit,
  onTriggerAppOpenAd: () -> Unit,
  onTriggerSafetyPopup: () -> Unit,
  apkUpdateConfig: ApkUpdateConfig = ApkUpdateConfig(),
  onUpdateApkConfig: (ApkUpdateConfig) -> Unit = {},
  onTriggerApkUpdatePopup: () -> Unit = {},
  onLogoutClick: () -> Unit,
  onBackToHome: () -> Unit
) {
  BackHandler { onBackToHome() }

  val myPostedAds = remember(allProducts, currentUser) {
    if (currentUser == null) {
      emptyList()
    } else {
      allProducts.filter { product ->
        (product.ownerUid.isNotBlank() && product.ownerUid == currentUser.uid) ||
          (product.ownerEmail.isNotBlank() && product.ownerEmail.equals(currentUser.email, ignoreCase = true)) ||
          (product.isUserCreated && product.ownerUid.isBlank())
      }
    }
  }

  val savedAds = remember(allProducts, savedProductIds) {
    allProducts.filter { savedProductIds.contains(it.id) }
  }

  // Tabs: 0 = পোস্ট ম্যানেজ ও এডিট, 1 = ইউজার ম্যানেজমেন্ট, 2 = আমার ও সেভ করা পোস্ট, 3 = এডমোব ও পপআপ সেটিংস
  var selectedTab by remember { mutableIntStateOf(0) }
  var postSearchQuery by remember { mutableStateOf("") }
  var userSearchQuery by remember { mutableStateOf("") }

  // User Add/Edit Modal state
  var userBeingEdited by remember { mutableStateOf<ManagedPlatformUser?>(null) }
  var isAddingNewUser by remember { mutableStateOf(false) }

  // Editable APK Update fields for Admin Panel
  var editApkVersion by remember(apkUpdateConfig.versionName) { mutableStateOf(apkUpdateConfig.versionName) }
  var editApkUrl by remember(apkUpdateConfig.downloadUrl) { mutableStateOf(apkUpdateConfig.downloadUrl) }
  var editApkNotes by remember(apkUpdateConfig.releaseNotesBn) { mutableStateOf(apkUpdateConfig.releaseNotesBn) }
  var editForceUpdate by remember(apkUpdateConfig.isForceUpdate) { mutableStateOf(apkUpdateConfig.isForceUpdate) }
  var apkSaveSuccessMsg by remember { mutableStateOf<String?>(null) }

  val filteredAdminPosts = remember(allProducts, postSearchQuery) {
    if (postSearchQuery.isBlank()) {
      allProducts
    } else {
      val q = postSearchQuery.trim().lowercase()
      allProducts.filter {
        it.titleBn.lowercase().contains(q) ||
          it.titleEn.lowercase().contains(q) ||
          it.sellerName.lowercase().contains(q) ||
          it.locationBn.lowercase().contains(q)
      }
    }
  }

  val filteredUsers = remember(managedUsers, userSearchQuery) {
    if (userSearchQuery.isBlank()) {
      managedUsers
    } else {
      val q = userSearchQuery.trim().lowercase()
      managedUsers.filter {
        it.name.lowercase().contains(q) ||
          it.email.lowercase().contains(q) ||
          it.phone.contains(q) ||
          it.areaBn.lowercase().contains(q)
      }
    }
  }

  LazyColumn(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFFF1F5F9))
      .testTag("user_dashboard_screen"),
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp)
  ) {
    // 1. Modern Admin & User Control Center Header Card
    item(key = "dashboard_profile_header") {
      Card(
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .background(
              Brush.linearGradient(
                colors = listOf(Color(0xFF0F172A), Color(0xFF005B4B), Color(0xFF007A64))
              )
            )
            .padding(18.dp)
        ) {
          Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Top bar inside card
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                IconButton(
                  onClick = onBackToHome,
                  modifier = Modifier
                    .size(36.dp)
                    .background(Color.White.copy(alpha = 0.16f), CircleShape)
                    .testTag("dashboard_back_btn")
                ) {
                  Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                  )
                }
                Column {
                  Text(
                    text = if (isBangla) "আধুনিক অ্যাডমিন ও ইউজার ড্যাশবোর্ড" else "Modern Admin & User Dashboard",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 17.sp,
                    color = Color.White
                  )
                  Text(
                    text = if (isBangla) "Recycle Bin Rangpur • কন্ট্রোল সেন্টার" else "Recycle Bin Rangpur • Control Center",
                    fontSize = 11.sp,
                    color = Color(0xFFFFD166)
                  )
                }
              }

              // Admin Role / Mode Switch Badge
              Surface(
                color = if (isAdminPanelActive) Color(0xFFFFD166) else Color.White.copy(alpha = 0.2f),
                shape = RoundedCornerShape(50),
                modifier = Modifier
                  .clickable { onToggleAdminPanelMode(!isAdminPanelActive) }
                  .testTag("admin_role_badge")
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                  Icon(
                    imageVector = Icons.Default.AdminPanelSettings,
                    contentDescription = null,
                    tint = if (isAdminPanelActive) Color(0xFF0F172A) else Color.White,
                    modifier = Modifier.size(15.dp)
                  )
                  Text(
                    text = if (isAdminPanelActive) {
                      if (isBangla) "অ্যাডমিন প্যানেল সক্রিয়" else "Admin Mode Active"
                    } else {
                      if (isBangla) "ইউজার মোড" else "User Mode"
                    },
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isAdminPanelActive) Color(0xFF0F172A) else Color.White
                  )
                }
              }
            }

            if (currentUser != null) {
              // Logged-in User Info Row
              Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
              ) {
                Box(
                  modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFFD166)),
                  contentAlignment = Alignment.Center
                ) {
                  Text(
                    text = currentUser.displayName.take(1).uppercase(),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 24.sp,
                    color = Color(0xFF0F172A)
                  )
                }

                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                  Text(
                    text = currentUser.displayName,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = Color.White
                  )
                  Text(
                    text = currentUser.email,
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.85f)
                  )
                  if (!currentUser.phone.isNullOrBlank()) {
                    Text(
                      text = "📞 ${currentUser.phone}",
                      fontSize = 12.sp,
                      color = Color(0xFFFFD166),
                      fontWeight = FontWeight.SemiBold
                    )
                  }
                }
              }
            }

            // Quick Actions Row
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Button(
                onClick = onPostNewAd,
                colors = ButtonDefaults.buttonColors(
                  containerColor = Color(0xFFFFD166),
                  contentColor = Color(0xFF0F172A)
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                  .weight(1f)
                  .testTag("dashboard_post_ad_btn")
              ) {
                Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "+ নতুন বিজ্ঞাপন দিন" else "+ Post New Ad",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 13.sp
                )
              }

              OutlinedButton(
                onClick = onLogoutClick,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.45f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("dashboard_logout_btn")
              ) {
                Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                  text = if (isBangla) "লগআউট" else "Logout",
                  fontWeight = FontWeight.Bold,
                  fontSize = 13.sp
                )
              }
            }
          }
        }
      }
    }

    // 2. Modern 4-Card Analytics Grid
    item(key = "dashboard_stats_row") {
      Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          DashboardStatCard(
            title = if (isBangla) "মোট বিজ্ঞাপন (পোস্ট)" else "Total Posts",
            value = "${allProducts.size}",
            icon = Icons.Default.Inventory2,
            accentColor = Color(0xFF007A64),
            modifier = Modifier.weight(1f)
          )
          DashboardStatCard(
            title = if (isBangla) "মোট ইউজার" else "Total Users",
            value = "${managedUsers.size}",
            icon = Icons.Default.Group,
            accentColor = Color(0xFF2563EB),
            modifier = Modifier.weight(1f)
          )
        }
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          DashboardStatCard(
            title = if (isBangla) "ফিচার্ড পোস্ট" else "Featured Ads",
            value = "${allProducts.count { it.isFeatured }}",
            icon = Icons.Default.Star,
            accentColor = Color(0xFFD97706),
            modifier = Modifier.weight(1f)
          )
          DashboardStatCard(
            title = if (isBangla) "এডমোব (AdMob)" else "AdMob Status",
            value = if (isBangla) "চালু (Live)" else "Running",
            icon = Icons.Default.Campaign,
            accentColor = Color(0xFF16A34A),
            modifier = Modifier.weight(1f)
          )
        }
      }
    }

    // 2.5 Quick APK Update Banner in Admin Panel
    item(key = "admin_apk_quick_banner") {
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
        border = BorderStroke(1.dp, Color(0xFF6EE7B7)),
        modifier = Modifier
          .fillMaxWidth()
          .testTag("admin_apk_quick_banner_card")
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
          ) {
            Box(
              modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Color(0xFF007A64)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.SystemUpdate,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(22.dp)
              )
            }
            Column {
              Text(
                text = if (isBangla)
                  "অ্যাপ APK আপডেট (${apkUpdateConfig.versionName})"
                else
                  "App APK Update (${apkUpdateConfig.versionName})",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 14.sp,
                color = Color(0xFF065F46)
              )
              Text(
                text = if (isBangla)
                  "নতুন APK রিলিজ, ভার্সন ও ডাউনলোড লিংক নিয়ন্ত্রণ করুন"
                else
                  "Manage APK version, release notes & download URL",
                fontSize = 11.sp,
                color = Color(0xFF047857)
              )
            }
          }

          Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            FilledTonalButton(
              onClick = { selectedTab = 3 },
              shape = RoundedCornerShape(10.dp),
              contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
              modifier = Modifier.height(34.dp)
            ) {
              Text(
                text = if (isBangla) "কন্ট্রোল" else "Manage",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
              )
            }
            Button(
              onClick = onTriggerApkUpdatePopup,
              colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
              shape = RoundedCornerShape(10.dp),
              contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
              modifier = Modifier
                .height(34.dp)
                .testTag("admin_quick_apk_popup_btn")
            ) {
              Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp))
              Spacer(modifier = Modifier.width(4.dp))
              Text(
                text = if (isBangla) "APK আপডেট" else "APK Update",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }
      }
    }

    // 3. Modern Navigation Tabs for Admin & User Panel
    item(key = "dashboard_tabs") {
      val tabs = listOf(
        0 to (if (isBangla) "পোস্ট এডিট ও ম্যানেজ (${allProducts.size})" else "Manage Posts (${allProducts.size})"),
        1 to (if (isBangla) "ইউজার ম্যানেজ (${managedUsers.size})" else "Manage Users (${managedUsers.size})"),
        2 to (if (isBangla) "আমার ও সেভ করা (${myPostedAds.size + savedAds.size})" else "My & Saved Ads"),
        3 to (if (isBangla) "APK আপডেট ও এডমোব" else "APK Update & AdMob")
      )

      LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        items(tabs) { (tabIdx, title) ->
          val isSelected = selectedTab == tabIdx
          val tag = when (tabIdx) {
            0 -> "dashboard_tab_admin_ads"
            1 -> "dashboard_tab_users"
            2 -> "dashboard_tab_my_ads"
            else -> "dashboard_tab_admob"
          }
          Surface(
            shape = RoundedCornerShape(14.dp),
            color = if (isSelected) Color(0xFF007A64) else Color.White,
            border = BorderStroke(1.dp, if (isSelected) Color(0xFF007A64) else Color(0xFFCBD5E1)),
            modifier = Modifier
              .clickable { selectedTab = tabIdx }
              .testTag(tag)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              val tabIcon = when (tabIdx) {
                0 -> Icons.Default.EditNote
                1 -> Icons.Default.ManageAccounts
                2 -> Icons.Default.Bookmarks
                else -> Icons.Default.SystemUpdate
              }
              Icon(
                imageVector = tabIcon,
                contentDescription = null,
                tint = if (isSelected) Color.White else Color(0xFF007A64),
                modifier = Modifier.size(16.dp)
              )
              Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = if (isSelected) Color.White else Color(0xFF1E293B)
              )
            }
          }
        }
      }
    }

    // 4. Tab 0: পোস্ট এডিট ও ম্যানেজ (Post Edit & Management)
    if (selectedTab == 0) {
      item(key = "post_manage_search_bar") {
        Card(
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                text = if (isBangla) "সকল পোস্ট এডিট ও নিয়ন্ত্রণ" else "Edit & Manage All Listings",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp,
                color = Color(0xFF0F172A)
              )
              Text(
                text = if (isBangla) "মোট ${filteredAdminPosts.size}টি পোস্ট" else "${filteredAdminPosts.size} Posts",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF007A64)
              )
            }

            OutlinedTextField(
              value = postSearchQuery,
              onValueChange = { postSearchQuery = it },
              placeholder = {
                Text(
                  text = if (isBangla) "পোস্টের নাম, বিক্রেতা বা এলাকা দিয়ে খুঁজুন..." else "Search post by title, seller or area...",
                  fontSize = 13.sp
                )
              },
              leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF007A64)) },
              singleLine = true,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_post_search_input")
            )
          }
        }
      }

      items(
        items = filteredAdminPosts,
        key = { "admin_post_${it.id}" }
      ) { product ->
        val canModify = isAdminPanelActive || canUserModifyProduct(product, currentUser)
        DashboardProductManageCard(
          product = product,
          isBangla = isBangla,
          canModify = canModify,
          isSaved = savedProductIds.contains(product.id),
          onProductClick = { onProductClick(product) },
          onEditClick = { onEditProduct(product) },
          onToggleFeaturedClick = { onToggleFeaturedProduct(product) },
          onDeleteClick = { onDeleteProduct(product) },
          onToggleSave = { onToggleSave(product) }
        )
      }
    }

    // 5. Tab 1: ইউজার ম্যানেজমেন্ট (User Management)
    if (selectedTab == 1) {
      item(key = "user_manage_header_card") {
        Card(
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Column {
                Text(
                  text = if (isBangla) "ইউজার ম্যানেজমেন্ট প্যানেল" else "User Management Panel",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 16.sp,
                  color = Color(0xFF0F172A)
                )
                Text(
                  text = if (isBangla)
                    "ইউজার ভেরিফাই, রোল পরিবর্তন, তথ্য এডিট বা ব্লক করুন"
                  else
                    "Verify, edit info, change role, or block users",
                  fontSize = 12.sp,
                  color = Color(0xFF64748B)
                )
              }

              Button(
                onClick = {
                  isAddingNewUser = true
                  userBeingEdited = ManagedPlatformUser(
                    uid = "usr_${System.currentTimeMillis() % 100000}",
                    name = "",
                    email = "",
                    phone = "017",
                    areaBn = "জাহাজ কোম্পানি মোড়",
                    role = "Verified Seller",
                    isVerified = true,
                    isBlocked = false,
                    adsCount = 0,
                    joinedAgoBn = "এইমাত্র যুক্ত"
                  )
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                modifier = Modifier.testTag("admin_add_user_btn")
              ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "+ ইউজার যোগ" else "+ Add User",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }

            OutlinedTextField(
              value = userSearchQuery,
              onValueChange = { userSearchQuery = it },
              placeholder = {
                Text(
                  text = if (isBangla) "ইউজারের নাম, ইমেইল বা ফোন নম্বর খুঁজুন..." else "Search user by name, email or phone...",
                  fontSize = 13.sp
                )
              },
              leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF007A64)) },
              singleLine = true,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_user_search_input")
            )
          }
        }
      }

      items(
        items = filteredUsers,
        key = { "managed_user_${it.uid}" }
      ) { u ->
        ManagedUserCard(
          user = u,
          isBangla = isBangla,
          onEditUser = {
            isAddingNewUser = false
            userBeingEdited = u
          },
          onToggleVerify = { onToggleVerifyUser(u) },
          onToggleBlock = { onToggleBlockUser(u) },
          onDeleteUser = { onDeleteUser(u) }
        )
      }
    }

    // 6. Tab 2: আমার ও সেভ করা পোস্ট (My Ads & Saved Wishlist)
    if (selectedTab == 2) {
      item(key = "my_ads_header") {
        Text(
          text = if (isBangla) "আমার পোস্ট করা বিজ্ঞাপন (${myPostedAds.size})" else "My Posted Ads (${myPostedAds.size})",
          fontWeight = FontWeight.ExtraBold,
          fontSize = 16.sp,
          color = Color(0xFF0F172A)
        )
      }

      if (myPostedAds.isEmpty()) {
        item(key = "empty_my_ads") {
          Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
              horizontalAlignment = Alignment.CenterHorizontally,
              verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Text(
                text = if (isBangla) "আপনি এখনো নতুন কোনো বিজ্ঞাপন পোস্ট করেননি" else "You haven't posted any ads yet",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color(0xFF475569)
              )
              Button(
                onClick = onPostNewAd,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
                shape = RoundedCornerShape(10.dp)
              ) {
                Text(if (isBangla) "+ প্রথম বিজ্ঞাপন দিন" else "+ Post First Ad", fontWeight = FontWeight.Bold)
              }
            }
          }
        }
      } else {
        items(myPostedAds, key = { "my_ad_${it.id}" }) { product ->
          DashboardProductManageCard(
            product = product,
            isBangla = isBangla,
            canModify = true,
            isSaved = savedProductIds.contains(product.id),
            onProductClick = { onProductClick(product) },
            onEditClick = { onEditProduct(product) },
            onToggleFeaturedClick = { onToggleFeaturedProduct(product) },
            onDeleteClick = { onDeleteProduct(product) },
            onToggleSave = { onToggleSave(product) }
          )
        }
      }

      item(key = "saved_ads_header") {
        Text(
          text = if (isBangla) "পছন্দের সেভ করা বিজ্ঞাপন (${savedAds.size})" else "Saved Wishlist Ads (${savedAds.size})",
          fontWeight = FontWeight.ExtraBold,
          fontSize = 16.sp,
          color = Color(0xFF0F172A),
          modifier = Modifier.padding(top = 8.dp)
        )
      }

      items(savedAds, key = { "saved_ad_${it.id}" }) { product ->
        val canModify = isAdminPanelActive || canUserModifyProduct(product, currentUser)
        DashboardProductManageCard(
          product = product,
          isBangla = isBangla,
          canModify = canModify,
          isSaved = true,
          onProductClick = { onProductClick(product) },
          onEditClick = { onEditProduct(product) },
          onToggleFeaturedClick = { onToggleFeaturedProduct(product) },
          onDeleteClick = { onDeleteProduct(product) },
          onToggleSave = { onToggleSave(product) }
        )
      }
    }

    // 7. Tab 3: APK আপডেট কন্ট্রোল, এডমোব ও পপআপ সেটিংস (APK Update Manager, AdMob & Safety Popup Control)
    if (selectedTab == 3) {
      item(key = "apk_update_manager_card") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          modifier = Modifier
            .fillMaxWidth()
            .testTag("admin_apk_update_manager_card")
        ) {
          Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = Color(0xFF007A64))
                Column {
                  Text(
                    text = if (isBangla) "অ্যাপ APK আপডেট ও রিলিজ ম্যানেজার" else "App APK Update & Release Manager",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = Color(0xFF0F172A)
                  )
                  Text(
                    text = if (isBangla)
                      "বর্তমান ভার্সন: ${apkUpdateConfig.versionName} • ${apkUpdateConfig.apkSizeMb}"
                    else
                      "Current Version: ${apkUpdateConfig.versionName} • ${apkUpdateConfig.apkSizeMb}",
                    fontSize = 12.sp,
                    color = Color(0xFF059669),
                    fontWeight = FontWeight.Bold
                  )
                }
              }

              Surface(
                color = Color(0xFFDCFCE7),
                shape = RoundedCornerShape(50)
              ) {
                Text(
                  text = "LIVE APK",
                  fontSize = 10.sp,
                  fontWeight = FontWeight.ExtraBold,
                  color = Color(0xFF166534),
                  modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
              }
            }

            apkSaveSuccessMsg?.let { msg ->
              Surface(
                color = Color(0xFFECFDF5),
                border = BorderStroke(1.dp, Color(0xFF6EE7B7)),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
              ) {
                Text(
                  text = msg,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFF065F46),
                  modifier = Modifier.padding(10.dp)
                )
              }
            }

            OutlinedTextField(
              value = editApkVersion,
              onValueChange = { editApkVersion = it },
              label = { Text(if (isBangla) "APK ভার্সন নাম (Version Name)" else "APK Version Name") },
              singleLine = true,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_apk_version_input")
            )

            OutlinedTextField(
              value = editApkUrl,
              onValueChange = { editApkUrl = it },
              label = { Text(if (isBangla) "ডিরেক্ট APK ডাউনলোড লিংক (APK URL)" else "Direct APK Download URL") },
              singleLine = true,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_apk_url_input")
            )

            OutlinedTextField(
              value = editApkNotes,
              onValueChange = { editApkNotes = it },
              label = { Text(if (isBangla) "হোয়াটস নিউ / আপডেট নোট (Release Notes)" else "Release Notes / What's New") },
              minLines = 3,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_apk_notes_input")
            )

            Surface(
              color = Color(0xFFF8FAFC),
              shape = RoundedCornerShape(12.dp),
              border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Column {
                  Text(
                    text = if (isBangla) "বাধ্যতামূলক আপডেট (Force Update)" else "Mandatory Force Update",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = Color(0xFF0F172A)
                  )
                  Text(
                    text = if (isBangla) "চালু থাকলে ইউজারকে অবশ্যই নতুন APK ডাউনলোড করতে হবে" else "Users must update before continuing",
                    fontSize = 11.sp,
                    color = Color(0xFF64748B)
                  )
                }
                Switch(
                  checked = editForceUpdate,
                  onCheckedChange = { editForceUpdate = it }
                )
              }
            }

            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Button(
                onClick = {
                  val cleanVersion = editApkVersion.ifBlank { "v2.5.0" }
                  onUpdateApkConfig(
                    apkUpdateConfig.copy(
                      versionName = cleanVersion,
                      apkFileName = "RecycleBinRangpur_${cleanVersion}.apk",
                      downloadUrl = editApkUrl.ifBlank { apkUpdateConfig.downloadUrl },
                      releaseNotesBn = editApkNotes.ifBlank { apkUpdateConfig.releaseNotesBn },
                      isForceUpdate = editForceUpdate,
                      isUpdateAvailable = true
                    )
                  )
                  apkSaveSuccessMsg = if (isBangla) {
                    "✓ নতুন APK আপডেট ($cleanVersion) সফলভাবে পাবলিশ করা হয়েছে!"
                  } else {
                    "✓ APK Update ($cleanVersion) published successfully!"
                  }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                  .weight(1f)
                  .testTag("admin_publish_apk_update_btn")
              ) {
                Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "APK আপডেট সেভ করুন" else "Publish APK Update",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }

              OutlinedButton(
                onClick = onTriggerApkUpdatePopup,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                  .weight(1f)
                  .testTag("admin_preview_apk_popup_btn")
              ) {
                Icon(Icons.Default.SystemUpdate, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "APK পপআপ দেখুন" else "Show APK Popup",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }
        }
      }

      item(key = "admob_control_card") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(Icons.Default.Campaign, contentDescription = null, tint = Color(0xFF007A64))
              Text(
                text = if (isBangla) "গুগল এডমোব (Google AdMob) কন্ট্রোল প্যানেল" else "Google AdMob Control Panel",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                color = Color(0xFF0F172A)
              )
            }

            Surface(
              color = Color(0xFFF0FDF4),
              border = BorderStroke(1.dp, Color(0xFF86EFAC)),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                  text = if (isBangla) "✓ এডমোব বিজ্ঞাপনগুলো অ্যাপে সক্রিয়ভাবে রান করছে" else "✓ AdMob Ads are actively running",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 13.sp,
                  color = Color(0xFF166534)
                )
                Text(
                  text = "App Open ID: ${AdMobConfig.APP_OPEN_AD_UNIT_ID}",
                  fontSize = 12.sp,
                  color = Color(0xFF15803D)
                )
                Text(
                  text = "Native Ad ID: ${AdMobConfig.NATIVE_AD_UNIT_ID}",
                  fontSize = 12.sp,
                  color = Color(0xFF15803D)
                )
              }
            }

            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Button(
                onClick = onTriggerAppOpenAd,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                  .weight(1f)
                  .testTag("run_app_open_ad_btn")
              ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "App Open অ্যাড রান করুন" else "Run App Open Ad",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }

              OutlinedButton(
                onClick = onTriggerSafetyPopup,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                  .weight(1f)
                  .testTag("trigger_safety_popup_btn")
              ) {
                Icon(Icons.Default.WarningAmber, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                  text = if (isBangla) "সতর্কবার্তা পপআপ দেখুন" else "Show Safety Popup",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }
        }
      }

      item(key = "admob_live_preview_in_admin") {
        AdMobNativeAdBar(isBangla = isBangla)
      }
    }
  }

  // Edit / Add User Modal Dialog
  userBeingEdited?.let { editingUser ->
    EditPlatformUserDialog(
      user = editingUser,
      isNew = isAddingNewUser,
      isBangla = isBangla,
      onSave = { updatedUser ->
        onAddOrUpdateUser(updatedUser)
        userBeingEdited = null
      },
      onDismiss = { userBeingEdited = null }
    )
  }
}

@Composable
private fun ManagedUserCard(
  user: ManagedPlatformUser,
  isBangla: Boolean,
  onEditUser: () -> Unit,
  onToggleVerify: () -> Unit,
  onToggleBlock: () -> Unit,
  onDeleteUser: () -> Unit
) {
  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(
      containerColor = if (user.isBlocked) Color(0xFFFEF2F2) else Color.White
    ),
    border = BorderStroke(
      width = 1.dp,
      color = if (user.isBlocked) Color(0xFFFECACA) else Color(0xFFE2E8F0)
    ),
    modifier = Modifier
      .fillMaxWidth()
      .testTag("managed_user_card_${user.uid}")
  ) {
    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(
          modifier = Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(
              if (user.isBlocked) Color(0xFFDC2626).copy(alpha = 0.15f)
              else Color(0xFF007A64).copy(alpha = 0.14f)
            ),
          contentAlignment = Alignment.Center
        ) {
          Text(
            text = user.name.take(1).uppercase(),
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp,
            color = if (user.isBlocked) Color(0xFFDC2626) else Color(0xFF007A64)
          )
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
          Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(
              text = user.name,
              fontWeight = FontWeight.ExtraBold,
              fontSize = 15.sp,
              color = Color(0xFF0F172A),
              maxLines = 1,
              overflow = TextOverflow.Ellipsis
            )
            if (user.isVerified) {
              Icon(
                imageVector = Icons.Default.Verified,
                contentDescription = "Verified",
                tint = Color(0xFF059669),
                modifier = Modifier.size(15.dp)
              )
            }
          }

          Text(
            text = "${user.email} • 📞 ${user.phone}",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )

          Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
              color = if (user.role == "Admin") Color(0xFFFEF3C7) else Color(0xFFF1F5F9),
              shape = RoundedCornerShape(6.dp)
            ) {
              Text(
                text = user.role,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (user.role == "Admin") Color(0xFF92400E) else Color(0xFF334155),
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
              )
            }

            Surface(
              color = if (user.isBlocked) Color(0xFFFEE2E2) else Color(0xFFDCFCE7),
              shape = RoundedCornerShape(6.dp)
            ) {
              Text(
                text = if (user.isBlocked) (if (isBangla) "ব্লকড" else "Blocked") else (if (isBangla) "সক্রিয়" else "Active"),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (user.isBlocked) Color(0xFFB91C1C) else Color(0xFF166534),
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
              )
            }

            Text(
              text = "📍 ${user.areaBn}",
              fontSize = 11.sp,
              color = Color(0xFF64748B)
            )
          }
        }
      }

      HorizontalDivider(color = Color(0xFFF1F5F9))

      // Admin User Action Buttons Row
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        OutlinedButton(
          onClick = onEditUser,
          shape = RoundedCornerShape(8.dp),
          contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
          modifier = Modifier
            .weight(1f)
            .height(34.dp)
            .testTag("admin_edit_user_${user.uid}")
        ) {
          Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
          Spacer(modifier = Modifier.width(4.dp))
          Text(if (isBangla) "এডিট" else "Edit", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
          onClick = onToggleVerify,
          shape = RoundedCornerShape(8.dp),
          contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
          modifier = Modifier
            .weight(1f)
            .height(34.dp)
            .testTag("admin_verify_user_${user.uid}")
        ) {
          Icon(Icons.Default.VerifiedUser, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF059669))
          Spacer(modifier = Modifier.width(4.dp))
          Text(
            text = if (user.isVerified) (if (isBangla) "আনভেরিফাই" else "Unverify") else (if (isBangla) "ভেরিফাই" else "Verify"),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
          )
        }

        OutlinedButton(
          onClick = onToggleBlock,
          shape = RoundedCornerShape(8.dp),
          colors = ButtonDefaults.outlinedButtonColors(
            contentColor = if (user.isBlocked) Color(0xFF059669) else Color(0xFFD97706)
          ),
          contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
          modifier = Modifier
            .weight(1f)
            .height(34.dp)
            .testTag("admin_block_user_${user.uid}")
        ) {
          Icon(
            imageVector = if (user.isBlocked) Icons.Default.LockOpen else Icons.Default.Block,
            contentDescription = null,
            modifier = Modifier.size(14.dp)
          )
          Spacer(modifier = Modifier.width(4.dp))
          Text(
            text = if (user.isBlocked) (if (isBangla) "আনব্লক" else "Unblock") else (if (isBangla) "ব্লক" else "Block"),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
          )
        }

        IconButton(
          onClick = onDeleteUser,
          modifier = Modifier
            .size(34.dp)
            .testTag("admin_delete_user_${user.uid}")
        ) {
          Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Color(0xFFE11D48), modifier = Modifier.size(18.dp))
        }
      }
    }
  }
}

@Composable
private fun EditPlatformUserDialog(
  user: ManagedPlatformUser,
  isNew: Boolean,
  isBangla: Boolean,
  onSave: (ManagedPlatformUser) -> Unit,
  onDismiss: () -> Unit
) {
  var name by remember { mutableStateOf(user.name) }
  var email by remember { mutableStateOf(user.email) }
  var phone by remember { mutableStateOf(user.phone) }
  var area by remember { mutableStateOf(user.areaBn) }
  var role by remember { mutableStateOf(user.role) }

  AlertDialog(
    onDismissRequest = onDismiss,
    title = {
      Text(
        text = if (isNew) {
          if (isBangla) "নতুন ইউজার যোগ করুন" else "Add New User"
        } else {
          if (isBangla) "ইউজারের তথ্য ও রোল এডিট করুন" else "Edit User & Role"
        },
        fontWeight = FontWeight.ExtraBold,
        fontSize = 17.sp
      )
    },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedTextField(
          value = name,
          onValueChange = { name = it },
          label = { Text(if (isBangla) "ইউজারের নাম" else "Full Name") },
          singleLine = true,
          modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
          value = email,
          onValueChange = { email = it },
          label = { Text(if (isBangla) "ইমেইল ঠিকানা" else "Email") },
          singleLine = true,
          modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
          value = phone,
          onValueChange = { phone = it },
          label = { Text(if (isBangla) "মোবাইল নম্বর" else "Phone") },
          singleLine = true,
          modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
          value = area,
          onValueChange = { area = it },
          label = { Text(if (isBangla) "রংপুর শহরের এলাকা" else "Rangpur Area") },
          singleLine = true,
          modifier = Modifier.fillMaxWidth()
        )

        Text(
          text = if (isBangla) "ইউজারের রোল (Role):" else "User Role:",
          fontSize = 12.sp,
          fontWeight = FontWeight.Bold,
          color = Color(0xFF475569)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
          listOf("Admin", "Verified Seller", "User").forEach { r ->
            FilterChip(
              selected = role == r,
              onClick = { role = r },
              label = { Text(r, fontSize = 11.sp) }
            )
          }
        }
      }
    },
    confirmButton = {
      Button(
        onClick = {
          onSave(
            user.copy(
              name = name.ifBlank { "রংপুরের ইউজার" },
              email = email.ifBlank { "user@rangpur.com" },
              phone = phone.ifBlank { "01711000000" },
              areaBn = area.ifBlank { "রংপুর শহর" },
              role = role,
              isVerified = role != "User"
            )
          )
        },
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64))
      ) {
        Text(if (isBangla) "সংরক্ষণ করুন" else "Save")
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) {
        Text(if (isBangla) "বাতিল" else "Cancel")
      }
    }
  )
}

@Composable
private fun DashboardStatCard(
  title: String,
  value: String,
  icon: ImageVector,
  accentColor: Color,
  modifier: Modifier = Modifier
) {
  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    modifier = modifier
  ) {
    Column(
      modifier = Modifier.padding(12.dp),
      verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        Box(
          modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .background(accentColor.copy(alpha = 0.14f)),
          contentAlignment = Alignment.Center
        ) {
          Icon(imageVector = icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(16.dp))
        }
        Text(
          text = value,
          fontWeight = FontWeight.ExtraBold,
          fontSize = 17.sp,
          color = Color(0xFF0F172A)
        )
      }
      Text(
        text = title,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = Color(0xFF64748B),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
      )
    }
  }
}

@Composable
private fun DashboardProductManageCard(
  product: MarketProduct,
  isBangla: Boolean,
  canModify: Boolean,
  isSaved: Boolean,
  onProductClick: () -> Unit,
  onEditClick: () -> Unit,
  onToggleFeaturedClick: () -> Unit,
  onDeleteClick: () -> Unit,
  onToggleSave: () -> Unit
) {
  val primaryPhoto = product.photos.firstOrNull() ?: ProductPhoto(
    id = "dash_photo_${product.id}",
    studioPresetId = product.categoryId.coerceIn(1, 13)
  )

  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clickable { onProductClick() }
      .testTag("dashboard_product_card_${product.id}")
  ) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Box(
          modifier = Modifier
            .size(84.dp)
            .clip(RoundedCornerShape(12.dp))
        ) {
          ProductPhotoView(
            photo = primaryPhoto,
            modifier = Modifier.fillMaxSize(),
            showCaptionBadge = false,
            isBangla = isBangla
          )
          if (product.isFeatured) {
            Surface(
              color = Color(0xFFFFD166),
              shape = RoundedCornerShape(bottomEnd = 8.dp),
              modifier = Modifier.align(Alignment.TopStart)
            ) {
              Text(
                text = "★ Featured",
                fontSize = 9.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF0F172A),
                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
              )
            }
          }
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
          Text(
            text = if (isBangla) product.titleBn else product.titleEn,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp,
            color = Color(0xFF0F172A),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
          Text(
            text = "${if (isBangla) product.locationBn else product.locationEn} • ${product.sellerName}",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
          Text(
            text = "Tk ${product.priceBdt}",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 16.sp,
            color = Color(0xFF007A64)
          )
        }

        IconButton(onClick = onToggleSave) {
          Icon(
            imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            contentDescription = null,
            tint = if (isSaved) Color(0xFFE11D48) else Color(0xFF94A3B8)
          )
        }
      }

      if (canModify) {
        HorizontalDivider(color = Color(0xFFF1F5F9))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Button(
            onClick = onEditClick,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
            shape = RoundedCornerShape(10.dp),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
            modifier = Modifier
              .weight(1.2f)
              .height(36.dp)
              .testTag("dashboard_edit_ad_${product.id}")
          ) {
            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(15.dp))
            Spacer(modifier = Modifier.width(5.dp))
            Text(
              text = if (isBangla) "পোস্ট এডিট" else "Edit Post",
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold
            )
          }

          OutlinedButton(
            onClick = onToggleFeaturedClick,
            shape = RoundedCornerShape(10.dp),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
            modifier = Modifier
              .weight(1f)
              .height(36.dp)
              .testTag("admin_toggle_featured_${product.id}")
          ) {
            Icon(
              imageVector = if (product.isFeatured) Icons.Default.Star else Icons.Default.StarBorder,
              contentDescription = null,
              tint = Color(0xFFD97706),
              modifier = Modifier.size(15.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
              text = if (product.isFeatured) (if (isBangla) "ফিচার্ড ★" else "Featured") else (if (isBangla) "ফিচার্ড করুন" else "Promote"),
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold
            )
          }

          OutlinedButton(
            onClick = onDeleteClick,
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE11D48)),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
            modifier = Modifier
              .height(36.dp)
              .testTag("dashboard_delete_ad_${product.id}")
          ) {
            Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(15.dp))
            Spacer(modifier = Modifier.width(4.dp))
            Text(
              text = if (isBangla) "মুছুন" else "Delete",
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }
      }
    }
  }
}
