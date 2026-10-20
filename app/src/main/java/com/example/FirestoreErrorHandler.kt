package com.example

import android.util.Log
import kotlinx.coroutines.CancellationException

enum class OperationType {
  CREATE,
  GET,
  LIST,
  UPDATE,
  DELETE
}

fun handleFirestoreError(
  exception: Exception,
  operationType: OperationType,
  path: String
) {
  if (exception is CancellationException || exception.javaClass.simpleName == "CancellationException") {
    // Normal coroutine cancellation when lifecycle changes or scope ends - not an error
    return
  }
  val diagnostic = """
    {
      "event": "firestore_error",
      "operation": "$operationType",
      "path": "$path",
      "error": "${exception.javaClass.simpleName}",
      "message": "${exception.localizedMessage ?: exception.message ?: "Unknown error"}"
    }
  """.trimIndent()
  Log.e("FirestoreError", diagnostic, exception)
}
