package com.example

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailDialog(
  product: MarketProduct,
  isBangla: Boolean,
  isSaved: Boolean,
  onToggleSave: () -> Unit,
  onAddPhotoToProduct: (ProductPhoto) -> Unit,
  onEditListingWithPhotos: () -> Unit,
  onDismiss: () -> Unit
) {
  var selectedPhotoIdx by remember(product.photos.size) { mutableStateOf(0) }
  var isPhoneRevealed by remember { mutableStateOf(false) }
  var quickPhotoToast by remember { mutableStateOf<String?>(null) }

  val detailGalleryLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.PickVisualMedia()
  ) { uri ->
    if (uri != null) {
      val newPhoto = ProductPhoto(
        id = "detail_gal_${System.currentTimeMillis()}",
        studioPresetId = product.categoryId.coerceIn(1, 8),
        captionBn = "নতুন যুক্ত করা ছবি #${product.photos.size + 1}",
        captionEn = "Added Photo #${product.photos.size + 1}",
        uriString = uri.toString()
      )
      onAddPhotoToProduct(newPhoto)
      selectedPhotoIdx = product.photos.size
      quickPhotoToast = if (isBangla) "পণ্যে নতুন ছবি যুক্ত হয়েছে!" else "New photo added to product!"
    }
  }

  val detailCameraLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.TakePicturePreview()
  ) { bmp ->
    if (bmp != null) {
      val newPhoto = ProductPhoto(
        id = "detail_cam_${System.currentTimeMillis()}",
        studioPresetId = product.categoryId.coerceIn(1, 8),
        captionBn = "ক্যামেরা ছবি #${product.photos.size + 1}",
        captionEn = "Camera Photo #${product.photos.size + 1}",
        bitmap = bmp
      )
      onAddPhotoToProduct(newPhoto)
      selectedPhotoIdx = product.photos.size
      quickPhotoToast = if (isBangla) "ক্যামেরা ছবি যুক্ত হয়েছে!" else "Camera photo added!"
    }
  }

  val safePhotoIdx = selectedPhotoIdx.coerceIn(0, (product.photos.size - 1).coerceAtLeast(0))
  val currentPhoto = product.photos.getOrElse(safePhotoIdx) {
    ProductPhoto("fallback", studioPresetId = product.categoryId.coerceIn(1, 8))
  }

  AlertDialog(
    onDismissRequest = onDismiss,
    title = {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column(modifier = Modifier.weight(1f)) {
          Text(
            text = if (isBangla) product.titleBn else product.titleEn,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 20.sp,
            lineHeight = 26.sp
          )
          Text(
            text = "${if (isBangla) product.locationBn else product.locationEn} • ${if (isBangla) product.postedAgoBn else product.postedAgoEn}",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.outline
          )
        }
        IconButton(onClick = onToggleSave) {
          Icon(
            imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            contentDescription = "Save",
            tint = if (isSaved) Color(0xFFE11D48) else MaterialTheme.colorScheme.outline
          )
        }
      }
    },
    text = {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
      ) {
        Box(
          modifier = Modifier
            .fillMaxWidth()
            .height(215.dp)
            .clip(RoundedCornerShape(18.dp))
        ) {
          ProductPhotoView(
            photo = currentPhoto,
            modifier = Modifier.fillMaxSize(),
            showCaptionBadge = true,
            isBangla = isBangla
          )

          Surface(
            color = Color.Black.copy(alpha = 0.68f),
            contentColor = Color.White,
            shape = RoundedCornerShape(50),
            modifier = Modifier
              .align(Alignment.TopEnd)
              .padding(10.dp)
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
              Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(14.dp))
              Text(
                text = "${safePhotoIdx + 1} / ${product.photos.size}",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }

        LazyRow(
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          itemsIndexed(product.photos) { idx, p ->
            Box(
              modifier = Modifier
                .size(62.dp)
                .clip(RoundedCornerShape(12.dp))
                .border(
                  width = if (idx == safePhotoIdx) 2.5.dp else 1.dp,
                  color = if (idx == safePhotoIdx) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                  shape = RoundedCornerShape(12.dp)
                )
                .clickable { selectedPhotoIdx = idx }
            ) {
              ProductPhotoView(photo = p, modifier = Modifier.fillMaxSize(), isBangla = isBangla)
            }
          }

          item {
            Surface(
              color = MaterialTheme.colorScheme.primaryContainer,
              contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .height(62.dp)
                .clickable {
                  detailGalleryLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                  )
                }
                .testTag("detail_add_photo_btn")
            ) {
              Column(
                modifier = Modifier.padding(horizontal = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
              ) {
                Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(20.dp))
                Text(
                  text = if (isBangla) "+ ছবি যোগ" else "+ Photo",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }

          item {
            Surface(
              color = MaterialTheme.colorScheme.secondaryContainer,
              contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .height(62.dp)
                .clickable { detailCameraLauncher.launch(null) }
                .testTag("detail_camera_photo_btn")
            ) {
              Column(
                modifier = Modifier.padding(horizontal = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
              ) {
                Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(20.dp))
                Text(
                  text = if (isBangla) "ক্যামেরা" else "Camera",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }
        }

        quickPhotoToast?.let { msg ->
          Text(
            text = "✓ $msg",
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
          )
        }

        Surface(
          color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
          shape = RoundedCornerShape(14.dp),
          modifier = Modifier.fillMaxWidth()
        ) {
          Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Column {
              Text(
                text = "৳ ${"%,d".format(product.priceBdt)}",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 25.sp,
                color = MaterialTheme.colorScheme.primary
              )
              Text(
                text = if (product.isNegotiable) {
                  if (isBangla) "মূল্য আলোচনা সাপেক্ষ" else "Price is Negotiable"
                } else {
                  if (isBangla) "একদাম (Fixed Price)" else "Fixed Price"
                },
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer
              )
            }

            SuggestionChip(
              onClick = {},
              label = { Text(product.condition, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
            )
          }
        }

        Text(
          text = if (isBangla) product.descriptionBn else product.descriptionEn,
          fontSize = 16.sp,
          lineHeight = 24.sp
        )

        HorizontalDivider()

        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
          Text(if (isBangla) "বিক্রেতা:" else "Seller:", fontSize = 15.sp, color = MaterialTheme.colorScheme.outline)
          Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(16.dp))
            Text(product.sellerName, fontSize = 15.sp, fontWeight = FontWeight.Bold)
          }
        }

        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
          Text(if (isBangla) "রংপুর শহরের এলাকা:" else "Rangpur City Area:", fontSize = 15.sp, color = MaterialTheme.colorScheme.outline)
          Text(if (isBangla) product.locationBn else product.locationEn, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        }

        if (isPhoneRevealed) {
          Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            modifier = Modifier.fillMaxWidth()
          ) {
            Row(
              modifier = Modifier.padding(14.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
              Column {
                Text(
                  text = product.phone,
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 19.sp,
                  color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                  text = if (isBangla) "সরাসরি কথা বলুন • অগ্রিম টাকা পাঠাবেন না" else "Call directly • Do not send advance money",
                  fontSize = 13.sp,
                  color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                )
              }
            }
          }
        } else {
          Button(
            onClick = { isPhoneRevealed = true },
            modifier = Modifier
              .fillMaxWidth()
              .testTag("reveal_phone_btn"),
            shape = RoundedCornerShape(12.dp)
          ) {
            Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(if (isBangla) "বিক্রেতার নম্বর দেখুন" else "Show Seller Phone", fontSize = 15.sp, fontWeight = FontWeight.Bold)
          }
        }

        OutlinedButton(
          onClick = onEditListingWithPhotos,
          shape = RoundedCornerShape(12.dp),
          modifier = Modifier
            .fillMaxWidth()
            .testTag("edit_product_photos_btn")
        ) {
          Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, modifier = Modifier.size(18.dp))
          Spacer(modifier = Modifier.width(6.dp))
          Text(
            text = if (isBangla) "এই পণ্যের ছবি পরিবর্তন / নতুন ছবি যোগ করুন" else "Edit / Add More Product Photos",
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
          )
        }
      }
    },
    confirmButton = {
      TextButton(onClick = onDismiss) {
        Text(if (isBangla) "বন্ধ করুন" else "Close", fontSize = 15.sp, fontWeight = FontWeight.Bold)
      }
    }
  )
}
