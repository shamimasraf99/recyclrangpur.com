package com.example

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ProductPhotoView(
  photo: ProductPhoto,
  modifier: Modifier = Modifier,
  showCaptionBadge: Boolean = false,
  isBangla: Boolean = true
) {
  val context = LocalContext.current

  val decodedUriBitmap = remember(photo.uriString) {
    photo.uriString?.let { uriStr ->
      try {
        val uri = Uri.parse(uriStr)
        context.contentResolver.openInputStream(uri)?.use { stream ->
          BitmapFactory.decodeStream(stream)
        }
      } catch (_: Exception) {
        null
      }
    }
  }

  val activeBitmap = photo.bitmap ?: decodedUriBitmap

  Box(modifier = modifier.clip(RoundedCornerShape(16.dp))) {
    if (activeBitmap != null) {
      Image(
        bitmap = activeBitmap.asImageBitmap(),
        contentDescription = if (isBangla) photo.captionBn else photo.captionEn,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop
      )
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .height(52.dp)
          .align(Alignment.BottomCenter)
          .background(
            Brush.verticalGradient(
              listOf(Color.Transparent, Color.Black.copy(alpha = 0.65f))
            )
          )
      )
    } else {
      StudioProductArtwork(
        presetId = photo.studioPresetId,
        modifier = Modifier.fillMaxSize()
      )
    }

    if (showCaptionBadge) {
      Surface(
        color = Color.Black.copy(alpha = 0.68f),
        contentColor = Color.White,
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier
          .align(Alignment.BottomStart)
          .padding(8.dp)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
          Icon(
            imageVector = if (activeBitmap != null) Icons.Default.CheckCircle else Icons.Default.PhotoCamera,
            contentDescription = null,
            tint = Color(0xFF34D399),
            modifier = Modifier.size(14.dp)
          )
          Text(
            text = if (isBangla) photo.captionBn else photo.captionEn,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
        }
      }
    }
  }
}

