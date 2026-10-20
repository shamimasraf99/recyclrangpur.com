package com.example

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun FeaturedAdsCarousel(
  featuredProducts: List<MarketProduct>,
  isBangla: Boolean,
  savedProductIds: Set<Int>,
  onToggleSave: (MarketProduct) -> Unit,
  onProductClick: (MarketProduct) -> Unit,
  modifier: Modifier = Modifier
) {
  if (featuredProducts.isEmpty()) return

  val listState = rememberLazyListState()
  var activeIndex by remember { mutableIntStateOf(0) }

  // Auto-advance carousel banner smoothly
  LaunchedEffect(featuredProducts.size) {
    if (featuredProducts.size > 1) {
      while (true) {
        delay(4500L)
        val next = (activeIndex + 1) % featuredProducts.size
        activeIndex = next
        try {
          listState.animateScrollToItem(next)
        } catch (_: Exception) {
          // ignore scroll cancellation
        }
      }
    }
  }

  Column(
    modifier = modifier
      .fillMaxWidth()
      .padding(vertical = 8.dp)
      .testTag("featured_ads_carousel_section")
  ) {
    // Header
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 6.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        Box(
          modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primaryContainer),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.Star,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
          )
        }
        Column {
          Text(
            text = if (isBangla) "ফিচার্ড বিজ্ঞাপন (রংপুর)" else "Featured Ads (Rangpur)",
            style = MaterialTheme.typography.titleMedium.copy(
              fontWeight = FontWeight.Bold,
              fontSize = 18.sp
            ),
            color = MaterialTheme.colorScheme.onSurface
          )
          Text(
            text = if (isBangla) "স্থানীয় সেরা ও যাচাইকৃত বিক্রেতাদের বিজ্ঞাপন" else "Top-rated listings from trusted local sellers",
            style = MaterialTheme.typography.bodySmall.copy(
              fontSize = 13.sp
            ),
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }

      Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
        modifier = Modifier.padding(start = 4.dp)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Text(
            text = "${featuredProducts.size}",
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.primary
          )
          Icon(
            imageVector = Icons.Default.Verified,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(14.dp)
          )
        }
      }
    }

    // Carousel items row
    LazyRow(
      state = listState,
      modifier = Modifier
        .fillMaxWidth()
        .padding(top = 8.dp),
      contentPadding = PaddingValues(horizontal = 16.dp),
      horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      itemsIndexed(
        items = featuredProducts,
        key = { _, product -> "featured_${product.id}_${product.firestoreDocId ?: ""}" }
      ) { index, product ->
        FeaturedAdCard(
          product = product,
          isBangla = isBangla,
          isSaved = savedProductIds.contains(product.id),
          onToggleSave = { onToggleSave(product) },
          onClick = {
            activeIndex = index
            onProductClick(product)
          }
        )
      }
    }

    // Page indicator dots
    if (featuredProducts.size > 1) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(top = 10.dp, bottom = 4.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
      ) {
        featuredProducts.forEachIndexed { idx, _ ->
          val isSelected = idx == activeIndex
          val width by animateDpAsState(
            targetValue = if (isSelected) 22.dp else 7.dp,
            animationSpec = spring(),
            label = "indicator_w"
          )
          val color by animateColorAsState(
            targetValue = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
            label = "indicator_c"
          )
          Box(
            modifier = Modifier
              .padding(horizontal = 3.dp)
              .height(7.dp)
              .width(width)
              .clip(RoundedCornerShape(4.dp))
              .background(color)
          )
        }
      }
    }
  }
}

