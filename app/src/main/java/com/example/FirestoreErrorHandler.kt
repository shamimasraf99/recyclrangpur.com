package com.example

import android.util.Log

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
