package com.example

import android.graphics.Bitmap

const val ADMIN_EMAIL = "mdshamimasraf1998@gmail.com"

val CATEGORIES = listOf(
  "সব ক্যাটাগরি" to "All Categories",
  "স্মার্টফোন ও গ্যাজেট" to "Smartphones & Gadgets",
  "ল্যাপটপ ও কম্পিউটার" to "Laptops & Computers",
  "মোটরসাইকেল ও বাইক" to "Motorcycles & Bikes",
  "টিভি ও হোম অ্যাপ্লায়েন্স" to "TVs & Home Appliances",
  "আসবাবপত্র" to "Furniture & Living",
  "প্রাণী ও পেটস" to "Pets & Animals",
  "পোশাক ও ফ্যাশন" to "Clothing & Fashion",
  "কসমেটিকস ও বিউটি" to "Cosmetics & Beauty",
  "খাদ্য ও খাবার" to "Food & Grocery",
  "অন্যান্য" to "Others"
)

data class BikroyCategoryItem(
  val id: Int,
  val nameBn: String,
  val nameEn: String,
  val iconType: String,
  val accentColor: Long
)

val BIKROY_CATEGORY_LIST = listOf(
  BikroyCategoryItem(0, "সব ক্যাটাগরি", "All Items", "all", 0xFF007A64),
  BikroyCategoryItem(1, "মোবাইল ও ফোন", "Phones", "phone", 0xFF2563EB),
  BikroyCategoryItem(2, "কম্পিউটার", "Computers", "laptop", 0xFF7C3AED),
  BikroyCategoryItem(3, "বাইক ও মোটর", "Bikes", "bike", 0xFFEA580C),
  BikroyCategoryItem(4, "টিভি ও হোম", "Appliances", "tv", 0xFFDC2626),
  BikroyCategoryItem(5, "আসবাবপত্র", "Furniture", "furniture", 0xFF059669),
  BikroyCategoryItem(6, "প্রাণী ও পেটস", "Pets", "pets", 0xFFD97706),
  BikroyCategoryItem(7, "পোশাক", "Clothing", "clothing", 0xFFDB2777),
  BikroyCategoryItem(8, "কসমেটিকস", "Cosmetics", "cosmetics", 0xFF9333EA),
  BikroyCategoryItem(9, "খাদ্য", "Food", "food", 0xFF16A34A),
  BikroyCategoryItem(10, "অন্যান্য", "Others", "others", 0xFF475569)
)

// Exclusively Rangpur City (রংপুর সিটি কর্পোরেশন এলাকা)
val RANGPUR_CITY_AREAS = listOf(
  "পুরো রংপুর শহর" to "All Rangpur City",
  "জাহাজ কোম্পানি মোড়" to "Jahaj Company More",
  "ধাপ মেডিকেল মোড়" to "Dhap Medical More",
  "শাপলা চত্বর" to "Shapla Chattar",
  "লালবাগ ও পার্ক মোড়" to "Lalbag & Park More",
  "কাচারী বাজার" to "Kachari Bazar",
  "মডার্ন মোড়" to "Modern More",
  "জিলা স্কুল মোড়" to "Zilla School More",
  "প্রেসক্লাব ও পায়রা চত্বর" to "Press Club & Payra Chattar"
)

data class ProductPhoto(
  val id: String,
  val studioPresetId: Int = 1,
  val captionBn: String = "পণ্যের ছবি",
  val captionEn: String = "Product Photo",
  val uriString: String? = null,
  val bitmap: Bitmap? = null
)

data class StudioPresetPhoto(
  val presetId: Int,
  val titleBn: String,
  val titleEn: String,
  val categoryId: Int
)

