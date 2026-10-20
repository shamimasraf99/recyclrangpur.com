package com.example

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
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
  defaultSellerName: String = "মোঃ রাশেদুল ইসলাম",
  defaultSellerPhone: String = "01711223344",
  onPublishProduct: (MarketProduct) -> Unit,
  onCancel: () -> Unit
) {
  BackHandler { onCancel() }

  var title by remember { mutableStateOf(initialProductToEdit?.titleBn ?: "") }
  var priceText by remember { mutableStateOf(initialProductToEdit?.priceBdt?.toString() ?: "") }
  var selectedCategoryId by remember { mutableStateOf(initialProductToEdit?.categoryId ?: 1) }
  var selectedCondition by remember { mutableStateOf(initialProductToEdit?.condition ?: "যেমন নতুন") }
  var isNegotiable by remember { mutableStateOf(initialProductToEdit?.isNegotiable ?: true) }
  var selectedCityAreaIdx by remember { mutableStateOf(initialProductToEdit?.areaIndex ?: 1) }
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
            studioPresetId = selectedCategoryId.coerceIn(1, 8),
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
          studioPresetId = selectedCategoryId.coerceIn(1, 8),
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
    "ভালো" to "Good",
    "মোটামুটি" to "Fair",
    "রিসাইকেল যোগ্য" to "Recyclable"
  )

  LazyColumn(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .testTag("post_ad_screen"),
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    item {
      Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
          containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
          ) {
            Surface(
              color = MaterialTheme.colorScheme.primary,
              contentColor = Color.White,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier.size(48.dp)
            ) {
              Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Default.AddAPhoto, contentDescription = null, modifier = Modifier.size(26.dp))
              }
            }
            Column {
              Text(
                text = if (initialProductToEdit != null) {
                  if (isBangla) "পণ্যের ছবি ও বিজ্ঞাপন আপডেট করুন" else "Update Product & Photos"
                } else {
                  if (isBangla) "রংপুর শহরে ছবিসহ বিজ্ঞাপন দিন" else "Post Ad with Photos in Rangpur City"
                },
                fontWeight = FontWeight.ExtraBold,
                fontSize = 19.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer
              )
              Text(
                text = if (isBangla)
                  "Recycl Rangpur • গ্যালারি, ক্যামেরা বা স্টুডিও থেকে সর্বোচ্চ ৫টি ছবি দিন"
                else
                  "Recycl Rangpur • Upload up to 5 photos from Gallery, Camera or Studio",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f)
              )
            }
          }

          IconButton(
            onClick = onCancel,
            modifier = Modifier.testTag("close_post_ad_btn")
          ) {
            Icon(Icons.Default.Close, contentDescription = "Close")
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

    item {
      Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
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
                tint = MaterialTheme.colorScheme.primary
              )
              Column {
                Text(
                  text = if (isBangla) "১. পণ্যের ছবি যুক্ত করুন *" else "1. Add Product Photos *",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 18.sp
                )
                Text(
                  text = if (isBangla)
                    "স্পষ্ট ছবি দিলে রংপুর শহরের ক্রেতারা ৩ গুণ দ্রুত যোগাযোগ করেন"
                  else
                    "Clear photos get 3x faster responses from Rangpur City buyers",
                  fontSize = 13.sp,
                  color = MaterialTheme.colorScheme.outline
                )
              }
            }

            Surface(
              color = if (uploadedPhotos.isNotEmpty()) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
              shape = RoundedCornerShape(50)
            ) {
              Text(
                text = "${uploadedPhotos.size} / 5",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 14.sp,
                color = if (uploadedPhotos.isNotEmpty()) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer,
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
                    Text(msg, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                  }
                  TextButton(onClick = { photoAddedFeedback = null }) {
                    Text("OK", color = Color.White, fontSize = 13.sp)
                  }
                }
              }
            }
          }

          if (uploadedPhotos.isEmpty()) {
            Box(
              modifier = Modifier
                .fillMaxWidth()
                .height(125.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                .border(
                  width = 1.5.dp,
                  color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
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
                  modifier = Modifier.size(38.dp),
                  tint = MaterialTheme.colorScheme.primary
                )
                Text(
                  text = if (isBangla) "এখনো কোনো ছবি যোগ করা হয়নি — নিচের বাটনে ট্যাপ করুন" else "No photos yet — tap a button below to add",
                  fontSize = 14.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = MaterialTheme.colorScheme.outline
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
                    .width(150.dp)
                    .height(135.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .border(
                      width = if (index == 0) 2.5.dp else 1.dp,
                      color = if (index == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
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
                    color = if (index == 0) Color(0xFF059669) else Color.Black.copy(alpha = 0.65f),
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
                      .size(28.dp)
                      .background(Color(0xFFE11D48), CircleShape)
                      .testTag("remove_photo_btn_$index")
                  ) {
                    Icon(
                      Icons.Default.Close,
                      contentDescription = "Remove Photo",
                      tint = Color.White,
                      modifier = Modifier.size(16.dp)
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
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("btn_pick_gallery_photo")
            ) {
              Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (isBangla) "গ্যালারি থেকে ছবি" else "From Gallery",
                fontSize = 14.sp,
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
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("btn_take_camera_photo")
            ) {
              Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (isBangla) "ক্যামেরায় তুলুন" else "Use Camera",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          Surface(
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
            shape = RoundedCornerShape(16.dp),
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
                      "রেডি স্টুডিও পণ্যের ছবি ১ ক্লিকে যুক্ত করুন (ট্যাপ করুন)"
                    else
                      "1-Tap Add Studio Product Photos (Tap to select)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
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
                      shape = RoundedCornerShape(14.dp),
                      modifier = Modifier
                        .width(136.dp)
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
                            .height(78.dp)
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
                              .size(24.dp)
                          ) {
                            Box(contentAlignment = Alignment.Center) {
                              Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(15.dp))
                            }
                          }
                        }
                        Column(modifier = Modifier.padding(8.dp)) {
                          Text(
                            text = if (isBangla) preset.titleBn else preset.titleEn,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                          )
                          Text(
                            text = if (isBangla) "+ ছবি যুক্ত করুন" else "+ Add Photo",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary,
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

    item {
      Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          Text(
            text = if (isBangla) "২. পণ্যের বিবরণ ও মূল্য (৳)" else "2. Product Details & Price (৳)",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp
          )

          Text(
            text = if (isBangla) "ক্যাটাগরি নির্বাচন করুন" else "Select Category",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.outline
          )
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(CATEGORIES.drop(1).size) { idx ->
              val catId = idx + 1
              val (bn, en) = CATEGORIES[catId]
              FilterChip(
                selected = selectedCategoryId == catId,
                onClick = { selectedCategoryId = catId },
                label = { Text(if (isBangla) bn else en, fontSize = 14.sp) },
                shape = RoundedCornerShape(12.dp)
              )
            }
          }

          OutlinedTextField(
            value = title,
            onValueChange = {
              title = it
              validationError = null
            },
            label = { Text(if (isBangla) "পণ্যের নাম / শিরোনাম *" else "Product Title *", fontSize = 15.sp) },
            placeholder = {
              Text(
                if (isBangla) "যেমন: Samsung Galaxy A54 5G (বক্স ও চার্জার সহ)" else "e.g., Samsung Galaxy A54 5G with Box"
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
              label = { Text(if (isBangla) "মূল্য (৳ টাকা) *" else "Price (৳ BDT) *", fontSize = 15.sp) },
              placeholder = { Text("18500") },
              leadingIcon = {
                Text("৳", fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = MaterialTheme.colorScheme.primary)
              },
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
              singleLine = true,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("input_product_price")
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
              Text(
                text = if (isBangla) "আলোচনা সাপেক্ষ" else "Negotiable",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
              )
              Switch(
                checked = isNegotiable,
                onCheckedChange = { isNegotiable = it }
              )
            }
          }

          Text(
            text = if (isBangla) "পণ্যের বর্তমান অবস্থা" else "Product Condition",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.outline
          )
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(conditions) { (bn, en) ->
              FilterChip(
                selected = selectedCondition == bn,
                onClick = { selectedCondition = bn },
                label = { Text(if (isBangla) bn else en, fontSize = 14.sp) },
                shape = RoundedCornerShape(12.dp)
              )
            }
          }

          OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text(if (isBangla) "বিস্তারিত বিবরণ" else "Detailed Description", fontSize = 15.sp) },
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

    item {
      Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          Text(
            text = if (isBangla) "৩. রংপুর শহরের এলাকা এবং যোগাযোগ" else "3. Rangpur City Area & Contact",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp
          )

          Text(
            text = if (isBangla) "রংপুর শহরের এলাকা নির্বাচন করুন *" else "Select Rangpur City Area *",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.outline
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
                label = { Text(if (isBangla) bn else en, fontSize = 14.sp) },
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
            label = { Text(if (isBangla) "রংপুর শহরের সুনির্দিষ্ট ঠিকানা / মোড়" else "Exact Street / Landmark in Rangpur City", fontSize = 15.sp) },
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
              label = { Text(if (isBangla) "বিক্রেতার নাম" else "Seller Name", fontSize = 15.sp) },
              singleLine = true,
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier.weight(1f)
            )
            OutlinedTextField(
              value = sellerPhone,
              onValueChange = { sellerPhone = it },
              label = { Text(if (isBangla) "মোবাইল নম্বর *" else "Mobile Number *", fontSize = 15.sp) },
              singleLine = true,
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(1f)
                .testTag("input_seller_phone")
            )
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
              modifier = Modifier.weight(1f)
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
                  allowWhatsapp = true,
                  isUserCreated = true,
                  firestoreDocId = initialProductToEdit?.firestoreDocId
                )
                onPublishProduct(newProduct)
              },
              shape = RoundedCornerShape(14.dp),
              modifier = Modifier
                .weight(2f)
                .testTag("submit_post_ad_btn")
            ) {
              Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(20.dp))
              Spacer(modifier = Modifier.width(8.dp))
              Text(
                text = if (isBangla) "ছবি সহ বিজ্ঞাপন প্রকাশ করুন" else "Publish Ad with Photos",
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
