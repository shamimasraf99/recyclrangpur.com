package com.example

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ProductDetailScreen(
  product: MarketProduct,
  allProducts: List<MarketProduct> = emptyList(),
  isBangla: Boolean,
  isSaved: Boolean,
  canModify: Boolean = false,
  onToggleSave: () -> Unit,
  onAddPhotoToProduct: (ProductPhoto) -> Unit,
  onEditListingWithPhotos: () -> Unit,
  onDeleteListing: (() -> Unit)? = null,
  onSelectOtherProduct: (MarketProduct) -> Unit = {},
  onBack: () -> Unit
) {
  BackHandler { onBack() }

  var selectedPhotoIdx by remember(product.id, product.photos.size) { mutableIntStateOf(0) }
  var isPhoneRevealed by remember(product.id) { mutableStateOf(false) }
  var showWhatsappSheet by remember(product.id) { mutableStateOf(false) }
  var quickPhotoToast by remember(product.id) { mutableStateOf<String?>(null) }

  val detailGalleryLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.PickVisualMedia()
  ) { uri ->
    if (uri != null && canModify) {
      val newPhoto = ProductPhoto(
        id = "detail_gal_${System.currentTimeMillis()}",
        studioPresetId = product.categoryId.coerceIn(1, 13),
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
    if (bmp != null && canModify) {
      val newPhoto = ProductPhoto(
        id = "detail_cam_${System.currentTimeMillis()}",
        studioPresetId = product.categoryId.coerceIn(1, 13),
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
    ProductPhoto("fallback", studioPresetId = product.categoryId.coerceIn(1, 13))
  }

  val categoryPair = CATEGORIES.getOrElse(product.categoryId.coerceIn(1, CATEGORIES.size - 1)) {
    CATEGORIES.last()
  }

  val similarProducts = remember(product.id, product.categoryId, allProducts) {
    allProducts.filter { it.id != product.id && it.categoryId == product.categoryId }
      .ifEmpty { allProducts.filter { it.id != product.id }.take(4) }
  }

  Scaffold(
    modifier = Modifier
      .fillMaxSize()
      .testTag("product_detail_page"),
    topBar = {
      Surface(
        color = Color.White,
        shadowElevation = 3.dp,
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
          ) {
            IconButton(
              onClick = onBack,
              modifier = Modifier
                .size(38.dp)
                .background(Color(0xFFF1F5F9), CircleShape)
                .testTag("detail_back_btn")
            ) {
              Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color(0xFF0F172A),
                modifier = Modifier.size(20.dp)
              )
            }

            Column(modifier = Modifier.weight(1f)) {
              Text(
                text = if (isBangla) categoryPair.first else categoryPair.second,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF007A64)
              )
              Text(
                text = if (isBangla) product.titleBn else product.titleEn,
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF0F172A),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
            }
          }

          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            if (canModify) {
              IconButton(
                onClick = onEditListingWithPhotos,
                modifier = Modifier
                  .size(38.dp)
                  .background(Color(0xFF007A64).copy(alpha = 0.12f), CircleShape)
                  .testTag("top_edit_product_btn")
              ) {
                Icon(
                  imageVector = Icons.Default.Edit,
                  contentDescription = "Edit",
                  tint = Color(0xFF007A64),
                  modifier = Modifier.size(18.dp)
                )
              }
            }

            IconButton(
              onClick = onToggleSave,
              modifier = Modifier
                .size(38.dp)
                .background(Color(0xFFF1F5F9), CircleShape)
                .testTag("detail_save_btn")
            ) {
              Icon(
                imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                contentDescription = "Save",
                tint = if (isSaved) Color(0xFFE11D48) else Color(0xFF475569),
                modifier = Modifier.size(20.dp)
              )
            }
          }
        }
      }
    },
    bottomBar = {
      // Sticky E-Commerce Bottom Call / Buy / Action Bar
      Surface(
        color = Color.White,
        shadowElevation = 12.dp,
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          AnimatedVisibility(visible = isPhoneRevealed) {
            Card(
              colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
              border = BorderStroke(1.dp, Color(0xFF6EE7B7)),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                  Icon(Icons.Default.PhoneInTalk, contentDescription = null, tint = Color(0xFF007A64))
                  Column {
                    Text(
                      text = product.phone,
                      fontWeight = FontWeight.ExtraBold,
                      fontSize = 18.sp,
                      color = Color(0xFF065F46)
                    )
                    Text(
                      text = if (isBangla) "বিক্রেতা: ${product.sellerName} • সরাসরি কথা বলুন" else "Seller: ${product.sellerName}",
                      fontSize = 12.sp,
                      color = Color(0xFF047857)
                    )
                  }
                }
                IconButton(onClick = { isPhoneRevealed = false }, modifier = Modifier.size(28.dp)) {
                  Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xFF065F46), modifier = Modifier.size(16.dp))
                }
              }
            }
          }

          AnimatedVisibility(visible = showWhatsappSheet) {
            Card(
              colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
              border = BorderStroke(1.dp, Color(0xFF86EFAC)),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                  Icon(Icons.Default.Chat, contentDescription = null, tint = Color(0xFF16A34A))
                  Column {
                    Text(
                      text = "WhatsApp: ${product.phone}",
                      fontWeight = FontWeight.ExtraBold,
                      fontSize = 16.sp,
                      color = Color(0xFF166534)
                    )
                    Text(
                      text = if (isBangla) "রংপুর শহরে সরাসরি পণ্য দেখে লেনদেন করুন" else "Inspect item in person in Rangpur City",
                      fontSize = 12.sp,
                      color = Color(0xFF15803D)
                    )
                  }
                }
                IconButton(onClick = { showWhatsappSheet = false }, modifier = Modifier.size(28.dp)) {
                  Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xFF166534), modifier = Modifier.size(16.dp))
                }
              }
            }
          }

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            // Price summary on left of sticky bar
            Column(modifier = Modifier.weight(0.85f)) {
              Text(
                text = if (isBangla) "সর্বমোট মূল্য" else "Total Price",
                fontSize = 11.sp,
                color = Color(0xFF64748B)
              )
              Text(
                text = "৳ ${"%,d".format(product.priceBdt)}",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 20.sp,
                color = Color(0xFF007A64)
              )
            }

            // Call / Reveal Number Button
            Button(
              onClick = { isPhoneRevealed = !isPhoneRevealed },
              colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .weight(1.15f)
                .height(48.dp)
                .testTag("reveal_phone_btn")
            ) {
              Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (isPhoneRevealed) product.phone else (if (isBangla) "কল / নম্বর দেখুন" else "Call Seller"),
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
            }

            // WhatsApp / Chat Button
            FilledTonalButton(
              onClick = { showWhatsappSheet = !showWhatsappSheet },
              colors = ButtonDefaults.filledTonalButtonColors(
                containerColor = Color(0xFFDCFCE7),
                contentColor = Color(0xFF166534)
              ),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .height(48.dp)
                .testTag("whatsapp_chat_btn")
            ) {
              Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(4.dp))
              Text(
                text = if (isBangla) "চ্যাট" else "Chat",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        }
      }
    }
  ) { innerPadding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .background(Color(0xFFF8FAFC))
        .padding(innerPadding),
      contentPadding = PaddingValues(bottom = 28.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      // 1. E-Commerce Hero Image Showcase & Thumbnail Strip
      item(key = "ecommerce_gallery") {
        Card(
          shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            Box(
              modifier = Modifier
                .fillMaxWidth()
                .height(275.dp)
                .clip(RoundedCornerShape(18.dp))
            ) {
              ProductPhotoView(
                photo = currentPhoto,
                modifier = Modifier.fillMaxSize(),
                showCaptionBadge = true,
                isBangla = isBangla
              )

              if (product.isFeatured) {
                Surface(
                  color = Color(0xFFFFD166),
                  contentColor = Color(0xFF0F172A),
                  shape = RoundedCornerShape(50),
                  modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(12.dp)
                ) {
                  Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(14.dp))
                    Text(
                      text = if (isBangla) "ফিচার্ড বিজ্ঞাপন" else "Featured Ad",
                      fontSize = 11.sp,
                      fontWeight = FontWeight.ExtraBold
                    )
                  }
                }
              }

              Surface(
                color = Color.Black.copy(alpha = 0.68f),
                contentColor = Color.White,
                shape = RoundedCornerShape(50),
                modifier = Modifier
                  .align(Alignment.TopEnd)
                  .padding(12.dp)
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                  Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(14.dp))
                  Text(
                    text = "${safePhotoIdx + 1} / ${product.photos.size}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                  )
                }
              }
            }

            // Thumbnail strip + Owner Photo Upload Actions
            LazyRow(
              horizontalArrangement = Arrangement.spacedBy(10.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              itemsIndexed(product.photos) { idx, p ->
                Box(
                  modifier = Modifier
                    .size(66.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .border(
                      width = if (idx == safePhotoIdx) 2.5.dp else 1.dp,
                      color = if (idx == safePhotoIdx) Color(0xFF007A64) else Color(0xFFCBD5E1),
                      shape = RoundedCornerShape(12.dp)
                    )
                    .clickable { selectedPhotoIdx = idx }
                ) {
                  ProductPhotoView(photo = p, modifier = Modifier.fillMaxSize(), isBangla = isBangla)
                }
              }

              if (canModify) {
                item {
                  Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                      .height(66.dp)
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
                      Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(18.dp))
                      Text(
                        text = if (isBangla) "+ ছবি যোগ" else "+ Photo",
                        fontSize = 11.sp,
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
                      .height(66.dp)
                      .clickable { detailCameraLauncher.launch(null) }
                      .testTag("detail_camera_photo_btn")
                  ) {
                    Column(
                      modifier = Modifier.padding(horizontal = 10.dp),
                      horizontalAlignment = Alignment.CenterHorizontally,
                      verticalArrangement = Arrangement.Center
                    ) {
                      Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(18.dp))
                      Text(
                        text = if (isBangla) "ক্যামেরা" else "Camera",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                      )
                    }
                  }
                }
              }
            }

            quickPhotoToast?.let { msg ->
              Text(
                text = "✓ $msg",
                color = Color(0xFF007A64),
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
              )
            }
          }
        }
      }

      // 2. Title, Price, Badges & Location Card
      item(key = "ecommerce_title_price_card") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
          ) {
            Row(
              horizontalArrangement = Arrangement.spacedBy(8.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Surface(
                color = Color(0xFF007A64).copy(alpha = 0.12f),
                shape = RoundedCornerShape(6.dp)
              ) {
                Text(
                  text = if (isBangla) categoryPair.first else categoryPair.second,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFF007A64),
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
              }

              Surface(
                color = Color(0xFFF1F5F9),
                shape = RoundedCornerShape(6.dp)
              ) {
                Text(
                  text = product.condition,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = Color(0xFF334155),
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
              }
            }

            Text(
              text = if (isBangla) product.titleBn else product.titleEn,
              fontWeight = FontWeight.ExtraBold,
              fontSize = 21.sp,
              lineHeight = 28.sp,
              color = Color(0xFF0F172A)
            )

            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = null,
                tint = Color(0xFF007A64),
                modifier = Modifier.size(16.dp)
              )
              Text(
                text = "${if (isBangla) product.locationBn else product.locationEn} • ${if (isBangla) product.postedAgoBn else product.postedAgoEn}",
                fontSize = 13.sp,
                color = Color(0xFF64748B)
              )
            }

            Surface(
              color = Color(0xFF007A64).copy(alpha = 0.08f),
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
                    fontSize = 26.sp,
                    color = Color(0xFF007A64)
                  )
                  Text(
                    text = if (product.isNegotiable) {
                      if (isBangla) "মূল্য আলোচনা সাপেক্ষ (Negotiable)" else "Price is Negotiable"
                    } else {
                      if (isBangla) "একদাম (Fixed Price)" else "Fixed Price"
                    },
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF334155)
                  )
                }

                Surface(
                  color = Color.White,
                  shape = RoundedCornerShape(10.dp),
                  border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                ) {
                  Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(16.dp))
                    Text(
                      text = if (isBangla) "যাচাইকৃত পণ্য" else "Verified Ad",
                      fontSize = 12.sp,
                      fontWeight = FontWeight.Bold,
                      color = Color(0xFF0F172A)
                    )
                  }
                }
              }
            }
          }
        }
      }

      // 3. Product Specifications & Full Description Card
      item(key = "ecommerce_specs_description") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            Text(
              text = if (isBangla) "পণ্যের স্পেসিফিকেশন ও বিবরণ" else "Specifications & Description",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 17.sp,
              color = Color(0xFF0F172A)
            )

            // Spec Table
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFFF8FAFC))
                .padding(12.dp),
              verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              SpecRow(
                label = if (isBangla) "ক্যাটাগরি" else "Category",
                value = if (isBangla) categoryPair.first else categoryPair.second
              )
              HorizontalDivider(color = Color(0xFFE2E8F0))
              SpecRow(
                label = if (isBangla) "পণ্যের অবস্থা" else "Condition",
                value = product.condition
              )
              HorizontalDivider(color = Color(0xFFE2E8F0))
              SpecRow(
                label = if (isBangla) "দামের ধরন" else "Price Type",
                value = if (product.isNegotiable) (if (isBangla) "আলোচনা সাপেক্ষ" else "Negotiable") else (if (isBangla) "একদাম" else "Fixed")
              )
              HorizontalDivider(color = Color(0xFFE2E8F0))
              SpecRow(
                label = if (isBangla) "এলাকা" else "Area",
                value = if (isBangla) product.districtBn else product.districtEn
              )
            }

            Text(
              text = if (isBangla) "বিস্তারিত বিবরণ:" else "Detailed Description:",
              fontWeight = FontWeight.Bold,
              fontSize = 14.sp,
              color = Color(0xFF334155)
            )

            Text(
              text = if (isBangla) product.descriptionBn else product.descriptionEn,
              fontSize = 15.sp,
              lineHeight = 23.sp,
              color = Color(0xFF1E293B)
            )
          }
        }
      }

      // 4. Seller Info & Ownership Management Card
      item(key = "ecommerce_seller_card") {
        Card(
          shape = RoundedCornerShape(18.dp),
          colors = CardDefaults.cardColors(containerColor = Color.White),
          elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            Text(
              text = if (isBangla) "বিক্রেতার তথ্য" else "Seller Information",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 17.sp,
              color = Color(0xFF0F172A)
            )

            Row(
              modifier = Modifier.fillMaxWidth(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(48.dp)
                  .clip(CircleShape)
                  .background(Color(0xFF007A64).copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = product.sellerName.take(1).uppercase(),
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 20.sp,
                  color = Color(0xFF007A64)
                )
              }

              Column(modifier = Modifier.weight(1f)) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                  Text(
                    text = product.sellerName,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = Color(0xFF0F172A)
                  )
                  Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = null,
                    tint = Color(0xFF059669),
                    modifier = Modifier.size(16.dp)
                  )
                }
                Text(
                  text = "${if (isBangla) product.sellerBadgeBn else product.sellerBadgeEn} • ★ ${product.sellerRating} (${product.sellerReviewCount})",
                  fontSize = 12.sp,
                  color = Color(0xFF64748B)
                )
              }
            }

            // Strict Ownership & Admin Check: Only post owner or Admin can edit/delete
            if (canModify) {
              HorizontalDivider(color = Color(0xFFF1F5F9))
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
              ) {
                OutlinedButton(
                  onClick = onEditListingWithPhotos,
                  shape = RoundedCornerShape(12.dp),
                  modifier = Modifier
                    .weight(1f)
                    .testTag("edit_product_photos_btn")
                ) {
                  Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                  Spacer(modifier = Modifier.width(6.dp))
                  Text(
                    text = if (isBangla) "বিজ্ঞাপন এডিট করুন" else "Edit Listing",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                  )
                }

                if (onDeleteListing != null) {
                  OutlinedButton(
                    onClick = onDeleteListing,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE11D48)),
                    modifier = Modifier.testTag("delete_product_btn")
                  ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                      text = if (isBangla) "মুছুন" else "Delete",
                      fontSize = 13.sp,
                      fontWeight = FontWeight.Bold
                    )
                  }
                }
              }
            } else {
              Surface(
                color = Color(0xFFF1F5F9),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                  .fillMaxWidth()
                  .testTag("readonly_ownership_notice")
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = Color(0xFF64748B),
                    modifier = Modifier.size(15.dp)
                  )
                  Text(
                    text = if (isBangla)
                      "শুধুমাত্র বিজ্ঞাপনদাতা ও অ্যাডমিন এই পোস্ট এডিট করতে পারবেন"
                    else
                      "Only the post author and admin can edit this listing",
                    fontSize = 12.sp,
                    color = Color(0xFF475569),
                    fontWeight = FontWeight.Medium
                  )
                }
              }
            }
          }
        }
      }

      // 5. Similar Products Section (E-Commerce Recommended Row)
      if (similarProducts.isNotEmpty()) {
        item(key = "ecommerce_similar_products") {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .padding(top = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Text(
              text = if (isBangla) "রংপুরের আরও কিছু সম্পর্কিত বিজ্ঞাপন" else "Similar Products in Rangpur",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 16.sp,
              color = Color(0xFF0F172A),
              modifier = Modifier.padding(horizontal = 16.dp)
            )

            LazyRow(
              contentPadding = PaddingValues(horizontal = 14.dp),
              horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              items(similarProducts, key = { "sim_${it.id}" }) { sim ->
                val simPhoto = sim.photos.firstOrNull() ?: ProductPhoto(
                  id = "sim_photo_${sim.id}",
                  studioPresetId = sim.categoryId.coerceIn(1, 13)
                )
                Card(
                  shape = RoundedCornerShape(14.dp),
                  colors = CardDefaults.cardColors(containerColor = Color.White),
                  elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                  modifier = Modifier
                    .width(175.dp)
                    .clickable { onSelectOtherProduct(sim) }
                ) {
                  Column {
                    Box(
                      modifier = Modifier
                        .fillMaxWidth()
                        .height(105.dp)
                    ) {
                      ProductPhotoView(
                        photo = simPhoto,
                        modifier = Modifier.fillMaxSize(),
                        showCaptionBadge = false,
                        isBangla = isBangla
                      )
                    }
                    Column(
                      modifier = Modifier.padding(10.dp),
                      verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                      Text(
                        text = if (isBangla) sim.titleBn else sim.titleEn,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = Color(0xFF0F172A)
                      )
                      Text(
                        text = if (isBangla) sim.districtBn else sim.districtEn,
                        fontSize = 11.sp,
                        color = Color(0xFF64748B),
                        maxLines = 1
                      )
                      Text(
                        text = "Tk ${sim.priceBdt}",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        color = Color(0xFF007A64)
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun SpecRow(label: String, value: String) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
  ) {
    Text(text = label, fontSize = 13.sp, color = Color(0xFF64748B))
    Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
  }
}