val STUDIO_PHOTO_PRESETS = listOf(
  StudioPresetPhoto(1, "স্মার্টফোন ফ্রন্ট ভিউ", "Smartphone Front", 1),
  StudioPresetPhoto(2, "ল্যাপটপ কিবোর্ড ভিউ", "Laptop Keyboard", 2),
  StudioPresetPhoto(3, "বাইক সাইড প্রোফাইল", "Bike Side View", 3),
  StudioPresetPhoto(4, "স্মার্ট টিভি ৪কে ডিসপ্লে", "Smart TV 4K", 4),
  StudioPresetPhoto(5, "সেগুন কাঠের সোফা", "Teak Sofa", 5),
  StudioPresetPhoto(6, "ডিএসএলআর ক্যামেরা বডি", "DSLR Camera", 1),
  StudioPresetPhoto(7, "গিয়ার বাইসাইকেল", "Gear Bicycle", 3),
  StudioPresetPhoto(8, "আইপিএস ও সোলার প্যানেল", "IPS & Solar", 4),
  StudioPresetPhoto(9, "পোষা প্রাণী ও বিড়াল", "Pet & Kitten", 6),
  StudioPresetPhoto(10, "পোশাক ও ফ্যাশন ওয়্যার", "Fashion & Apparel", 7),
  StudioPresetPhoto(11, "কসমেটিকস ও বিউটি কিট", "Cosmetics & Skincare", 8),
  StudioPresetPhoto(12, "খাঁটি খাবার ও ফলমূল", "Organic Food", 9),
  StudioPresetPhoto(13, "অন্যান্য প্রয়োজনীয় পণ্য", "General Item", 10)
)

data class MarketProduct(
  val id: Int,
  val titleBn: String,
  val titleEn: String,
  val priceBdt: Int,
  val condition: String,
  val locationBn: String,
  val locationEn: String,
  val categoryId: Int,
  val isNegotiable: Boolean,
  val phone: String,
  val sellerName: String,
  val descriptionBn: String,
  val descriptionEn: String,
  val areaIndex: Int,
  val districtBn: String,
  val districtEn: String,
  val photos: List<ProductPhoto>,
  val postedAgoBn: String = "১ দিন আগে",
  val postedAgoEn: String = "1 day ago",
  val isVerifiedSeller: Boolean = true,
  val allowWhatsapp: Boolean = true,
  val moderationStatus: String = "approved",
  val isUserCreated: Boolean = false,
  val firestoreDocId: String? = null,
  val isFeatured: Boolean = true,
  val sellerRating: Double = 4.9,
  val sellerReviewCount: Int = 28,
  val sellerBadgeBn: String = "যাচাইকৃত স্থানীয় বিক্রেতা",
  val sellerBadgeEn: String = "Verified Rangpur Seller",
  val featuredHighlightBn: String = "রংপুর শহরে দ্রুত ডেলিভারি বা সরাসরি দেখার সুযোগ",
  val featuredHighlightEn: String = "Direct inspection available in Rangpur City",
  val ownerUid: String = "",
  val ownerEmail: String = ""
)

/**
 * Checks whether [user] is allowed to edit or delete [product].
 * Only the original creator of the listing or the platform Admin can edit/delete.
 */
fun canUserModifyProduct(product: MarketProduct, user: AuthenticatedUser?): Boolean {
  if (user == null) return false
  if (user.email.equals(ADMIN_EMAIL, ignoreCase = true)) return true
  if (product.ownerUid.isNotBlank() && product.ownerUid == user.uid) return true
  if (product.ownerEmail.isNotBlank() && product.ownerEmail.equals(user.email, ignoreCase = true)) return true
  return false
}

