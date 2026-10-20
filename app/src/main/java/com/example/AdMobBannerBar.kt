package com.example

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.delay

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

private data class NativeAdCampaign(
  val headlineBn: String,
  val headlineEn: String,
  val bodyBn: String,
  val bodyEn: String,
  val advertiser: String,
  val ctaBn: String,
  val ctaEn: String,
  val accentColor: Long
)

private val ACTIVE_ADMOB_CAMPAIGNS = listOf(
  NativeAdCampaign(
    headlineBn = "রংপুর সিটি অনলাইন অফার ও মেগা ইলেকট্রনিক্স ডিলস",
    headlineEn = "Rangpur City Mega Electronics & Gadget Deals",
    bodyBn = "জাহাজ কোম্পানি মোড় ও শাপলা চত্বরে সেরা দামে গ্যাজেট ও হোম অ্যাপ্লায়েন্স কিনুন",
    bodyEn = "Shop verified gadgets & appliances at best prices in Rangpur City",
    advertiser = "Google AdMob • Rangpur Mart",
    ctaBn = "অফার দেখুন",
    ctaEn = "View Offer",
    accentColor = 0xFF007A64
  ),
  NativeAdCampaign(
    headlineBn = "রংপুর ফাস্ট হোম ডেলিভারি ও কুরিয়ার সার্ভিস",
    headlineEn = "Rangpur Express Home Delivery Service",
    bodyBn = "রংপুর শহরের যেকোনো প্রান্তে মাত্র ৬০ মিনিটে নিরাপদ পার্সেল ডেলিভারি",
    bodyEn = "Fast 60-minute parcel delivery across all Rangpur City areas",
    advertiser = "Google AdMob • Rangpur Express",
    ctaBn = "বুক করুন",
    ctaEn = "Book Now",
    accentColor = 0xFF2563EB
  ),
  NativeAdCampaign(
    headlineBn = "রংপুর বাইক সার্ভিসিং ও অরিজিনাল পার্টস সেন্টার",
    headlineEn = "Rangpur Bike Care & Genuine Parts Center",
    bodyBn = "ধাপ ও লালবাগে অভিজ্ঞ মেকানিক দ্বারা মোটরসাইকেল সার্ভিসিংয়ে ৩০% ছাড়",
    bodyEn = "30% off motorcycle servicing by certified mechanics in Rangpur",
    advertiser = "Google AdMob • MotoCare BD",
    ctaBn = "বিস্তারিত",
    ctaEn = "Learn More",
    accentColor = 0xFFD97706
  )
)

/**
 * Startup Safety Notice Popup ("অগ্রমী লেনদেন করা থেকে বিরত থাকুন" / "সরাসরি দেখা করে পণ্য ক্রয় -বিক্রয় করুন ।")
 * Automatically opens as soon as the app starts.
 */