@Composable
fun StudioProductArtwork(
  presetId: Int,
  modifier: Modifier = Modifier
) {
  val palette = when (presetId) {
    1 -> listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF059669))
    2 -> listOf(Color(0xFF1E1B4B), Color(0xFF312E81), Color(0xFF0EA5E9))
    3 -> listOf(Color(0xFF064E3B), Color(0xFF047857), Color(0xFFF59E0B))
    4 -> listOf(Color(0xFF18181B), Color(0xFF27272A), Color(0xFFEC4899))
    5 -> listOf(Color(0xFF451A03), Color(0xFF78350F), Color(0xFFD97706))
    6 -> listOf(Color(0xFF111827), Color(0xFF374151), Color(0xFF10B981))
    7 -> listOf(Color(0xFF022C22), Color(0xFF065F46), Color(0xFFA3E635))
    9 -> listOf(Color(0xFF451A03), Color(0xFF92400E), Color(0xFFFBBF24))
    10 -> listOf(Color(0xFF500724), Color(0xFF831843), Color(0xFFF472B6))
    11 -> listOf(Color(0xFF3B0764), Color(0xFF581C87), Color(0xFFC084FC))
    12 -> listOf(Color(0xFF052E16), Color(0xFF14532D), Color(0xFF4ADE80))
    13 -> listOf(Color(0xFF1E293B), Color(0xFF334155), Color(0xFF38BDF8))
    else -> listOf(Color(0xFF0C4A6E), Color(0xFF0369A1), Color(0xFFFBBF24))
  }

  val icon = when (presetId) {
    1 -> Icons.Default.Smartphone
    2 -> Icons.Default.LaptopMac
    3 -> Icons.Default.TwoWheeler
    4 -> Icons.Default.Tv
    5 -> Icons.Default.Weekend
    6 -> Icons.Default.PhotoCamera
    7 -> Icons.Default.PedalBike
    9 -> Icons.Default.Pets
    10 -> Icons.Default.Checkroom
    11 -> Icons.Default.AutoAwesome
    12 -> Icons.Default.Restaurant
    13 -> Icons.Default.FitnessCenter
    else -> Icons.Default.SolarPower
  }

  Box(
    modifier = modifier.background(
      Brush.linearGradient(
        colors = listOf(palette[0], palette[1]),
        start = Offset(0f, 0f),
        end = Offset(400f, 400f)
      )
    )
  ) {
    Canvas(modifier = Modifier.fillMaxSize()) {
      val w = size.width
      val h = size.height

      drawCircle(
        brush = Brush.radialGradient(
          colors = listOf(palette[2].copy(alpha = 0.42f), Color.Transparent),
          center = Offset(w * 0.72f, h * 0.28f),
          radius = w * 0.55f
        ),
        center = Offset(w * 0.72f, h * 0.28f),
        radius = w * 0.55f
      )

      drawRoundRect(
        color = Color.White.copy(alpha = 0.06f),
        topLeft = Offset(-w * 0.1f, h * 0.68f),
        size = Size(w * 1.2f, h * 0.45f),
        cornerRadius = CornerRadius(28f, 28f)
      )

      when (presetId) {
        1 -> {
          val pw = w * 0.34f
          val ph = h * 0.68f
          val px = (w - pw) / 2f
          val py = (h - ph) / 2f
          drawRoundRect(
            color = Color.White.copy(alpha = 0.14f),
            topLeft = Offset(px - 18f, py + 10f),
            size = Size(pw, ph),
            cornerRadius = CornerRadius(22f, 22f)
          )
          drawRoundRect(
            color = Color(0xFF0F172A),
            topLeft = Offset(px, py),
            size = Size(pw, ph),
            cornerRadius = CornerRadius(22f, 22f)
          )
          drawRoundRect(
            color = palette[2].copy(alpha = 0.8f),
            topLeft = Offset(px, py),
            size = Size(pw, ph),
            cornerRadius = CornerRadius(22f, 22f),
            style = Stroke(width = 4f)
          )
        }
        2 -> {
          val sw = w * 0.52f
          val sh = h * 0.42f
          val sx = (w - sw) / 2f
          val sy = h * 0.2f
          drawRoundRect(
            color = Color(0xFF0F172A),
            topLeft = Offset(sx, sy),
            size = Size(sw, sh),
            cornerRadius = CornerRadius(14f, 14f)
          )
          drawRoundRect(
            color = palette[2],
            topLeft = Offset(sx, sy),
            size = Size(sw, sh),
            cornerRadius = CornerRadius(14f, 14f),
            style = Stroke(width = 4f)
          )
          drawRoundRect(
            color = Color.White.copy(alpha = 0.7f),
            topLeft = Offset(sx - w * 0.06f, sy + sh + 4f),
            size = Size(sw + w * 0.12f, 10f),
            cornerRadius = CornerRadius(6f, 6f)
          )
        }
        else -> {
          drawCircle(
            color = Color.White.copy(alpha = 0.12f),
            center = Offset(w * 0.5f, h * 0.48f),
            radius = minOf(w, h) * 0.34f,
            style = Stroke(width = 3f)
          )
          drawCircle(
            color = palette[2].copy(alpha = 0.22f),
            center = Offset(w * 0.5f, h * 0.48f),
            radius = minOf(w, h) * 0.27f
          )
        }
      }
    }

    Box(
      modifier = Modifier
        .align(Alignment.Center)
        .size(64.dp)
        .clip(RoundedCornerShape(20.dp))
        .background(Color.White.copy(alpha = 0.14f))
        .border(1.dp, Color.White.copy(alpha = 0.28f), RoundedCornerShape(20.dp)),
      contentAlignment = Alignment.Center
    ) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        tint = Color.White,
        modifier = Modifier.size(36.dp)
      )
    }

    Surface(
      color = Color.Black.copy(alpha = 0.45f),
      contentColor = Color.White,
      shape = RoundedCornerShape(50),
      modifier = Modifier
        .align(Alignment.TopStart)
        .padding(8.dp)
    ) {
      Row(
        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Icon(
          Icons.Default.Verified,
          contentDescription = null,
          tint = Color(0xFF34D399),
          modifier = Modifier.size(13.dp)
        )
        Text(
          text = "Recycl Rangpur",
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold
        )
      }
    }
  }
}