val SAMPLE_PRODUCTS = listOf(
  MarketProduct(
    id = 1,
    titleBn = "Samsung Galaxy S22 Ultra 5G (12/256GB)",
    titleEn = "Samsung Galaxy S22 Ultra 5G (12/256GB)",
    priceBdt = 58500,
    condition = "যেমন নতুন",
    locationBn = "জাহাজ কোম্পানি মোড়, রংপুর শহর",
    locationEn = "Jahaj Company More, Rangpur City",
    categoryId = 1,
    isNegotiable = true,
    phone = "01712345678",
    sellerName = "মোঃ আরিফুল ইসলাম",
    descriptionBn = "অফিসিয়াল সেট, কোনো ধরনের স্ক্র্যাচ বা দাগ নেই। সাথে অরিজিনাল ৪৫ ওয়াট ফাস্ট চার্জার এবং ক্যাশ মেমো পাবেন। জাহাজ কোম্পানি মোড়ে আমার দোকানে সরাসরি এসে দেখে নিতে পারেন।",
    descriptionEn = "Official flagship phone, zero scratches or dents. Original 45W charger and box included. Direct inspection at Jahaj Company More, Rangpur City.",
    areaIndex = 1,
    districtBn = "জাহাজ কোম্পানি মোড়",
    districtEn = "Jahaj Company More",
    photos = listOf(
      ProductPhoto("p1_1", studioPresetId = 1, captionBn = "সামনের ডিসপ্লে ভিউ", captionEn = "Front Display View"),
      ProductPhoto("p1_2", studioPresetId = 6, captionBn = "১০০x ক্যামেরা মডিউল", captionEn = "100x Camera Module"),
      ProductPhoto("p1_3", studioPresetId = 1, captionBn = "এস-পেন ও বক্স সহ", captionEn = "With S-Pen & Box")
    ),
    postedAgoBn = "১ ঘণ্টা আগে",
    postedAgoEn = "1 hour ago",
    isFeatured = true,
    sellerRating = 4.9,
    sellerReviewCount = 42,
    sellerBadgeBn = "টপ রেটেড গ্যাজেট ডিলার",
    sellerBadgeEn = "Top-Rated Gadget Dealer",
    featuredHighlightBn = "জাহাজ কোম্পানি মোড়ে দোকানে সরাসরি ট্রায়াল",
    ownerUid = "seller_ariful_1",
    ownerEmail = "ariful.rangpur@example.com"
  ),
  MarketProduct(
    id = 2,
    titleBn = "Yamaha FZS V3 Deluxe (ম্যাট ব্ল্যাক কালার)",
    titleEn = "Yamaha FZS V3 Deluxe (Matte Black)",
    priceBdt = 195000,
    condition = "খুব ভালো",
    locationBn = "ধাপ মেডিকেল মোড়, রংপুর শহর",
    locationEn = "Dhap Medical More, Rangpur City",
    categoryId = 3,
    isNegotiable = true,
    phone = "01819876543",
    sellerName = "ডাঃ কামরুল হাসান",
    descriptionBn = "ব্যক্তিগত ব্যবহারের বাইক, মোট ১৫,২০০ কিমি চলেছে। ডিজিটাল নাম্বার প্লেট, স্মার্ট কার্ড ও ট্যাক্স টোকেন ২০২৬ পর্যন্ত আপ-টু-ডেট। ধাপ মেডিকেলের কোয়ার্টারে দেখে টেস্ট রাইড নিতে পারেন।",
    descriptionEn = "Personal use, 15,200 km run. Digital number plate, smart card & tax token valid till 2026. Test ride available at Dhap Medical More.",
    areaIndex = 2,
    districtBn = "ধাপ মেডিকেল মোড়",
    districtEn = "Dhap Medical More",
    photos = listOf(
      ProductPhoto("p2_1", studioPresetId = 3, captionBn = "বাইকের ডানদিকের ফুল ভিউ", captionEn = "Right Side Full View"),
      ProductPhoto("p2_2", studioPresetId = 3, captionBn = "ডিজিটাল মিটার ও হ্যান্ডেলবার", captionEn = "Digital Meter Console"),
      ProductPhoto("p2_3", studioPresetId = 3, captionBn = "ইঞ্জিন ও এবিএস ব্রেক", captionEn = "Engine & Dual ABS")
    ),
    postedAgoBn = "৩ ঘণ্টা আগে",
    postedAgoEn = "3 hours ago",
    isFeatured = true,
    sellerRating = 5.0,
    sellerReviewCount = 31,
    sellerBadgeBn = "যাচাইকৃত ১ম মালিক",
    sellerBadgeEn = "Verified 1st Owner",
    featuredHighlightBn = "ধাপ মেডিকেলে সরাসরি টেস্ট রাইড সুবিধা",
    ownerUid = "seller_kamrul_2",
    ownerEmail = "kamrul.rangpur@example.com"
  ),
  MarketProduct(
    id = 3,
    titleBn = "Dell XPS 13 9310 Intel Core i7 11th Gen",
    titleEn = "Dell XPS 13 9310 Intel Core i7 11th Gen",
    priceBdt = 68000,
    condition = "যেমন নতুন",
    locationBn = "লালবাগ ও পার্ক মোড়, রংপুর শহর",
    locationEn = "Lalbag & Park More, Rangpur City",
    categoryId = 2,
    isNegotiable = false,
    phone = "01911223344",
    sellerName = "তানভীর আহমেদ",
    descriptionBn = "১৬ জিবি র্যাম, ৫১২ জিবি এনভিএমই এসএসডি, ৪কে টাচস্ক্রিন ইনফিনিটিএজ ডিসপ্লে। ব্যাকলাইট কিবোর্ড ও ব্যাটারি ব্যাকআপ ৫+ ঘণ্টা। সাথে অরিজিনাল ডেল টাইপ-সি অ্যাডাপ্টার।",
    descriptionEn = "16GB RAM, 512GB NVMe SSD, 4K Touch display. 5+ hours battery. Original Dell Type-C 65W charger included.",
    areaIndex = 4,
    districtBn = "লালবাগ ও পার্ক মোড়",
    districtEn = "Lalbag & Park More",
    photos = listOf(
      ProductPhoto("p3_1", studioPresetId = 2, captionBn = "ডেল ল্যাপটপ ওপেন স্ক্রিন", captionEn = "Dell Open Screen View"),
      ProductPhoto("p3_2", studioPresetId = 2, captionBn = "প্রিমিয়াম কার্বন ফাইবার পামরেস্ট", captionEn = "Carbon Fiber Palmrest")
    ),
    postedAgoBn = "৫ ঘণ্টা আগে",
    postedAgoEn = "5 hours ago",
    isFeatured = true,
    sellerRating = 4.9,
    sellerReviewCount = 27,
    sellerBadgeBn = "আইটি প্রফেশনাল বিক্রেতা",
    sellerBadgeEn = "IT Professional Seller",
    featuredHighlightBn = "লালবাগে বসে সরাসরি টেস্ট করে নেওয়ার সুযোগ",
    ownerUid = "seller_tanvir_3",
    ownerEmail = "tanvir.rangpur@example.com"
  ),
  MarketProduct(
    id = 4,
    titleBn = "Sony Bravia 55 Inch 4K Ultra HD Smart Google TV",
    titleEn = "Sony Bravia 55 Inch 4K Ultra HD Smart Google TV",
    priceBdt = 48000,
    condition = "খুব ভালো",
    locationBn = "কাচারী বাজার, রংপুর শহর",
    locationEn = "Kachari Bazar, Rangpur City",
    categoryId = 4,
    isNegotiable = true,
    phone = "01511223344",
    sellerName = "রফিকুল ইসলাম চৌধুরী",
    descriptionBn = "বাসার লিভিং রুমে ব্যবহৃত সনি ব্র্যাভিয়া অরিজিনাল প্যানেল। ডলবি ভিশন এবং নেটফ্লিক্স, ইউটিউব ৪কে সরাসরি চলে। কাচারী বাজারে এসে চালিয়ে দেখে নিতে পারবেন।",
    descriptionEn = "Living room Sony Bravia TV. Dolby Vision, 4K HDR, Google TV with voice remote. Direct inspection at Kachari Bazar, Rangpur City.",
    areaIndex = 5,
    districtBn = "কাচারী বাজার",
    districtEn = "Kachari Bazar",
    photos = listOf(
      ProductPhoto("p4_1", studioPresetId = 4, captionBn = "৫৫ ইঞ্চি ক্রিস্টাল ক্লিয়ার স্ক্রিন", captionEn = "55 Inch Crystal Clear"),
      ProductPhoto("p4_2", studioPresetId = 4, captionBn = "ভয়েস রিমোট ও ওয়াল মাউন্ট", captionEn = "Voice Remote & Wall Mount")
    ),
    postedAgoBn = "১ দিন আগে",
    postedAgoEn = "1 day ago",
    isFeatured = true,
    sellerRating = 4.8,
    sellerReviewCount = 19,
    sellerBadgeBn = "যাচাইকৃত গৃহস্থালী বিক্রেতা",
    sellerBadgeEn = "Verified Household Seller",
    featuredHighlightBn = "কাচারী বাজারে সরাসরি ছবি ও সাউন্ড টেস্ট",
    ownerUid = "seller_rafiq_4",
    ownerEmail = "rafiq.rangpur@example.com"
  ),
  MarketProduct(
    id = 5,
    titleBn = "খাঁটি চিটাগাং সেগুন কাঠের ডাইনিং টেবিল (৬ চেয়ার সহ)",
    titleEn = "Pure Chittagong Teak Wood Dining Table (6 Chairs)",
    priceBdt = 36000,
    condition = "ভালো",
    locationBn = "শাপলা চত্বর, রংপুর শহর",
    locationEn = "Shapla Chattar, Rangpur City",
    categoryId = 5,
    isNegotiable = true,
    phone = "01611223344",
    sellerName = "মোঃ মহিউদ্দিন",
    descriptionBn = "১০০% অরিজিনাল চিটাগাং সেগুন কাঠের তৈরি মজবুত ৬ সিটের ডাইনিং টেবিল সাথে ১০ মিমি বেলজিয়াম গ্লাস টপ। শাপলা চত্বরে আমার বাসায় এসে দেখে নিতে পারবেন।",
    descriptionEn = "100% genuine Chittagong Teak wood 6-seater dining table with 10mm glass top. Inspect at Shapla Chattar, Rangpur City.",
    areaIndex = 3,
    districtBn = "শাপলা চত্বর",
    districtEn = "Shapla Chattar",
    photos = listOf(
      ProductPhoto("p5_1", studioPresetId = 5, captionBn = "সেগুন কাঠের পুরো ডাইনিং সেট", captionEn = "Full Teak Dining Set"),
      ProductPhoto("p5_2", studioPresetId = 5, captionBn = "হাতে খোদাই করা চেয়ারের কারুকাজ", captionEn = "Carved Chair Detailing")
    ),
    postedAgoBn = "২ দিন আগে",
    postedAgoEn = "2 days ago",
    isFeatured = false,
    sellerRating = 4.8,
    sellerReviewCount = 14,
    sellerBadgeBn = "স্থানীয় গৃহস্থালী বিক্রেতা",
    sellerBadgeEn = "Local Home Seller",
    featuredHighlightBn = "শাপলা চত্বরে সরাসরি দেখার সুযোগ",
    ownerUid = "seller_mohiuddin_5",
    ownerEmail = "mohiuddin.rangpur@example.com"
  ),
  MarketProduct(
    id = 7,
    titleBn = "সাদা পার্সিয়ান বিড়াল ছানা জোড়া (টিকা দেওয়া)",
    titleEn = "White Persian Kitten Pair (Vaccinated)",
    priceBdt = 8500,
    condition = "সুস্থ ও চঞ্চল",
    locationBn = "ধাপ মেডিকেল মোড়, রংপুর শহর",
    locationEn = "Dhap Medical More, Rangpur City",
    categoryId = 6,
    isNegotiable = true,
    phone = "01755443322",
    sellerName = "নুসরাত জাহান",
    descriptionBn = "৩ মাস বয়সী ট্রিপল কোট সাদা পার্সিয়ান বিড়াল ছানা। সম্পূর্ণ লিটার ট্রেইনড এবং প্রাথমিক ভ্যাকসিন দেওয়া হয়েছে। ধাপ এলাকায় বাসায় এসে দেখে নিতে পারবেন।",
    descriptionEn = "3-month-old triple coat white Persian kittens. Fully litter trained and vaccinated. Visit Dhap Medical More to adopt.",
    areaIndex = 2,
    districtBn = "ধাপ মেডিকেল মোড়",
    districtEn = "Dhap Medical More",
    photos = listOf(
      ProductPhoto("p7_1", studioPresetId = 9, captionBn = "পার্সিয়ান বিড়াল ছানা", captionEn = "Persian Kitten")
    ),
    postedAgoBn = "৪ ঘণ্টা আগে",
    postedAgoEn = "4 hours ago",
    isFeatured = true,
    sellerRating = 5.0,
    sellerReviewCount = 18,
    sellerBadgeBn = "ভেরিফায়েড পেট লাভার",
    sellerBadgeEn = "Verified Pet Lover",
    featuredHighlightBn = "সম্পূর্ণ সুস্থ ও লিটার ট্রেইনড পেট",
    ownerUid = "seller_nusrat_7",
    ownerEmail = "nusrat.rangpur@example.com"
  ),
  MarketProduct(
    id = 8,
    titleBn = "রেমন্ড প্রিমিয়াম মেনজ ব্লেজার ও এমব্রয়ডারি পাঞ্জাবি কম্বো",
    titleEn = "Raymond Premium Men's Blazer & Designer Panjabi Combo",
    priceBdt = 3200,
    condition = "যেমন নতুন",
    locationBn = "জাহাজ কোম্পানি মোড়, রংপুর শহর",
    locationEn = "Jahaj Company More, Rangpur City",
    categoryId = 7,
    isNegotiable = true,
    phone = "01788990011",
    sellerName = "ইমরান হোসেন",
    descriptionBn = "মাত্র ১ বার একটি বিয়ের অনুষ্ঠানে পরা হয়েছে। সাইজ ৪২ (Large), সম্পূর্ণ ড্রাই ওয়াশ করা এবং নতুন কভার সহ আছে।",
    descriptionEn = "Worn only once at a wedding event. Size 42 (Large), dry-cleaned and packed with cover.",
    areaIndex = 1,
    districtBn = "জাহাজ কোম্পানি মোড়",
    districtEn = "Jahaj Company More",
    photos = listOf(
      ProductPhoto("p8_1", studioPresetId = 10, captionBn = "প্রিমিয়াম নেভি ব্লু ব্লেজার", captionEn = "Premium Navy Blazer")
    ),
    postedAgoBn = "৬ ঘণ্টা আগে",
    postedAgoEn = "6 hours ago",
    isFeatured = false,
    sellerRating = 4.7,
    sellerReviewCount = 11,
    sellerBadgeBn = "ফ্যাশন সেলার",
    sellerBadgeEn = "Fashion Seller",
    ownerUid = "seller_imran_8",
    ownerEmail = "imran.rangpur@example.com"
  ),
  MarketProduct(
    id = 9,
    titleBn = "অরিজিনাল কোরিয়ান স্কিনকেয়ার ও মেকআপ গিফট বক্স (ইনট্যাক্ট)",
    titleEn = "Authentic Korean Skincare & Makeup Gift Box (Intact)",
    priceBdt = 2400,
    condition = "নতুন (ইনট্যাক্ট)",
    locationBn = "শাপলা চত্বর, রংপুর শহর",
    locationEn = "Shapla Chattar, Rangpur City",
    categoryId = 8,
    isNegotiable = false,
    phone = "01833445566",
    sellerName = "তাসনুভা রহমান",
    descriptionBn = "বিদেশ থেকে আনা ১০০% অরিজিনাল বারকোড সহ কোরিয়ান সিরাম, সানস্ক্রিন এবং লিপ টিন্ট সেট। মেয়াদ ২০২৭ সাল পর্যন্ত।",
    descriptionEn = "100% authentic imported Korean serum, sunscreen, and lip tint kit with barcode verification. Expiry 2027.",
    areaIndex = 3,
    districtBn = "শাপলা চত্বর",
    districtEn = "Shapla Chattar",
    photos = listOf(
      ProductPhoto("p9_1", studioPresetId = 11, captionBn = "কোরিয়ান স্কিনকেয়ার বক্স", captionEn = "Korean Skincare Kit")
    ),
    postedAgoBn = "১ দিন আগে",
    postedAgoEn = "1 day ago",
    isFeatured = false,
    sellerRating = 4.9,
    sellerReviewCount = 22,
    sellerBadgeBn = "বিউটি ও কসমেটিকস সেলার",
    sellerBadgeEn = "Beauty & Cosmetics Seller",
    ownerUid = "seller_tasnuva_9",
    ownerEmail = "tasnuva.rangpur@example.com"
  ),
  MarketProduct(
    id = 10,
    titleBn = "রংপুরের খাঁটি গাওয়া ঘি (১ কেজি) ও অর্গানিক মধু",
    titleEn = "Pure RangpurHomemade Ghee (1 KG) & Organic Honey",
    priceBdt = 1450,
    condition = "১০০% খাঁটি ও ফ্রেশ",
    locationBn = "কাচারী বাজার, রংপুর শহর",
    locationEn = "Kachari Bazar, Rangpur City",
    categoryId = 9,
    isNegotiable = false,
    phone = "01766554433",
    sellerName = "হাজী আব্দুল করিম",
    descriptionBn = "নিজস্ব খামারের গরুর দুধের তৈরি ১০০% খাঁটি দানাদার গাওয়া ঘি এবং প্রাকৃতিক চাকের মধু। রংপুর শহরে হোম ডেলিভারি বা সরাসরি কাচারী বাজারে এসে স্বাদ দেখে নিন।",
    descriptionEn = "100% pure homemade granular cow ghee and natural honey from our own farm in Rangpur.",
    areaIndex = 5,
    districtBn = "কাচারী বাজার",
    districtEn = "Kachari Bazar",
    photos = listOf(
      ProductPhoto("p10_1", studioPresetId = 12, captionBn = "খাঁটি গাওয়া ঘি ও মধু জার", captionEn = "Pure Ghee & Honey Jar")
    ),
    postedAgoBn = "৫ ঘণ্টা আগে",
    postedAgoEn = "5 hours ago",
    isFeatured = true,
    sellerRating = 5.0,
    sellerReviewCount = 39,
    sellerBadgeBn = "অর্গানিক ফুড সাপ্লায়ার",
    sellerBadgeEn = "Organic Food Supplier",
    ownerUid = "seller_karim_10",
    ownerEmail = "karim.rangpur@example.com"
  ),
  MarketProduct(
    id = 11,
    titleBn = "অটোমেটিক ফোল্ডেবল ট্রেডমিল ও হোম ফিটনেস সেট",
    titleEn = "Automatic Foldable Treadmill & Home Fitness Set",
    priceBdt = 22500,
    condition = "খুব ভালো",
    locationBn = "মডার্ন মোড়, রংপুর শহর",
    locationEn = "Modern More, Rangpur City",
    categoryId = 10,
    isNegotiable = true,
    phone = "01722334455",
    sellerName = "সোহেল রানা",
    descriptionBn = "বাসায় শরীরচর্চার জন্য কেনা ফোল্ডেবল ডিজিটাল ট্রেডমিল। এলইডি ডিসপ্লে, হার্ট রেট সেন্সর ও স্পিকার আছে। মডার্ন মোড়ে এসে চালিয়ে দেখে নিতে পারেন।",
    descriptionEn = "Foldable digital home treadmill with LED display, heart-rate sensor, and speaker. Inspect at Modern More, Rangpur.",
    areaIndex = 6,
    districtBn = "মডার্ন মোড়",
    districtEn = "Modern More",
    photos = listOf(
      ProductPhoto("p11_1", studioPresetId = 13, captionBn = "ডিজিটাল ফোল্ডেবল ট্রেডমিল", captionEn = "Digital Foldable Treadmill")
    ),
    postedAgoBn = "২ দিন আগে",
    postedAgoEn = "2 days ago",
    isFeatured = false,
    sellerRating = 4.8,
    sellerReviewCount = 15,
    sellerBadgeBn = "যাচাইকৃত বিক্রেতা",
    sellerBadgeEn = "Verified Seller",
    ownerUid = "seller_sohel_11",
    ownerEmail = "sohel.rangpur@example.com"
  )
)