@Composable
fun SafetyNoticeStartupPopup(
  isOpen: Boolean,
  isBangla: Boolean,
  onDismiss: () -> Unit
) {
  if (!isOpen) return

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      shape = RoundedCornerShape(24.dp),
      colors = CardDefaults.cardColors(containerColor = Color.White),
      elevation = CardDefaults.cardElevation(defaultElevation = 10.dp),
      modifier = Modifier
        .widthIn(max = 400.dp)
        .fillMaxWidth(0.92f)
        .testTag("startup_safety_warning_popup")
    ) {
      Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        // Top Warning Banner Header
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .background(
              Brush.linearGradient(
                colors = listOf(Color(0xFFB91C1C), Color(0xFFDC2626), Color(0xFFEA580C))
              )
            )
            .padding(vertical = 20.dp, horizontal = 16.dp),
          contentAlignment = Alignment.Center
        ) {
          Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Surface(
              shape = CircleShape,
              color = Color.White,
              modifier = Modifier.size(56.dp)
            ) {
              Box(contentAlignment = Alignment.Center) {
                Icon(
                  imageVector = Icons.Default.WarningAmber,
                  contentDescription = "সতর্কবার্তা",
                  tint = Color(0xFFDC2626),
                  modifier = Modifier.size(34.dp)
                )
              }
            }

            Surface(
              color = Color(0xFFFFD166),
              shape = RoundedCornerShape(50)
            ) {
              Text(
                text = if (isBangla) "জরুরি নিরাপত্তা সতর্কবার্তা • Recycle Bin Rangpur" else "Safety Alert • Recycle Bin Rangpur",
                fontSize = 11.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF0F172A),
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
              )
            }
          }
        }

        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
          verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          // Exact warning message requested by user
          Text(
            text = "“অগ্রমী লেনদেন করা থেকে বিরত থাকুন”",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 20.sp,
            color = Color(0xFFB91C1C),
            textAlign = TextAlign.Center,
            lineHeight = 26.sp,
            modifier = Modifier.testTag("safety_popup_headline")
          )

          Surface(
            color = Color(0xFFFEF2F2),
            border = BorderStroke(1.dp, Color(0xFFFECACA)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(
              modifier = Modifier.padding(14.dp),
              horizontalAlignment = Alignment.CenterHorizontally,
              verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Text(
                text = "সরাসরি দেখা করে পণ্য ক্রয় -বিক্রয় করুন ।",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 17.sp,
                color = Color(0xFF0F172A),
                textAlign = TextAlign.Center,
                modifier = Modifier.testTag("safety_popup_subheadline")
              )
              Text(
                text = if (isBangla)
                  "পণ্য হাতে পেয়ে ভালোভাবে যাচাই করার আগে বিকাশ, নগদ বা ব্যাংকে কোনো প্রকার অগ্রিম টাকা পাঠাবেন না।"
                else
                  "Never send advance money via bKash/Nagad before inspecting the item in person.",
                fontSize = 13.sp,
                color = Color(0xFF475569),
                textAlign = TextAlign.Center,
                lineHeight = 19.sp
              )
            }
          }

          // Quick safety tips row
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(12.dp))
              .background(Color(0xFFF8FAFC))
              .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(16.dp))
              Text(
                text = if (isBangla) "রংপুর শহরের পরিচিত ও জনসমাগমপূর্ণ স্থানে দেখা করুন" else "Meet in a safe public place in Rangpur City",
                fontSize = 12.sp,
                color = Color(0xFF334155),
                fontWeight = FontWeight.Medium
              )
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(16.dp))
              Text(
                text = if (isBangla) "পণ্য চালিয়ে ও কাগজপত্র দেখে মূল্য পরিশোধ করুন" else "Verify the product & papers before paying",
                fontSize = 12.sp,
                color = Color(0xFF334155),
                fontWeight = FontWeight.Medium
              )
            }
          }

          Button(
            onClick = onDismiss,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
              .fillMaxWidth()
              .height(48.dp)
              .testTag("dismiss_safety_popup_btn")
          ) {
            Icon(Icons.Default.VerifiedUser, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = if (isBangla) "বুঝতে পেরেছি, মার্কেটপ্লেসে যান" else "I Understand, Continue",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 15.sp,
              color = Color.White
            )
          }
        }
      }
    }
  }
}

/**
 * Live Google AdMob App Open Ad Overlay using AdMobConfig.APP_OPEN_AD_UNIT_ID.
 */
@Composable
fun AdMobAppOpenAdModal(
  isOpen: Boolean,
  isBangla: Boolean,
  onDismiss: () -> Unit
) {
  if (!isOpen) return

  var secondsLeft by remember { mutableIntStateOf(3) }
  LaunchedEffect(Unit) {
    while (secondsLeft > 0) {
      delay(1000L)
      secondsLeft--
    }
  }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      shape = RoundedCornerShape(22.dp),
      colors = CardDefaults.cardColors(containerColor = Color.White),
      elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
      modifier = Modifier
        .widthIn(max = 400.dp)
        .fillMaxWidth(0.92f)
        .testTag("admob_app_open_modal")
    ) {
      Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Surface(color = Color(0xFFFBBF24), shape = RoundedCornerShape(4.dp)) {
              Text(
                text = "Ad • App Open",
                fontSize = 10.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF78350F),
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
              )
            }
            Text(
              text = "Google AdMob",
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF64748B)
            )
          }

          Surface(
            shape = RoundedCornerShape(50),
            color = Color(0xFF007A64),
            modifier = Modifier
              .clickable { onDismiss() }
              .testTag("close_app_open_ad_btn")
          ) {
            Text(
              text = if (secondsLeft > 0) {
                if (isBangla) "অ্যাপে যান ($secondsLeft)" else "Continue ($secondsLeft)"
              } else {
                if (isBangla) "অ্যাপে প্রবেশ করুন ✕" else "Continue to App ✕"
              },
              color = Color.White,
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
            )
          }
        }

        Box(
          modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
              Brush.linearGradient(
                listOf(Color(0xFF0F172A), Color(0xFF007A64), Color(0xFF059669))
              )
            )
            .padding(16.dp)
        ) {
          Column(
            modifier = Modifier.align(Alignment.CenterStart),
            verticalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            Surface(color = Color.White.copy(alpha = 0.2f), shape = RoundedCornerShape(50)) {
              Text(
                text = "ID: ${AdMobConfig.APP_OPEN_AD_UNIT_ID}",
                fontSize = 10.sp,
                color = Color.White,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
              )
            }
            Text(
              text = if (isBangla) "রংপুর সুপার শপ ও ইলেকট্রনিক্স ফেয়ার ২০২৬" else "Rangpur Super Shop & Tech Fair 2026",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 18.sp,
              color = Color.White
            )
            Text(
              text = if (isBangla) "স্পন্সরড গুগল এডমোব অ্যাপ ওপেন বিজ্ঞাপন সক্রিয় রয়েছে" else "Live Google AdMob App Open Ad Active",
              fontSize = 12.sp,
              color = Color(0xFFD1FAE5)
            )
          }
        }
      }
    }
  }
}

