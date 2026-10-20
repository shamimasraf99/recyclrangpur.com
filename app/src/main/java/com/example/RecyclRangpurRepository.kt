package com.example

import android.content.Context
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.util.UUID

@IgnoreExtraProperties
data class FirestoreListing(
  @DocumentId val id: String = "",
  val userId: String = "",
  val titleBn: String = "",
  val titleEn: String = "",
  val priceBdt: Long = 0L,
  val condition: String = "যেমন নতুন",
  val locationBn: String = "জাহাজ কোম্পানি মোড়, রংপুর শহর",
  val locationEn: String = "Jahaj Company More, Rangpur City",
  val districtBn: String = "জাহাজ কোম্পানি মোড়",
  val districtEn: String = "Jahaj Company More",
  val areaIndex: Long = 1L,
  val categoryId: Long = 1L,
  val isNegotiable: Boolean = true,
  val sellerName: String = "",
  val phone: String = "",
  val descriptionBn: String = "",
  val descriptionEn: String = "",
  val photoPresetIds: List<Long> = listOf(1L),
  val photoCaptions: List<String> = listOf("পণ্যের ছবি"),
  val photoUris: List<String> = emptyList(),
  @ServerTimestamp val createdAt: Timestamp? = null,
  @ServerTimestamp val updatedAt: Timestamp? = null
) {
  fun toMarketProduct(numericIdFallback: Int): MarketProduct {
    val presets = if (photoPresetIds.isNotEmpty()) photoPresetIds else listOf(1L)
    val photos = presets.take(5).mapIndexed { index, presetLong ->
      val caption = photoCaptions.getOrNull(index) ?: "পণ্যের ছবি #${index + 1}"
      val uriStr = photoUris.getOrNull(index)?.takeIf { it.isNotBlank() }
      ProductPhoto(
        id = "${id}_photo_$index",
        studioPresetId = presetLong.toInt().coerceIn(1, 8),
        captionBn = caption,
        captionEn = caption,
        uriString = uriStr
      )
    }
    val stableNumericId = id.hashCode().let { if (it < 0) -it else it }.coerceAtLeast(1000) + numericIdFallback
    return MarketProduct(
      id = stableNumericId,
      firestoreDocId = id,
      titleBn = titleBn,
      titleEn = titleEn,
      priceBdt = priceBdt.toInt(),
      condition = condition,
      locationBn = locationBn,
      locationEn = locationEn,
      categoryId = categoryId.toInt().coerceIn(1, 5),
      isNegotiable = isNegotiable,
      phone = phone,
      sellerName = sellerName,
      descriptionBn = descriptionBn,
      descriptionEn = descriptionEn,
      areaIndex = areaIndex.toInt().coerceIn(0, RANGPUR_CITY_AREAS.size - 1),
      districtBn = districtBn,
      districtEn = districtEn,
      photos = photos,
      postedAgoBn = "ক্লাউড সিঙ্কড",
      postedAgoEn = "Cloud Synced",
      isVerifiedSeller = true,
      allowWhatsapp = true,
      isUserCreated = true
    )
  }
}

@IgnoreExtraProperties
data class SavedWishlistItem(
  @DocumentId val id: String = "",
  val userId: String = "",
  val productId: Long = 1L,
  val titleBn: String = "",
  val titleEn: String = "",
  val priceBdt: Long = 0L,
  val districtBn: String = "জাহাজ কোম্পানি মোড়",
  @ServerTimestamp val createdAt: Timestamp? = null,
  @ServerTimestamp val updatedAt: Timestamp? = null
)

class RecyclRangpurRepository(private val db: FirebaseFirestore) {

  constructor(context: Context) : this(
    FirebaseFirestore.getInstance(
      context.applicationContext.getString(R.string.firestore_database_id)
    )
  )

  private val auth: FirebaseAuth
    get() = FirebaseAuth.getInstance()

  private fun requireUserId(): String {
    return auth.currentUser?.uid
      ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")
  }