@Composable
fun FeaturedAdCard(
  product: MarketProduct,
  isBangla: Boolean,
  isSaved: Boolean,
  onToggleSave: () -> Unit,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val primaryPhoto = product.photos.firstOrNull() ?: ProductPhoto(
    id = "feat_dummy_${product.id}",
    studioPresetId = product.categoryId.coerceIn(1, 8)
  )

  Card(
    modifier = modifier
      .width(280.dp)
      .shadow(elevation = 3.dp, shape = RoundedCornerShape(20.dp))
      .clip(RoundedCornerShape(20.dp))
      .clickable { onClick() }
      .testTag("featured_ad_card_${product.id}"),
    colors = CardDefaults.cardColors(
      containerColor = MaterialTheme.colorScheme.surface
    ),
    shape = RoundedCornerShape(20.dp)
  ) {
    Column {
      // Photo container with badge overlays
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .height(160.dp)
      ) {
        ProductPhotoView(
          photo = primaryPhoto,
          modifier = Modifier.fillMaxSize(),
          showCaptionBadge = false,
          isBangla = isBangla
        )

        // Gradient overlay at bottom of photo
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .align(Alignment.BottomCenter)
            .background(
              Brush.verticalGradient(
                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f))
              )
            )
        )

        // "ফিচার্ড / Featured" badge on top left
        Surface(
          shape = RoundedCornerShape(bottomEnd = 12.dp),
          color = MaterialTheme.colorScheme.primary,
          modifier = Modifier.align(Alignment.TopStart)
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.Bolt,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onPrimary,
              modifier = Modifier.size(14.dp)
            )
            Text(
              text = if (isBangla) "ফিচার্ড" else "FEATURED",
              color = MaterialTheme.colorScheme.onPrimary,
              fontWeight = FontWeight.Bold,
              fontSize = 11.sp
            )
          }
        }

        // Bookmark / Favorite icon button on top right
        IconButton(
          onClick = onToggleSave,
          modifier = Modifier
            .align(Alignment.TopEnd)
            .padding(6.dp)
            .size(36.dp)
            .clip(CircleShape)
            .background(Color.Black.copy(alpha = 0.45f))
        ) {
          Icon(
            imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            contentDescription = if (isSaved) "সংরক্ষণ বাতিল" else "পছন্দে যোগ করুন",
            tint = if (isSaved) Color(0xFFEF4444) else Color.White,
            modifier = Modifier.size(18.dp)
          )
        }

        // Seller rating badge at bottom photo bar
        Row(
          modifier = Modifier
            .align(Alignment.BottomStart)
            .padding(horizontal = 10.dp, vertical = 6.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Icon(
            imageVector = Icons.Default.Star,
            contentDescription = null,
            tint = Color(0xFFFFB703),
            modifier = Modifier.size(15.dp)
          )
          Text(
            text = String.format(java.util.Locale.US, "%.1f", product.sellerRating),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
          )
          Text(
            text = "(${product.sellerReviewCount})",
            color = Color.White.copy(alpha = 0.85f),
            fontSize = 11.sp
          )
        }
      }

      // Content details
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        // Price & Condition
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = "৳ ${product.priceBdt}",
            style = MaterialTheme.typography.titleLarge.copy(
              fontWeight = FontWeight.ExtraBold,
              fontSize = 20.sp
            ),
            color = MaterialTheme.colorScheme.primary
          )

          Surface(
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.secondaryContainer
          ) {
            Text(
              text = product.condition,
              style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
              ),
              color = MaterialTheme.colorScheme.onSecondaryContainer,
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
            )
          }
        }

        // Title
        Text(
          text = if (isBangla) product.titleBn else product.titleEn,
          style = MaterialTheme.typography.bodyLarge.copy(
            fontWeight = FontWeight.SemiBold,
            fontSize = 15.sp
          ),
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
          color = MaterialTheme.colorScheme.onSurface
        )

        // Location in Rangpur
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Icon(
            imageVector = Icons.Default.LocationOn,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(14.dp)
          )
          Text(
            text = if (isBangla) product.locationBn else product.locationEn,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }

        // Seller verified badge
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(top = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.VerifiedUser,
              contentDescription = null,
              tint = Color(0xFF16A34A),
              modifier = Modifier.size(15.dp)
            )
            Text(
              text = product.sellerName,
              style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Medium,
                fontSize = 12.sp
              ),
              color = MaterialTheme.colorScheme.onSurface,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              modifier = Modifier.widthIn(max = 140.dp)
            )
          }

          Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = "বিস্তারিত দেখুন",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp)
          )
        }
      }
    }
  }
}
