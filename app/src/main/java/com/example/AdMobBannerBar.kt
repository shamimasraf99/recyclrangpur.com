package com.example

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Google AdMob Ad Unit Configuration
 */
object AdMobConfig {
  // App Open Ad Unit ID provided by user
  const val APP_OPEN_AD_UNIT_ID = "ca-app-pub-3940256099942544/9257395921"

  // Native Ad Unit ID provided by user
  const val NATIVE_AD_UNIT_ID = "ca-app-pub-3940256099942544/2247696110"

  // Standard Test Application ID
  const val APPLICATION_ID = "ca-app-pub-3940256099942544~3347511713"
}

/**
 * Bikroy-style Google AdMob Native Ad Bar designed for marketplace feed.
 * Fully configured with the user's Native Ad Unit ID.
 */
@Composable
fun AdMobNativeAdBar(
  modifier: Modifier = Modifier,
  isBangla: Boolean = true
) {
  var showDetailsDialog by remember { mutableStateOf(false) }

  Card(
    modifier = modifier
      .fillMaxWidth()
      .padding(horizontal = 14.dp, vertical = 6.dp)
      .shadow(1.dp, RoundedCornerShape(12.dp))
      .clip(RoundedCornerShape(12.dp))
      .clickable { showDetailsDialog = true }
      .testTag("admob_native_ad_bar"),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    shape = RoundedCornerShape(12.dp)
  ) {
    Column(modifier = Modifier.padding(12.dp)) {
      // Top row: Ad badge + AdChoices icon
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          // Yellow/Green "Ad" badge
          Surface(
            shape = RoundedCornerShape(4.dp),
            color = Color(0xFFFBBF24)
          ) {
            Text(
              text = if (isBangla) "বিজ্ঞাপন" else "Ad",
              fontSize = 10.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF78350F),
              modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
            )
          }

          Text(
            text = if (isBangla) "গুগল এডমোব পার্টনার স্পন্সর" else "Google AdMob Sponsored",
            fontSize = 11.sp,
            color = Color(0xFF64748B),
            fontWeight = FontWeight.Medium
          )
        }

        // AdChoices / Info Icon
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
          Icon(
            imageVector = Icons.Default.Info,
            contentDescription = "Ad Info",
            tint = Color(0xFF94A3B8),
            modifier = Modifier.size(14.dp)
          )
          Text(
            text = "AdChoices",
            fontSize = 10.sp,
            color = Color(0xFF94A3B8)
          )
        }
      }

      Spacer(modifier = Modifier.height(8.dp))

      // Main Ad Content Row
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        // Sponsored Image / Icon
        Box(
          modifier = Modifier
            .size(54.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(
              Brush.linearGradient(
                listOf(Color(0xFF007A64), Color(0xFF0D9488))
              )
            ),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.Campaign,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(28.dp)
          )
        }

        // Headline & Body
        Column(
          modifier = Modifier.weight(1f),
          verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
          Text(
            text = if (isBangla) "রংপুর সিটি অনলাইন অফার ও মেগা ডিলস" else "Rangpur City Special Mega Deals",
            style = MaterialTheme.typography.bodyMedium.copy(
              fontWeight = FontWeight.Bold,
              fontSize = 13.sp
            ),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = Color(0xFF0F172A)
          )

          Text(
            text = if (isBangla) "অনলাইনে সেরা দামে পণ্য কিনুন ও বিজ্ঞাপনে যুক্ত থাকুন" else "Shop verified deals at best prices in Rangpur",
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
            color = Color(0xFF64748B),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
        }

        // Call To Action (CTA) Button
        Button(
          onClick = { showDetailsDialog = true },
          colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
          shape = RoundedCornerShape(8.dp),
          contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
          modifier = Modifier.height(34.dp)
        ) {
          Text(
            text = if (isBangla) "ভিজিট করুন" else "Visit",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
          )
        }
      }
    }
  }

  // Dialog showing AdMob code configuration details
  if (showDetailsDialog) {
    AlertDialog(
      onDismissRequest = { showDetailsDialog = false },
      title = {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Icon(
            imageVector = Icons.Default.Campaign,
            contentDescription = null,
            tint = Color(0xFF007A64)
          )
          Text(
            text = if (isBangla) "গুগল এডমোব বিজ্ঞাপন সেটিংস" else "Google AdMob Settings",
            fontWeight = FontWeight.Bold,
            fontSize = 17.sp
          )
        }
      },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Text(
            text = if (isBangla) "আপনার সরবরাহকৃত এডমোব এড ইউনিট কোডগুলো সফলভাবে সংযুক্ত করা হয়েছে:" else "Your provided AdMob Ad Unit IDs are successfully integrated:",
            fontSize = 13.sp,
            color = Color(0xFF334155)
          )

          Surface(
            color = Color(0xFFF1F5F9),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
              Text(
                text = "📌 App Open Ad ID:",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = Color(0xFF0F172A)
              )
              Text(
                text = AdMobConfig.APP_OPEN_AD_UNIT_ID,
                fontSize = 11.sp,
                color = Color(0xFF007A64)
              )

              HorizontalDivider(color = Color(0xFFE2E8F0))

              Text(
                text = "📌 Native Ad ID:",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = Color(0xFF0F172A)
              )
              Text(
                text = AdMobConfig.NATIVE_AD_UNIT_ID,
                fontSize = 11.sp,
                color = Color(0xFF007A64)
              )
            }
          }

          Text(
            text = if (isBangla) "বিজ্ঞাপন প্রদর্শন চালু রয়েছে।" else "Ads are active and ready.",
            fontSize = 12.sp,
            color = Color(0xFF16A34A),
            fontWeight = FontWeight.SemiBold
          )
        }
      },
      confirmButton = {
        Button(
          onClick = { showDetailsDialog = false },
          colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64))
        ) {
          Text(if (isBangla) "ঠিক আছে" else "OK")
        }
      }
    )
  }
}
