package com.example

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun UserDashboardScreen(
  isBangla: Boolean,
  currentUser: AuthenticatedUser?,
  allProducts: List<MarketProduct>,
  savedProductIds: Set<Int>,
  onPostNewAd: () -> Unit,
  onEditProduct: (MarketProduct) -> Unit,
  onDeleteProduct: (MarketProduct) -> Unit,
  onProductClick: (MarketProduct) -> Unit,
  onToggleSave: (MarketProduct) -> Unit,
  onLoginClick: () -> Unit,
  onLogoutClick: () -> Unit,
  onBackToHome: () -> Unit
) {
  BackHandler { onBackToHome() }

  val isAdmin = remember(currentUser) {
    currentUser?.email?.equals(ADMIN_EMAIL, ignoreCase = true) == true
  }

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

  var selectedTab by remember { mutableIntStateOf(0) }

  LazyColumn(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFFF1F5F9))
      .testTag("user_dashboard_screen"),
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp)
  ) {
    // 1. Top Profile & Dashboard Header Card
    item(key = "dashboard_profile_header") {
      Card(
        shape = RoundedCornerShape(22.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .background(
              Brush.linearGradient(
                colors = listOf(Color(0xFF004D40), Color(0xFF007A64), Color(0xFF059669))
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
                    .size(34.dp)
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
                Text(
                  text = if (isBangla) "প্রোফাইল ড্যাশবোর্ড ও ইউজার প্যানেল" else "Profile Dashboard & User Panel",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 17.sp,
                  color = Color.White
                )
              }

              if (currentUser != null) {
                Surface(
                  color = if (isAdmin) Color(0xFFFFD166) else Color.White.copy(alpha = 0.2f),
                  shape = RoundedCornerShape(50),
                  modifier = Modifier.testTag(if (isAdmin) "admin_role_badge" else "user_role_badge")
                ) {
                  Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    Icon(
                      imageVector = if (isAdmin) Icons.Default.AdminPanelSettings else Icons.Default.VerifiedUser,
                      contentDescription = null,
                      tint = if (isAdmin) Color(0xFF0F172A) else Color.White,
                      modifier = Modifier.size(14.dp)
                    )
                    Text(
                      text = if (isAdmin) {
                        if (isBangla) "অ্যাডমিন" else "Admin"
                      } else {
                        if (isBangla) "ভেরিফায়েড ইউজার" else "Verified User"
                      },
                      fontSize = 11.sp,
                      fontWeight = FontWeight.ExtraBold,
                      color = if (isAdmin) Color(0xFF0F172A) else Color.White
                    )
                  }
                }
              }
            }

            if (currentUser == null) {
              // Guest State Card inside Header
              Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
              ) {
                Text(
                  text = if (isBangla)
                    "আপনি বর্তমানে গেস্ট মোডে আছেন। নিজের বিজ্ঞাপন পোস্ট, এডিট ও পরিচালনা করতে লগইন করুন।"
                  else
                    "You are browsing as a Guest. Sign in to post, edit, and manage your own ads.",
                  fontSize = 14.sp,
                  color = Color.White.copy(alpha = 0.92f)
                )
                Button(
                  onClick = onLoginClick,
                  colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFFFD166),
                    contentColor = Color(0xFF0F172A)
                  ),
                  shape = RoundedCornerShape(12.dp),
                  modifier = Modifier.testTag("dashboard_login_btn")
                ) {
                  Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(18.dp))
                  Spacer(modifier = Modifier.width(6.dp))
                  Text(
                    text = if (isBangla) "লগইন / অ্যাকাউন্ট খুলুন" else "Sign In / Create Account",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp
                  )
                }
              }
            } else {
              // Logged-in User Info Row
              Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
              ) {
                Box(
                  modifier = Modifier
                    .size(58.dp)
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
                    fontSize = 19.sp,
                    color = Color.White
                  )
                  Text(
                    text = currentUser.email,
                    fontSize = 13.sp,
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

              // Action Buttons for Logged-in User
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
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
    }

    // 2. Quick Stats Row
    item(key = "dashboard_stats_row") {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        DashboardStatCard(
          title = if (isBangla) "আমার বিজ্ঞাপন" else "My Ads",
          value = "${myPostedAds.size}",
          icon = Icons.Default.Storefront,
          accentColor = Color(0xFF007A64),
          modifier = Modifier.weight(1f)
        )
        DashboardStatCard(
          title = if (isBangla) "সেভ করা" else "Saved Ads",
          value = "${savedAds.size}",
          icon = Icons.Default.Favorite,
          accentColor = Color(0xFFE11D48),
          modifier = Modifier.weight(1f)
        )
        DashboardStatCard(
          title = if (isAdmin) {
            if (isBangla) "সকল পোস্ট (অ্যাডমিন)" else "All Ads (Admin)"
          } else {
            if (isBangla) "সক্রিয় মার্কেট" else "Total Market"
          },
          value = "${allProducts.size}",
          icon = Icons.Default.Verified,
          accentColor = Color(0xFFD97706),
          modifier = Modifier.weight(1f)
        )
      }
    }

    // 3. Ownership Security Policy Banner
    item(key = "ownership_security_banner") {
      Surface(
        color = Color(0xFFECFDF5),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFA7F3D0)),
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier.padding(12.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Icon(
            imageVector = Icons.Default.Security,
            contentDescription = null,
            tint = Color(0xFF059669),
            modifier = Modifier.size(22.dp)
          )
          Column {
            Text(
              text = if (isBangla)
                "সুরক্ষিত পোস্ট মালিকানা (Post Ownership Protection)"
              else
                "Protected Post Ownership",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 13.sp,
              color = Color(0xFF065F46)
            )
            Text(
              text = if (isBangla)
                "আপনার পোস্ট করা বিজ্ঞাপন শুধুমাত্র আপনি এবং অ্যাডমিন এডিট বা ডিলিট করতে পারবেন। অন্য কোনো ইউজার আপনার পোস্ট পরিবর্তন করতে পারবে না।"
              else
                "Only you and the platform Admin can edit or delete your listings. Other users cannot modify your posts.",
              fontSize = 12.sp,
              color = Color(0xFF047857),
              lineHeight = 17.sp
            )
          }
        }
      }
    }

    // 4. Dashboard Tabs
    item(key = "dashboard_tabs") {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        val tabs = buildList {
          add(0 to (if (isBangla) "আমার বিজ্ঞাপন (${myPostedAds.size})" else "My Ads (${myPostedAds.size})"))
          add(1 to (if (isBangla) "সেভ করা (${savedAds.size})" else "Saved (${savedAds.size})"))
          if (isAdmin) {
            add(2 to (if (isBangla) "অ্যাডমিন কন্ট্রোল (${allProducts.size})" else "Admin All (${allProducts.size})"))
          }
        }

        tabs.forEach { (tabIdx, title) ->
          val isSelected = selectedTab == tabIdx
          val tag = when (tabIdx) {
            0 -> "dashboard_tab_my_ads"
            1 -> "dashboard_tab_saved_ads"
            else -> "dashboard_tab_admin_ads"
          }
          Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (isSelected) Color(0xFF007A64) else Color.White,
            border = BorderStroke(1.dp, if (isSelected) Color(0xFF007A64) else Color(0xFFCBD5E1)),
            modifier = Modifier
              .weight(1f)
              .clickable { selectedTab = tabIdx }
              .testTag(tag)
          ) {
            Text(
              text = title,
              fontWeight = FontWeight.Bold,
              fontSize = 13.sp,
              color = if (isSelected) Color.White else Color(0xFF334155),
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp)
            )
          }
        }
      }
    }

    // 5. Tab Content List
    val activeList = when (selectedTab) {
      0 -> myPostedAds
      1 -> savedAds
      else -> allProducts
    }

    if (activeList.isEmpty()) {
      item(key = "dashboard_empty_state") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Icon(
              imageVector = if (selectedTab == 0) Icons.Default.Inventory2 else Icons.Default.FavoriteBorder,
              contentDescription = null,
              tint = Color(0xFF94A3B8),
              modifier = Modifier.size(44.dp)
            )
            Text(
              text = if (selectedTab == 0) {
                if (isBangla) "আপনার নিজের কোনো বিজ্ঞাপন এখনো পোস্ট করা হয়নি" else "You haven't posted any ads yet"
              } else {
                if (isBangla) "কোনো পছন্দের বিজ্ঞাপন সেভ করা নেই" else "No saved ads in your wishlist yet"
              },
              fontWeight = FontWeight.Bold,
              fontSize = 15.sp,
              color = Color(0xFF1E293B)
            )
            if (selectedTab == 0) {
              Button(
                onClick = onPostNewAd,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
                shape = RoundedCornerShape(12.dp)
              ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (isBangla) "প্রথম বিজ্ঞাপন দিন" else "Post Your First Ad", fontWeight = FontWeight.Bold)
              }
            }
          }
        }
      }
    } else {
      items(
        items = activeList,
        key = { "dash_item_${selectedTab}_${it.id}" }
      ) { product ->
        val canModify = canUserModifyProduct(product, currentUser)
        DashboardProductManageCard(
          product = product,
          isBangla = isBangla,
          canModify = canModify,
          isSaved = savedProductIds.contains(product.id),
          onProductClick = { onProductClick(product) },
          onEditClick = { onEditProduct(product) },
          onDeleteClick = { onDeleteProduct(product) },
          onToggleSave = { onToggleSave(product) }
        )
      }
    }
  }
}

@Composable
private fun DashboardStatCard(
  title: String,
  value: String,
  icon: androidx.compose.ui.graphics.vector.ImageVector,
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
          fontSize = 19.sp,
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
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          OutlinedButton(
            onClick = onEditClick,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
              .weight(1f)
              .testTag("dashboard_edit_ad_${product.id}")
          ) {
            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
              text = if (isBangla) "এডিট করুন" else "Edit Ad",
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold
            )
          }

          OutlinedButton(
            onClick = onDeleteClick,
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE11D48)),
            modifier = Modifier
              .weight(1f)
              .testTag("dashboard_delete_ad_${product.id}")
          ) {
            Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
              text = if (isBangla) "ডিলিট করুন" else "Delete Ad",
              fontSize = 13.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }
      }
    }
  }
}
