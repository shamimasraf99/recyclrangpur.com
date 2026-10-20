package com.example

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
  data object Loading : UiState<Nothing>
  data class Success<T>(val data: T) : UiState<T>
  data class Error(val message: String) : UiState<Nothing>
}

class RecyclRangpurViewModel(
  private val repository: RecyclRangpurRepository,
  private val currentUserId: String
) : ViewModel() {

  val userListingsState: StateFlow<UiState<List<MarketProduct>>> =
    if (currentUserId.isBlank() || currentUserId == "guest_user") {
      MutableStateFlow(UiState.Success(emptyList()))
    } else {
      repository.observeUserListings(currentUserId)
        .map { list ->
          list.mapIndexed { index, item -> item.toMarketProduct(index + 1) }
        }
        .map<List<MarketProduct>, UiState<List<MarketProduct>>> { UiState.Success(it) }
        .catch { error ->
          if (error is CancellationException) throw error
          Log.w(TAG, "Error observing user listings", error)
          emit(UiState.Error(error.message ?: "Failed to observe listings"))
        }
        .stateIn(
          scope = viewModelScope,
          started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
          initialValue = UiState.Loading
        )
    }

  val savedProductIdsState: StateFlow<UiState<Set<Int>>> =
    if (currentUserId.isBlank() || currentUserId == "guest_user") {
      MutableStateFlow(UiState.Success(emptySet()))
    } else {
      repository.observeSavedItems(currentUserId)
        .map { list -> list.map { it.productId.toInt() }.toSet() }
        .map<Set<Int>, UiState<Set<Int>>> { UiState.Success(it) }
        .catch { error ->
          if (error is CancellationException) throw error
          Log.w(TAG, "Error observing saved items", error)
          emit(UiState.Error(error.message ?: "Failed to observe saved items"))
        }
        .stateIn(
          scope = viewModelScope,
          started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
          initialValue = UiState.Loading
        )
    }

  fun publishOrUpdateProduct(
    product: MarketProduct,
    onResult: (Result<Unit>) -> Unit
  ) {
    viewModelScope.launch {
      val docId = product.firestoreDocId
      val result = if (!docId.isNullOrBlank()) {
        repository.updateListing(docId, product)
      } else {
        repository.createListing(product).map { }
      }
      onResult(result)
    }
  }

  fun deleteProduct(
    product: MarketProduct,
    onResult: (Result<Unit>) -> Unit = {}
  ) {
    viewModelScope.launch {
      val docId = product.firestoreDocId
      val result = if (!docId.isNullOrBlank()) {
        repository.deleteListing(docId)
      } else {
        Result.success(Unit)
      }
      onResult(result)
    }
  }

  fun toggleSavedProduct(product: MarketProduct, isCurrentlySaved: Boolean) {
    if (currentUserId.isBlank() || currentUserId == "guest_user") {
      return
    }
    viewModelScope.launch {
      if (isCurrentlySaved) {
        repository.removeWishlistItem(product.id)
      } else {
        repository.saveWishlistItem(product)
      }
    }
  }

  private companion object {
    const val TAG = "RecyclRangpurVM"
    const val STOP_TIMEOUT_MILLIS = 5000L
  }
}
