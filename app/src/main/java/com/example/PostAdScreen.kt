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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostAdScreen(
  isBangla: Boolean,
  initialProductToEdit: MarketProduct? = null,
  currentUser: AuthenticatedUser? = null,
  defaultSellerName: String = "মোঃ রাশেদুল ইসলাম",
  defaultSellerPhone: String = "01711223344",
  onPublishProduct: (MarketProduct) -> Unit,
  onCancel: () -> Unit
) {
  BackHandler { onCancel() }

  var title by remember { mutableStateOf(initialProductToEdit?.titleBn ?: "") }
  var priceText by remember { mutableStateOf(initialProductToEdit?.priceBdt?.toString() ?: "") }
  var selectedCategoryId by remember { mutableIntStateOf(initialProductToEdit?.categoryId ?: 1) }
  var selectedCondition by remember { mutableStateOf(initialProductToEdit?.condition ?: "যেমন নতুন") }
  var isNegotiable by remember { mutableStateOf(initialProductToEdit?.isNegotiable ?: true) }
  var allowWhatsapp by remember { mutableStateOf(initialProductToEdit?.allowWhatsapp ?: true) }
  var selectedCityAreaIdx by remember { mutableIntStateOf(initialProductToEdit?.areaIndex ?: 1) }
  var areaDetails by remember { mutableStateOf(initialProductToEdit?.locationBn ?: "জাহাজ কোম্পানি মোড়, রংপুর শহর") }
  var sellerName by remember { mutableStateOf(initialProductToEdit?.sellerName ?: defaultSellerName) }
  var sellerPhone by remember { mutableStateOf(initialProductToEdit?.phone ?: defaultSellerPhone) }
  var description by remember {
    mutableStateOf(
      initialProductToEdit?.descriptionBn
        ?: "যত্ন সহকারে ব্যবহৃত পণ্য। রংপুর শহরে সরাসরি এসে দেখে যাচাই করে নিতে পারবেন।"
    )
  }

  val uploadedPhotos = remember {
    mutableStateListOf<ProductPhoto>().apply {
      if (initialProductToEdit != null && initialProductToEdit.photos.isNotEmpty()) {
        addAll(initialProductToEdit.photos)
      } else {
        add(
          ProductPhoto(
            id = "init_photo_1",
            studioPresetId = 1,
            captionBn = "প্রধান ছবি (কভার)",
            captionEn = "Main Cover Photo"
          )
        )
      }
    }
  }

  var showStudioPicker by remember { mutableStateOf(true) }
  var showLivePreview by remember { mutableStateOf(true) }
  var validationError by remember { mutableStateOf<String?>(null) }
  var photoAddedFeedback by remember { mutableStateOf<String?>(null) }

  val galleryLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.PickMultipleVisualMedia(maxItems = 5)
  ) { uris ->
    if (uris.isNotEmpty()) {
      val remainingSlots = (5 - uploadedPhotos.size).coerceAtLeast(0)
      val toAdd = uris.take(remainingSlots)
      toAdd.forEachIndexed { idx, uri ->
        uploadedPhotos.add(
          ProductPhoto(
            id = "gallery_${System.currentTimeMillis()}_$idx",
            studioPresetId = selectedCategoryId.coerceIn(1, 13),
            captionBn = "গ্যালারি ছবি #${uploadedPhotos.size + 1}",
            captionEn = "Gallery Photo #${uploadedPhotos.size + 1}",
            uriString = uri.toString()
          )
        )
      }
      photoAddedFeedback = if (isBangla) {
        "${toAdd.size}টি ছবি গ্যালারি থেকে যুক্ত হয়েছে!"
      } else {
        "${toAdd.size} photo(s) added from Gallery!"
      }
      validationError = null
    }
  }

  val cameraLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.TakePicturePreview()
  ) { bitmap ->
    if (bitmap != null && uploadedPhotos.size < 5) {
      uploadedPhotos.add(
        ProductPhoto(
          id = "camera_${System.currentTimeMillis()}",
          studioPresetId = selectedCategoryId.coerceIn(1, 13),
          captionBn = "ক্যামেরা ছবি #${uploadedPhotos.size + 1}",
          captionEn = "Camera Photo #${uploadedPhotos.size + 1}",
          bitmap = bitmap
        )
      )
      photoAddedFeedback = if (isBangla) "ক্যামেরা থেকে নতুন ছবি যুক্ত হয়েছে!" else "New camera photo captured!"
      validationError = null
    }
  }

  val conditions = listOf(
    "যেমন নতুন" to "Like New",
    "খুব ভালো" to "Very Good",
    "ভালো" to "Good",
    "মোটামুটি" to "Fair",
    "নতুন (ইনট্যাক্ট)" to "Brand New"
  )

  val selectedCategoryObj = BIKROY_CATEGORY_LIST.find { it.id == selectedCategoryId } ?: BIKROY_CATEGORY_LIST[1]

  LazyColumn(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFFF1F5F9))
      .testTag("post_ad_screen"),
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp)
  ) {
    // Modern Gradient Studio Header
    item {
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
                colors = listOf(Color(0xFF005B4B), Color(0xFF007A64), Color(0xFF059669))
              )
            )
            .padding(18.dp)
        ) {
          Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
              ) {
                Surface(
                  color = Color(0xFFFFD166),
                  contentColor = Color(0xFF0F172A),
                  shape = RoundedCornerShape(14.dp),
                  modifier = Modifier.size(46.dp)
                ) {
                  Box(contentAlignment = Alignment.Center) {
                    Icon(
                      imageVector = if (initialProductToEdit != null) Icons.Default.EditNote else Icons.Default.AddAPhoto,
                      contentDescription = null,
                      modifier = Modifier.size(26.dp)
                    )
                  }
                }
                Column {
                  Text(
                    text = if (initialProductToEdit != null) {
                      if (isBangla) "বিজ্ঞাপন আপডেট স্টুডিও" else "Edit Listing Studio"
                    } else {
                      if (isBangla) "আধুনিক বিজ্ঞাপন প্রকাশ পেজ" else "Modern Ad Publishing Studio"
                    },
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 19.sp,
                    color = Color.White
                  )
                  Text(
                    text = if (isBangla)
                      "Recycle Bin Rangpur • ৩টি সহজ ধাপে দ্রুত পণ্য বিক্রি করুন"
                    else
                      "Recycle Bin Rangpur • Sell faster in 3 simple steps",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.88f)
                  )
                }
              }

              IconButton(
                onClick = onCancel,
                modifier = Modifier
                  .background(Color.White.copy(alpha = 0.16f), CircleShape)
                  .size(36.dp)
                  .testTag("close_post_ad_btn")
              ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(18.dp))
              }
            }

            // Modern 3-Step Indicator Bar
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              val steps = listOf(
                (if (isBangla) "১. পণ্যের ছবি" else "1. Photos") to uploadedPhotos.isNotEmpty(),
                (if (isBangla) "২. ক্যাটাগরি ও দাম" else "2. Details") to (title.length >= 3 && (priceText.toIntOrNull() ?: 0) > 0),
                (if (isBangla) "৩. লোকেশন ও প্রকাশ" else "3. Publish") to sellerPhone.isNotBlank()
              )
              steps.forEach { (label, isDone) ->
                Surface(
                  color = if (isDone) Color(0xFFFFD166) else Color.White.copy(alpha = 0.15f),
                  shape = RoundedCornerShape(50),
                  modifier = Modifier.weight(1f)
                ) {
                  Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                  ) {
                    Icon(
                      imageVector = if (isDone) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                      contentDescription = null,
                      tint = if (isDone) Color(0xFF0F172A) else Color.White,
                      modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                      text = label,
                      fontSize = 11.sp,
                      fontWeight = FontWeight.Bold,
                      color = if (isDone) Color(0xFF0F172A) else Color.White,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis
                    )
                  }
                }
              }
            }
          }
        }
      }
    }

    // Live Ad Preview Card
    item {
      Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFCBD5E1)),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .clickable { showLivePreview = !showLivePreview },
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
              Icon(Icons.Default.Visibility, contentDescription = null, tint = Color(0xFF007A64), modifier = Modifier.size(18.dp))
              Text(
                text = if (isBangla) "লাইভ বিজ্ঞাপন প্রিভিউ (কেমন দেখাবে)" else "Live Ad Preview",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 14.sp,
                color = Color(0xFF0F172A)
              )
            }
            Text(
              text = if (showLivePreview) (if (isBangla) "লুকান ▴" else "Hide ▴") else (if (isBangla) "দেখুন ▾" else "Show ▾"),
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF007A64)
            )
          }

          AnimatedVisibility(visible = showLivePreview) {
            val previewPhoto = uploadedPhotos.firstOrNull() ?: ProductPhoto(
              id = "preview_fallback",
              studioPresetId = selectedCategoryId.coerceIn(1, 13)
            )
            Surface(
              color = Color(0xFFF8FAFC),
              shape = RoundedCornerShape(14.dp),
              border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
              modifier = Modifier.fillMaxWidth()
            ) {
              Row(
                modifier = Modifier.padding(10.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                Box(
                  modifier = Modifier
                    .size(82.dp)
                    .clip(RoundedCornerShape(12.dp))
                ) {
                  ProductPhotoView(
                    photo = previewPhoto,
                    modifier = Modifier.fillMaxSize(),
                    showCaptionBadge = false,
                    isBangla = isBangla
                  )
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                  Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                      color = Color(selectedCategoryObj.accentColor).copy(alpha = 0.14f),
                      shape = RoundedCornerShape(6.dp)
                    ) {
                      Text(
                        text = if (isBangla) selectedCategoryObj.nameBn else selectedCategoryObj.nameEn,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(selectedCategoryObj.accentColor),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                      )
                    }
                    Surface(color = Color(0xFFE2E8F0), shape = RoundedCornerShape(6.dp)) {
                      Text(
                        text = selectedCondition,
                        fontSize = 10.sp,
                        color = Color(0xFF334155),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                      )
                    }
                  }
                  Text(
                    text = title.ifBlank { if (isBangla) "আপনার পণ্যের শিরোনাম এখানে দেখাবে..." else "Your product title will appear here..." },
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = Color(0xFF0F172A)
                  )
                  Text(
                    text = areaDetails.ifBlank { "রংপুর শহর" },
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    maxLines = 1
                  )
                  Text(
                    text = "Tk ${priceText.ifBlank { "0" }}" + if (isNegotiable) (if (isBangla) " (আলোচনা সাপেক্ষ)" else " (Negotiable)") else "",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = Color(0xFF007A64)
                  )
                }
              }
            }
          }
        }
      }
    }

    validationError?.let { err ->
      item {
        Card(
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
          shape = RoundedCornerShape(14.dp),
          modifier = Modifier.fillMaxWidth()
        ) {
          Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = MaterialTheme.colorScheme.error)
            Text(
              text = err,
              color = MaterialTheme.colorScheme.onErrorContainer,
              fontSize = 14.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }
      }
    }

    // Section 1: Photo Upload Studio
    item {
      Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
          .fillMaxWidth()
          .testTag("photo_upload_section_card")
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Icon(
                Icons.Default.PhotoLibrary,
                contentDescription = null,
                tint = Color(0xFF007A64)
              )
              Column {
                Text(
                  text = if (isBangla) "১. পণ্যের ছবি যুক্ত করুন *" else "1. Add Product Photos *",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 17.sp,
                  color = Color(0xFF0F172A)
                )
                Text(
                  text = if (isBangla)
                    "প্রথম ছবিটি মূল কভার হিসেবে প্রদর্শিত হবে (সর্বোচ্চ ৫টি)"
                  else
                    "First photo is used as main cover (Max 5 photos)",
                  fontSize = 12.sp,
                  color = Color(0xFF64748B)
                )
              }
            }

            Surface(
              color = if (uploadedPhotos.isNotEmpty()) Color(0xFF007A64).copy(alpha = 0.12f) else MaterialTheme.colorScheme.errorContainer,
              shape = RoundedCornerShape(50)
            ) {
              Text(
                text = "${uploadedPhotos.size} / 5",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 13.sp,
                color = if (uploadedPhotos.isNotEmpty()) Color(0xFF007A64) else MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier
                  .padding(horizontal = 12.dp, vertical = 5.dp)
                  .testTag("uploaded_photo_counter")
              )
            }
          }

          AnimatedVisibility(visible = photoAddedFeedback != null) {
            photoAddedFeedback?.let { msg ->
              Surface(
                color = Color(0xFF065F46),
                contentColor = Color.White,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(18.dp))
                    Text(msg, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                  }
                  TextButton(onClick = { photoAddedFeedback = null }) {
                    Text("OK", color = Color.White, fontSize = 12.sp)
                  }
                }
              }
            }
          }

          if (uploadedPhotos.isEmpty()) {
            Box(
              modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFFF8FAFC))
                .border(
                  width = 1.5.dp,
                  color = Color(0xFFCBD5E1),
                  shape = RoundedCornerShape(16.dp)
                ),
              contentAlignment = Alignment.Center
            ) {
              Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Icon(
                  Icons.Default.AddPhotoAlternate,
                  contentDescription = null,
                  modifier = Modifier.size(36.dp),
                  tint = Color(0xFF007A64)
                )
                Text(
                  text = if (isBangla) "এখনো কোনো ছবি যোগ করা হয়নি — নিচের বাটনে ট্যাপ করুন" else "No photos yet — tap a button below to add",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = Color(0xFF64748B)
                )
              }
            }
          } else {
            LazyRow(
              horizontalArrangement = Arrangement.spacedBy(12.dp),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("uploaded_photos_row")
            ) {
              itemsIndexed(uploadedPhotos, key = { _, item -> item.id }) { index, photo ->
                Box(
                  modifier = Modifier
                    .width(146.dp)
                    .height(130.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .border(
                      width = if (index == 0) 2.5.dp else 1.dp,
                      color = if (index == 0) Color(0xFF007A64) else Color(0xFFCBD5E1),
                      shape = RoundedCornerShape(16.dp)
                    )
                ) {
                  ProductPhotoView(
                    photo = photo,
                    modifier = Modifier.fillMaxSize(),
                    showCaptionBadge = true,
                    isBangla = isBangla
                  )

                  Surface(
                    color = if (index == 0) Color(0xFF007A64) else Color.Black.copy(alpha = 0.65f),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(50),
                    modifier = Modifier
                      .align(Alignment.TopStart)
                      .padding(6.dp)
                      .clickable {
                        if (index > 0) {
                          val picked = uploadedPhotos.removeAt(index)
                          uploadedPhotos.add(0, picked)
                        }
                      }
                  ) {
                    Text(
                      text = if (index == 0) {
                        if (isBangla) "★ মূল ছবি" else "★ Cover"
                      } else {
                        if (isBangla) "কভার করুন" else "Make Cover"
                      },
                      fontSize = 11.sp,
                      fontWeight = FontWeight.Bold,
                      modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                  }

                  IconButton(
                    onClick = { uploadedPhotos.removeAt(index) },
                    modifier = Modifier
                      .align(Alignment.TopEnd)
                      .padding(4.dp)
                      .size(26.dp)
                      .background(Color(0xFFE11D48), CircleShape)
                      .testTag("remove_photo_btn_$index")
                  ) {
                    Icon(
                      Icons.Default.Close,
                      contentDescription = "Remove Photo",
                      tint = Color.White,
                      modifier = Modifier.size(15.dp)
                    )
                  }
                }
              }
            }
          }

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Button(
              onClick = {
                if (uploadedPhotos.size < 5) {
                  galleryLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                  )
                }
              },
              enabled = uploadedPhotos.size < 5,
              colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("btn_pick_gallery_photo")
            ) {
              Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (isBangla) "গ্যালারি থেকে ছবি" else "From Gallery",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
              )
            }

            FilledTonalButton(
              onClick = {
                if (uploadedPhotos.size < 5) {
                  cameraLauncher.launch(null)
                }
              },
              enabled = uploadedPhotos.size < 5,
              shape = RoundedCornerShape(12.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("btn_take_camera_photo")
            ) {
              Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (isBangla) "ক্যামেরায় তুলুন" else "Use Camera",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          // Studio Presets (1..13 covering all categories)
          Surface(
            color = Color(0xFFF8FAFC),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(
              modifier = Modifier.padding(12.dp),
              verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .clickable { showStudioPicker = !showStudioPicker },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                  Icon(
                    Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = Color(0xFFD97706),
                    modifier = Modifier.size(18.dp)
                  )
                  Text(
                    text = if (isBangla)
                      "রেডি স্টুডিও পণ্যের ছবি ১ ক্লিকে যুক্ত করুন"
                    else
                      "1-Tap Add Studio Product Photos",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                  )
                }
                Icon(
                  imageVector = if (showStudioPicker) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                  contentDescription = null
                )
              }

              AnimatedVisibility(visible = showStudioPicker) {
                LazyRow(
                  horizontalArrangement = Arrangement.spacedBy(10.dp),
                  modifier = Modifier.fillMaxWidth()
                ) {
                  items(STUDIO_PHOTO_PRESETS) { preset ->
                    Card(
                      shape = RoundedCornerShape(12.dp),
                      colors = CardDefaults.cardColors(containerColor = Color.White),
                      modifier = Modifier
                        .width(132.dp)
                        .clickable(enabled = uploadedPhotos.size < 5) {
                          if (uploadedPhotos.size < 5) {
                            uploadedPhotos.add(
                              ProductPhoto(
                                id = "studio_${preset.presetId}_${System.currentTimeMillis()}",
                                studioPresetId = preset.presetId,
                                captionBn = preset.titleBn,
                                captionEn = preset.titleEn
                              )
                            )
                            selectedCategoryId = preset.categoryId
                            photoAddedFeedback = if (isBangla) {
                              "'${preset.titleBn}' ছবিটি যুক্ত করা হয়েছে!"
                            } else {
                              "Added '${preset.titleEn}' photo!"
                            }
                            validationError = null
                          }
                        }
                        .testTag("studio_preset_photo_${preset.presetId}")
                    ) {
                      Column {
                        Box(
                          modifier = Modifier
                            .fillMaxWidth()
                            .height(74.dp)
                        ) {
                          StudioProductArtwork(
                            presetId = preset.presetId,
                            modifier = Modifier.fillMaxSize()
                          )
                          Surface(
                            color = Color(0xFFF59E0B),
                            contentColor = Color(0xFF0F172A),
                            shape = CircleShape,
                            modifier = Modifier
                              .align(Alignment.BottomEnd)
                              .padding(6.dp)
                              .size(22.dp)
                          ) {
                            Box(contentAlignment = Alignment.Center) {
                              Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                            }
                          }
                        }
                        Column(modifier = Modifier.padding(8.dp)) {
                          Text(
                            text = if (isBangla) preset.titleBn else preset.titleEn,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                          )
                          Text(
                            text = if (isBangla) "+ যুক্ত করুন" else "+ Add Photo",
                            fontSize = 11.sp,
                            color = Color(0xFF007A64),
                            fontWeight = FontWeight.SemiBold
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

    // Section 2: Modern Category Cards, Product Info & Price
    item {
      Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          Text(
            text = if (isBangla) "২. ক্যাটাগরি, পণ্যের বিবরণ ও মূল্য (৳)" else "2. Category, Product Details & Price (৳)",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 17.sp,
            color = Color(0xFF0F172A)
          )

          Text(
            text = if (isBangla) "সঠিক ক্যাটাগরি নির্বাচন করুন *" else "Select Product Category *",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF475569)
          )

          // Visual Category Selector Row with Icons (Includes Pets, Clothing, Cosmetics, Food, Others)
          LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
          ) {
            items(BIKROY_CATEGORY_LIST.drop(1)) { catItem ->
              val isSelected = selectedCategoryId == catItem.id
              val catIcon = when (catItem.iconType) {
                "phone" -> Icons.Default.PhoneAndroid
                "laptop" -> Icons.Default.LaptopMac
                "bike" -> Icons.Default.TwoWheeler
                "tv" -> Icons.Default.Tv
                "furniture" -> Icons.Default.Weekend
                "pets" -> Icons.Default.Pets
                "clothing" -> Icons.Default.Checkroom
                "cosmetics" -> Icons.Default.AutoAwesome
                "food" -> Icons.Default.Restaurant
                else -> Icons.Default.Category
              }
              Surface(
                shape = RoundedCornerShape(14.dp),
                color = if (isSelected) Color(catItem.accentColor).copy(alpha = 0.14f) else Color(0xFFF8FAFC),
                border = BorderStroke(
                  width = if (isSelected) 2.dp else 1.dp,
                  color = if (isSelected) Color(catItem.accentColor) else Color(0xFFE2E8F0)
                ),
                modifier = Modifier
                  .clickable { selectedCategoryId = catItem.id }
                  .testTag("post_ad_cat_${catItem.id}")
              ) {
                Row(
                  modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(30.dp)
                      .clip(CircleShape)
                      .background(Color(catItem.accentColor).copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center
                  ) {
                    Icon(
                      imageVector = catIcon,
                      contentDescription = null,
                      tint = Color(catItem.accentColor),
                      modifier = Modifier.size(17.dp)
                    )
                  }
                  Text(
                    text = if (isBangla) catItem.nameBn else catItem.nameEn,
                    fontSize = 13.sp,
                    fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.SemiBold,
                    color = if (isSelected) Color(catItem.accentColor) else Color(0xFF1E293B)
                  )
                }
              }
            }
          }

          OutlinedTextField(
            value = title,
            onValueChange = {
              title = it
              validationError = null
            },
            label = { Text(if (isBangla) "পণ্যের নাম / শিরোনাম *" else "Product Title *", fontSize = 14.sp) },
            placeholder = {
              Text(
                if (isBangla) "যেমন: পার্সিয়ান বিড়াল ছানা / Samsung S22 / প্রিমিয়াম পাঞ্জাবি" else "e.g., Samsung Galaxy A54 / Persian Kitten"
              )
            },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("input_product_title")
          )

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            OutlinedTextField(
              value = priceText,
              onValueChange = { input ->
                priceText = input.filter { it.isDigit() }
                validationError = null
              },
              label = { Text(if (isBangla) "মূল্য (৳ টাকা) *" else "Price (৳ BDT) *", fontSize = 14.sp) },
              placeholder = { Text("2500") },
              leadingIcon = {
                Text("৳", fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = Color(0xFF007A64))
              },
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
              singleLine = true,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("input_product_price")
            )

            Surface(
              color = if (isNegotiable) Color(0xFF007A64).copy(alpha = 0.1f) else Color(0xFFF8FAFC),
              shape = RoundedCornerShape(14.dp),
              border = BorderStroke(1.dp, if (isNegotiable) Color(0xFF007A64) else Color(0xFFE2E8F0)),
              modifier = Modifier.clickable { isNegotiable = !isNegotiable }
            ) {
              Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Checkbox(
                  checked = isNegotiable,
                  onCheckedChange = { isNegotiable = it },
                  modifier = Modifier.size(20.dp)
                )
                Text(
                  text = if (isBangla) "আলোচনা সাপেক্ষ" else "Negotiable",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFF0F172A)
                )
              }
            }
          }

          Text(
            text = if (isBangla) "পণ্যের বর্তমান অবস্থা (Condition)" else "Product Condition",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF475569)
          )
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(conditions) { (bn, en) ->
              FilterChip(
                selected = selectedCondition == bn,
                onClick = { selectedCondition = bn },
                label = { Text(if (isBangla) bn else en, fontSize = 13.sp) },
                shape = RoundedCornerShape(12.dp)
              )
            }
          }

          OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text(if (isBangla) "বিস্তারিত বিবরণ (কেন কিনবে, পণ্যের বৈশিষ্ট্য)" else "Detailed Description", fontSize = 14.sp) },
            minLines = 3,
            maxLines = 5,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("input_product_description")
          )
        }
      }
    }

    // Section 3: Location & Contact
    item {
      Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          Text(
            text = if (isBangla) "৩. রংপুর শহরের এলাকা এবং যোগাযোগ" else "3. Rangpur City Area & Contact",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 17.sp,
            color = Color(0xFF0F172A)
          )

          Text(
            text = if (isBangla) "রংপুর শহরের এলাকা নির্বাচন করুন *" else "Select Rangpur City Area *",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF475569)
          )
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(RANGPUR_CITY_AREAS.drop(1).size) { idx ->
              val areaIdx = idx + 1
              val (bn, en) = RANGPUR_CITY_AREAS[areaIdx]
              FilterChip(
                selected = selectedCityAreaIdx == areaIdx,
                onClick = {
                  selectedCityAreaIdx = areaIdx
                  areaDetails = if (isBangla) "$bn, রংপুর শহর" else "$en, Rangpur City"
                },
                label = { Text(if (isBangla) bn else en, fontSize = 13.sp) },
                leadingIcon = if (selectedCityAreaIdx == areaIdx) {
                  { Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(16.dp)) }
                } else null,
                shape = RoundedCornerShape(12.dp)
              )
            }
          }

          OutlinedTextField(
            value = areaDetails,
            onValueChange = { areaDetails = it },
            label = { Text(if (isBangla) "রংপুর শহরের সুনির্দিষ্ট ঠিকানা / মোড়" else "Exact Street / Landmark in Rangpur City", fontSize = 14.sp) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth()
          )

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
          ) {
            OutlinedTextField(
              value = sellerName,
              onValueChange = { sellerName = it },
              label = { Text(if (isBangla) "বিক্রেতার নাম" else "Seller Name", fontSize = 14.sp) },
              singleLine = true,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier.weight(1f)
            )
            OutlinedTextField(
              value = sellerPhone,
              onValueChange = { sellerPhone = it },
              label = { Text(if (isBangla) "মোবাইল নম্বর *" else "Mobile Number *", fontSize = 14.sp) },
              singleLine = true,
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("input_seller_phone")
            )
          }

          // WhatsApp availability toggle
          Surface(
            color = Color(0xFFF0FDF4),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0xFFBBF7D0)),
            modifier = Modifier
              .fillMaxWidth()
              .clickable { allowWhatsapp = !allowWhatsapp }
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Chat, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                Text(
                  text = if (isBangla) "এই নম্বরে হোয়াটসঅ্যাপ (WhatsApp) এ যোগাযোগ করা যাবে" else "Allow buyers to contact via WhatsApp",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = Color(0xFF166534)
                )
              }
              Switch(checked = allowWhatsapp, onCheckedChange = { allowWhatsapp = it })
            }
          }

          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(top = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            OutlinedButton(
              onClick = onCancel,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .height(50.dp)
            ) {
              Text(if (isBangla) "বাতিল" else "Cancel", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }

            Button(
              onClick = {
                if (uploadedPhotos.isEmpty()) {
                  validationError = if (isBangla) {
                    "অনুগ্রহ করে কমপক্ষে ১টি পণ্যের ছবি যুক্ত করুন।"
                  } else {
                    "Please add at least 1 product photo."
                  }
                  return@Button
                }
                if (title.trim().length < 3) {
                  validationError = if (isBangla) {
                    "অনুগ্রহ করে পণ্যের সঠিক নাম লিখুন।"
                  } else {
                    "Please enter a valid product title."
                  }
                  return@Button
                }
                val parsedPrice = priceText.toIntOrNull() ?: 0
                if (parsedPrice <= 0) {
                  validationError = if (isBangla) {
                    "অনুগ্রহ করে পণ্যের সঠিক মূল্য (৳) লিখুন।"
                  } else {
                    "Please enter a valid price in BDT."
                  }
                  return@Button
                }

                val (areaBn, areaEn) = RANGPUR_CITY_AREAS[selectedCityAreaIdx]
                val newProduct = MarketProduct(
                  id = initialProductToEdit?.id ?: (System.currentTimeMillis() % 100000).toInt(),
                  titleBn = title.trim(),
                  titleEn = title.trim(),
                  priceBdt = parsedPrice,
                  condition = selectedCondition,
                  locationBn = areaDetails.ifBlank { "$areaBn, রংপুর শহর" },
                  locationEn = areaDetails.ifBlank { "$areaEn, Rangpur City" },
                  categoryId = selectedCategoryId,
                  isNegotiable = isNegotiable,
                  phone = sellerPhone.ifBlank { "01711223344" },
                  sellerName = sellerName.ifBlank { "রংপুর শহরের বিক্রেতা" },
                  descriptionBn = description.trim(),
                  descriptionEn = description.trim(),
                  areaIndex = selectedCityAreaIdx,
                  districtBn = areaBn,
                  districtEn = areaEn,
                  photos = uploadedPhotos.toList(),
                  postedAgoBn = "এইমাত্র",
                  postedAgoEn = "Just now",
                  isVerifiedSeller = true,
                  allowWhatsapp = allowWhatsapp,
                  isUserCreated = true,
                  firestoreDocId = initialProductToEdit?.firestoreDocId,
                  ownerUid = initialProductToEdit?.ownerUid?.ifBlank { currentUser?.uid ?: "" }
                    ?: (currentUser?.uid ?: ""),
                  ownerEmail = initialProductToEdit?.ownerEmail?.ifBlank { currentUser?.email ?: "" }
                    ?: (currentUser?.email ?: "")
                )
                onPublishProduct(newProduct)
              },
              colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007A64)),
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(2f)
                .height(50.dp)
                .testTag("submit_post_ad_btn")
            ) {
              Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(20.dp))
              Spacer(modifier = Modifier.width(8.dp))
              Text(
                text = if (initialProductToEdit != null) {
                  if (isBangla) "আপডেট সংরক্ষণ করুন" else "Save Changes"
                } else {
                  if (isBangla) "ছবি সহ বিজ্ঞাপন প্রকাশ করুন" else "Publish Ad Now"
                },
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold
              )
            }
          }
        }
      }
    }
  }
}