  fun observeUserListings(userId: String = requireUserId()): Flow<List<FirestoreListing>> = flow {
    if (userId.isBlank() || userId == "guest_user") {
      emit(emptyList())
      return@flow
    }
    val path = "listings"
    emitAll(
      db.collection(path)
        .whereEqualTo("userId", userId)
        .snapshots()
        .map { snapshot ->
          snapshot.documents.mapNotNull { doc ->
            doc.toObject(
              FirestoreListing::class.java,
              DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
            )
          }
        }
        .catch { error ->
          if (error is CancellationException) {
            throw error
          }
          if (error is Exception) {
            handleFirestoreError(error, OperationType.LIST, path)
          }
          throw error
        }
    )
  }

  fun observeSavedItems(userId: String = requireUserId()): Flow<List<SavedWishlistItem>> = flow {
    if (userId.isBlank() || userId == "guest_user") {
      emit(emptyList())
      return@flow
    }
    val path = "saved_items"
    emitAll(
      db.collection(path)
        .whereEqualTo("userId", userId)
        .snapshots()
        .map { snapshot ->
          snapshot.documents.mapNotNull { doc ->
            doc.toObject(
              SavedWishlistItem::class.java,
              DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
            )
          }
        }
        .catch { error ->
          if (error is CancellationException) {
            throw error
          }
          if (error is Exception) {
            handleFirestoreError(error, OperationType.LIST, path)
          }
          throw error
        }
    )
  }