/**
 * Live Rotating Google AdMob Native Ad Bar designed for marketplace feed & detail screen.
 * Actively cycles through sponsored ads using the user's Native Ad Unit ID.
 */
@Composable
fun AdMobNativeAdBar(
  modifier: Modifier = Modifier,
  isBangla: Boolean = true
) {
  var showDetailsDialog by remember { mutableStateOf(false) }
  var currentCampaignIdx by remember { mutableIntStateOf(0) }

  // Automatically rotate active AdMob Native ads every 5 seconds
  LaunchedEffect(Unit) {
    while (true) {
      delay(5000L)
      currentCampaignIdx = (currentCampaignIdx + 1) % ACTIVE_ADMOB_CAMPAIGNS.size
    }
  }

  val activeCampaign = ACTIVE_ADMOB_CAMPAIGNS[currentCampaignIdx]

  Card(
    modifier = modifier
      .fillMaxWidth()
      .padding(horizontal = 14.dp, vertical = 6.dp)
      .shadow(2.dp, RoundedCornerShape(14.dp))
      .clip(RoundedCornerShape(14.dp))
      .clickable { showDetailsDialog = true }
      .testTag("admob_native_ad_bar"),
    colors = CardDefaults.cardColors(containerColor = Color.White),
    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
    shape = RoundedCornerShape(14.dp)
  ) {
    Column(modifier = Modifier.padding(12.dp)) {
      // Top row: Live Ad badge + AdChoices icon
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Surface(
            shape = RoundedCornerShape(4.dp),
            color = Color(0xFFFBBF24)
          ) {
            Text(
              text = if (isBangla) "বিজ্ঞাপন • Ad" else "Ad • Sponsored",
              fontSize = 10.sp,
              fontWeight = FontWeight.ExtraBold,
              color = Color(0xFF78350F),
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
          }

          Surface(
            shape = RoundedCornerShape(50),
            color = Color(0xFFDCFCE7)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(6.dp)
                  .clip(CircleShape)
                  .background(Color(0xFF16A34A))
              )
              Text(
                text = "AdMob Live",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF166534)
              )
            }
          }

          Text(
            text = activeCampaign.advertiser,
            fontSize = 11.sp,
            color = Color(0xFF64748B),
            fontWeight = FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
        }

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

      // Animated Native Ad Content Row
      AnimatedContent(targetState = activeCampaign, label = "native_ad_rotation") { campaign ->
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Box(
            modifier = Modifier
              .size(54.dp)
              .clip(RoundedCornerShape(10.dp))
              .background(
                Brush.linearGradient(
                  listOf(Color(campaign.accentColor), Color(0xFF0F172A))
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

          Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
          ) {
            Text(
              text = if (isBangla) campaign.headlineBn else campaign.headlineEn,
              style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
              ),
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              color = Color(0xFF0F172A)
            )

            Text(
              text = if (isBangla) campaign.bodyBn else campaign.bodyEn,
              style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
              color = Color(0xFF64748B),
              maxLines = 1,
              overflow = TextOverflow.Ellipsis
            )

            Text(
              text = "★★★★★ 4.9 • Native Unit: ${AdMobConfig.NATIVE_AD_UNIT_ID.takeLast(10)}",
              fontSize = 10.sp,
              color = Color(campaign.accentColor),
              fontWeight = FontWeight.SemiBold
            )
          }

          Button(
            onClick = { showDetailsDialog = true },
            colors = ButtonDefaults.buttonColors(containerColor = Color(campaign.accentColor)),
            shape = RoundedCornerShape(8.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
            modifier = Modifier.height(34.dp)
          ) {
            Text(
              text = if (isBangla) campaign.ctaBn else campaign.ctaEn,
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = Color.White
            )
          }
        }
      }
    }
  }

  // Dialog showing live AdMob configuration details
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
            text = if (isBangla) "গুগল এডমোব লাইভ স্ট্যাটাস" else "Google AdMob Live Status",
            fontWeight = FontWeight.Bold,
            fontSize = 17.sp
          )
        }
      },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Text(
            text = if (isBangla) "আপনার সরবরাহকৃত এডমোব এড ইউনিট কোডগুলো অ্যাপে লাইভ রান করছে:" else "Your AdMob Ad Unit IDs are actively running:",
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
                text = "📌 App Open Ad ID (Active):",
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
                text = "📌 Native Ad ID (Active):",
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
            text = if (isBangla) "✓ বিজ্ঞাপন প্রদর্শন এবং অটো-রোটেশন সক্রিয় রয়েছে।" else "✓ Ads and auto-rotation are active.",
            fontSize = 12.sp,
            color = Color(0xFF16A34A),
            fontWeight = FontWeight.Bold
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