@Composable
fun RecyclRangpurHeroBanner(
  isBangla: Boolean,
  totalAdsCount: Int,
  onPostAdWithPhotoClick: () -> Unit,
  onSelectRangpurFilter: () -> Unit
) {
  Card(
    shape = RoundedCornerShape(24.dp),
    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    modifier = Modifier
      .fillMaxWidth()
      .testTag("hero_banner_card")
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .background(
          Brush.linearGradient(
            colors = listOf(
              Color(0xFF022C22),
              Color(0xFF065F46),
              Color(0xFF047857)
            ),
            start = Offset(0f, 0f),
            end = Offset(900f, 500f)
          )
        )
    ) {
      Canvas(modifier = Modifier.matchParentSize()) {
        val w = size.width
        val h = size.height

        drawCircle(
          brush = Brush.radialGradient(
            colors = listOf(Color(0xFFF59E0B).copy(alpha = 0.35f), Color.Transparent),
            center = Offset(w * 0.88f, h * 0.25f),
            radius = w * 0.45f
          ),
          center = Offset(w * 0.88f, h * 0.25f),
          radius = w * 0.45f
        )

        drawCircle(
          color = Color(0xFF34D399).copy(alpha = 0.14f),
          center = Offset(w * 0.92f, h * 0.78f),
          radius = h * 0.55f,
          style = Stroke(width = 18f)
        )
        drawCircle(
          color = Color.White.copy(alpha = 0.07f),
          center = Offset(w * 0.12f, h * 0.15f),
          radius = h * 0.4f
        )

        val archPath = Path().apply {
          moveTo(w * 0.72f, h)
          lineTo(w * 0.72f, h * 0.65f)
          quadraticTo(w * 0.84f, h * 0.42f, w * 0.96f, h * 0.65f)
          lineTo(w * 0.96f, h)
          close()
        }
        drawPath(archPath, color = Color.White.copy(alpha = 0.06f))
      }

      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Surface(
            color = Color(0xFFF59E0B),
            contentColor = Color(0xFF0F172A),
            shape = RoundedCornerShape(50)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
              Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(15.dp))
              Text(
                text = if (isBangla) "শুধুমাত্র রংপুর মেট্রোপলিটন শহরের মার্কেটপ্লেস" else "Exclusively for Rangpur City Residents",
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold
              )
            }
          }
        }

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Text(
            text = if (isBangla)
              "Recycl Rangpur — রংপুর শহরে পুরাতন পণ্য কিনুন ও বিক্রি করুন!"
            else
              "Recycl Rangpur — Buy & Sell Pre-Owned Goods in Rangpur City!",
            color = Color.White,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 23.sp,
            lineHeight = 30.sp
          )
          Text(
            text = if (isBangla)
              "জাহাজ কোম্পানি মোড়, ধাপ, শাপলা চত্বর, লালবাগ, কাচারী বাজার ও মডার্ন মোড় সহ পুরো রংপুর শহরে পণ্যের ছবি সহ বিজ্ঞাপন দিন।"
            else
              "Snap product photos & trade directly across Jahaj Company More, Dhap, Shapla Chattar, Lalbag & all Rangpur City areas.",
            color = Color(0xFFD1FAE5),
            fontSize = 15.sp,
            lineHeight = 22.sp
          )
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Button(
            onClick = onPostAdWithPhotoClick,
            colors = ButtonDefaults.buttonColors(
              containerColor = Color(0xFFF59E0B),
              contentColor = Color(0xFF0F172A)
            ),
            shape = RoundedCornerShape(14.dp),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 13.dp),
            modifier = Modifier
              .weight(1f)
              .testTag("hero_post_photo_ad_btn")
          ) {
            Icon(
              Icons.Default.AddAPhoto,
              contentDescription = null,
              modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = if (isBangla) "+ পণ্যের ছবি ও বিজ্ঞাপন দিন" else "+ Add Photos & Post Ad",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 15.sp
            )
          }

          FilledTonalButton(
            onClick = onSelectRangpurFilter,
            colors = ButtonDefaults.filledTonalButtonColors(
              containerColor = Color.White.copy(alpha = 0.16f),
              contentColor = Color.White
            ),
            shape = RoundedCornerShape(14.dp),
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 13.dp),
            modifier = Modifier.testTag("hero_rangpur_filter_btn")
          ) {
            Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color(0xFFFDE68A))
            Spacer(modifier = Modifier.width(5.dp))
            Text(
              text = if (isBangla) "রংপুর শহর ($totalAdsCount)" else "Rangpur City ($totalAdsCount)",
              fontWeight = FontWeight.Bold,
              fontSize = 14.sp
            )
          }
        }
      }
    }
  }
}