  suspend fun createListing(product: MarketProduct): Result<String> {
    val uid = requireUserId()
    val docId = product.firestoreDocId?.takeIf { it.isNotBlank() }
      ?: "listing_${UUID.randomUUID().toString().replace("-", "").take(16)}"
    val docRef = db.collection("listings").document(docId)

    val presetIds = product.photos.take(5).map { it.studioPresetId.coerceIn(1, 8).toLong() }
      .ifEmpty { listOf(1L) }
    val captions = product.photos.take(5).map { it.captionBn.take(100).ifBlank { "পণ্যের ছবি" } }
      .ifEmpty { listOf("পণ্যের ছবি") }
    val uris = product.photos.take(5).mapNotNull { it.uriString?.take(400) }

    val payload = mapOf(
      "userId" to uid,
      "titleBn" to product.titleBn.trim().take(120).padEnd(3, '.'),
      "titleEn" to product.titleEn.trim().take(120).padEnd(3, '.'),
      "priceBdt" to product.priceBdt.coerceIn(1, 100000000).toLong(),
      "condition" to product.condition.take(40).ifBlank { "ভালো" },
      "locationBn" to product.locationBn.take(120).ifBlank { "জাহাজ কোম্পানি মোড়, রংপুর শহর" },
      "locationEn" to product.locationEn.take(120).ifBlank { "Jahaj Company More, Rangpur City" },
      "districtBn" to product.districtBn.take(80).ifBlank { "জাহাজ কোম্পানি মোড়" },
      "districtEn" to product.districtEn.take(80).ifBlank { "Jahaj Company More" },
      "areaIndex" to product.areaIndex.coerceIn(0, 20).toLong(),
      "categoryId" to product.categoryId.coerceIn(1, 10).toLong(),
      "isNegotiable" to product.isNegotiable,
      "sellerName" to product.sellerName.take(80).ifBlank { "রংপুর শহরের বিক্রেতা" },
      "phone" to product.phone.take(20).ifBlank { "01711223344" },
      "descriptionBn" to product.descriptionBn.take(1000).ifBlank { "রংপুর শহরে ব্যবহৃত পণ্য।" },
      "descriptionEn" to product.descriptionEn.take(1000).ifBlank { "Used item in Rangpur City." },
      "photoPresetIds" to presetIds,
      "photoCaptions" to captions,
      "photoUris" to uris,
      "createdAt" to FieldValue.serverTimestamp(),
      "updatedAt" to FieldValue.serverTimestamp()
    )

    return try {
      docRef.set(payload).await()
      Result.success(docId)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.CREATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun updateListing(docId: String, product: MarketProduct): Result<Unit> {
    requireUserId()
    require(docId.isNotBlank()) { "Document ID must not be blank" }
    val docRef = db.collection("listings").document(docId)

    val presetIds = product.photos.take(5).map { it.studioPresetId.coerceIn(1, 8).toLong() }
      .ifEmpty { listOf(1L) }
    val captions = product.photos.take(5).map { it.captionBn.take(100).ifBlank { "পণ্যের ছবি" } }
      .ifEmpty { listOf("পণ্যের ছবি") }
    val uris = product.photos.take(5).mapNotNull { it.uriString?.take(400) }

    val updates = mapOf(
      "titleBn" to product.titleBn.trim().take(120).padEnd(3, '.'),
      "titleEn" to product.titleEn.trim().take(120).padEnd(3, '.'),
      "priceBdt" to product.priceBdt.coerceIn(1, 100000000).toLong(),
      "condition" to product.condition.take(40).ifBlank { "ভালো" },
      "locationBn" to product.locationBn.take(120).ifBlank { "জাহাজ কোম্পানি মোড়, রংপুর শহর" },
      "locationEn" to product.locationEn.take(120).ifBlank { "Jahaj Company More, Rangpur City" },
      "districtBn" to product.districtBn.take(80).ifBlank { "জাহাজ কোম্পানি মোড়" },
      "districtEn" to product.districtEn.take(80).ifBlank { "Jahaj Company More" },
      "areaIndex" to product.areaIndex.coerceIn(0, 20).toLong(),
      "categoryId" to product.categoryId.coerceIn(1, 10).toLong(),
      "isNegotiable" to product.isNegotiable,
      "sellerName" to product.sellerName.take(80).ifBlank { "রংপুর শহরের বিক্রেতা" },
      "phone" to product.phone.take(20).ifBlank { "01711223344" },
      "descriptionBn" to product.descriptionBn.take(1000).ifBlank { "রংপুর শহরে ব্যবহৃত পণ্য।" },
      "descriptionEn" to product.descriptionEn.take(1000).ifBlank { "Used item in Rangpur City." },
      "photoPresetIds" to presetIds,
      "photoCaptions" to captions,
      "photoUris" to uris,
      "updatedAt" to FieldValue.serverTimestamp()
    )

    return try {
      docRef.update(updates).await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.UPDATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun getListingById(docId: String): Result<FirestoreListing?> {
    val docRef = db.collection("listings").document(docId)
    return try {
      val snapshot = docRef.get().await()
      Result.success(
        snapshot.toObject(
          FirestoreListing::class.java,
          DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
        )
      )
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.GET, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun getUserListings(): Result<List<FirestoreListing>> {
    val uid = requireUserId()
    val path = "listings"
    return try {
      val snapshot = db.collection(path)
        .whereEqualTo("userId", uid)
        .get()
        .await()
      val items = snapshot.documents.mapNotNull { doc ->
        doc.toObject(
          FirestoreListing::class.java,
          DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
        )
      }
      Result.success(items)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.LIST, path)
      Result.failure(e)
    }
  }

  suspend fun deleteListing(docId: String): Result<Unit> {
    requireUserId()
    val docRef = db.collection("listings").document(docId)
    return try {
      docRef.delete().await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.DELETE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun saveWishlistItem(product: MarketProduct): Result<String> {
    val uid = requireUserId()
    val docId = "saved_${uid.take(8)}_${product.id}"
    val docRef = db.collection("saved_items").document(docId)
    val payload = mapOf(
      "userId" to uid,
      "productId" to product.id.coerceAtLeast(1).toLong(),
      "titleBn" to product.titleBn.take(120).ifBlank { "পণ্য" },
      "titleEn" to product.titleEn.take(120).ifBlank { "Product" },
      "priceBdt" to product.priceBdt.coerceIn(0, 100000000).toLong(),
      "districtBn" to product.districtBn.take(80).ifBlank { "জাহাজ কোম্পানি মোড়" },
      "createdAt" to FieldValue.serverTimestamp(),
      "updatedAt" to FieldValue.serverTimestamp()
    )
    return try {
      docRef.set(payload).await()
      Result.success(docId)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.CREATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun removeWishlistItem(productId: Int): Result<Unit> {
    val uid = requireUserId()
    val docId = "saved_${uid.take(8)}_$productId"
    val docRef = db.collection("saved_items").document(docId)
    return try {
      docRef.delete().await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.DELETE, docRef.path)
      Result.failure(e)
    }
  }
}
