package com.example

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.security.MessageDigest

data class AuthenticatedUser(
  val uid: String,
  val displayName: String,
  val email: String,
  val photoUrl: String? = null,
  val phone: String? = null,
  val provider: String = "google"
)

/**
 * Local email & password accounts store for Rangpur local users.
 * Uses SHA-256 password hashing and SharedPreferences persistence.
 */
class LocalEmailAccountStore(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences("recycl_email_auth_store", Context.MODE_PRIVATE)

  private fun hashPassword(password: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val bytes = digest.digest(password.toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
  }

  fun registerUser(name: String, email: String, pass: String, phone: String): Result<AuthenticatedUser> {
    val cleanEmail = email.trim().lowercase()
    if (cleanEmail.isBlank() || !cleanEmail.contains("@")) {
      return Result.failure(IllegalArgumentException("সঠিক ইমেইল ঠিকানা দিন (Enter valid email)"))
    }
    if (pass.length < 6) {
      return Result.failure(IllegalArgumentException("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে (Min 6 characters)"))
    }
    val existing = prefs.getString("user_${cleanEmail}_hash", null)
    if (existing != null) {
      return Result.failure(IllegalStateException("এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।"))
    }

    val uid = "local_usr_" + cleanEmail.hashCode().let { if (it < 0) -it else it }
    val hashed = hashPassword(pass)

    prefs.edit()
      .putString("user_${cleanEmail}_hash", hashed)
      .putString("user_${cleanEmail}_name", name.trim().ifBlank { "রংপুরের ব্যবহারকারী" })
      .putString("user_${cleanEmail}_phone", phone.trim().ifBlank { "01711223344" })
      .putString("user_${cleanEmail}_uid", uid)
      .putString("active_session_email", cleanEmail)
      .apply()

    return Result.success(
      AuthenticatedUser(
        uid = uid,
        displayName = name.trim().ifBlank { "রংপুরের ব্যবহারকারী" },
        email = cleanEmail,
        phone = phone.trim().ifBlank { "01711223344" },
        provider = "email"
      )
    )
  }

  fun loginUser(email: String, pass: String): Result<AuthenticatedUser> {
    val cleanEmail = email.trim().lowercase()
    val storedHash = prefs.getString("user_${cleanEmail}_hash", null)
      ?: return Result.failure(IllegalArgumentException("এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সাইন আপ করুন।"))

    if (hashPassword(pass) != storedHash) {
      return Result.failure(IllegalArgumentException("ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।"))
    }

    val name = prefs.getString("user_${cleanEmail}_name", "রংপুরের ব্যবহারকারী") ?: "রংপুরের ব্যবহারকারী"
    val phone = prefs.getString("user_${cleanEmail}_phone", "01711223344")
    val uid = prefs.getString("user_${cleanEmail}_uid", "local_usr_${cleanEmail.hashCode()}") ?: "local_usr_1"

    prefs.edit().putString("active_session_email", cleanEmail).apply()

    return Result.success(
      AuthenticatedUser(
        uid = uid,
        displayName = name,
        email = cleanEmail,
        phone = phone,
        provider = "email"
      )
    )
  }

  fun getActiveSession(): AuthenticatedUser? {
    val activeEmail = prefs.getString("active_session_email", null) ?: return null
    val storedHash = prefs.getString("user_${activeEmail}_hash", null) ?: return null
    if (storedHash.isBlank()) return null
    val name = prefs.getString("user_${activeEmail}_name", "রংপুরের ব্যবহারকারী") ?: "রংপুরের ব্যবহারকারী"
    val phone = prefs.getString("user_${activeEmail}_phone", "01711223344")
    val uid = prefs.getString("user_${activeEmail}_uid", "local_usr_${activeEmail.hashCode()}") ?: "local_usr_1"
    return AuthenticatedUser(
      uid = uid,
      displayName = name,
      email = activeEmail,
      phone = phone,
      provider = "email"
    )
  }

  fun clearSession() {
    prefs.edit().remove("active_session_email").apply()
  }
}

class GoogleAuthManager(
  private val context: Context,
  private val onUserChanged: (AuthenticatedUser?) -> Unit
) {
  private val credentialManager = CredentialManager.create(context)
  private val firebaseAuth = FirebaseAuth.getInstance()
  private val emailAccountStore = LocalEmailAccountStore(context)

  init {
    val currentFirebaseUser = firebaseAuth.currentUser
    if (currentFirebaseUser != null) {
      onUserChanged(
        AuthenticatedUser(
          uid = currentFirebaseUser.uid,
          displayName = currentFirebaseUser.displayName ?: "রংপুর ব্যবহারকারী",
          email = currentFirebaseUser.email ?: "",
          photoUrl = currentFirebaseUser.photoUrl?.toString(),
          provider = "google"
        )
      )
    } else {
      val emailSession = emailAccountStore.getActiveSession()
      onUserChanged(emailSession)
    }
  }

  suspend fun attemptAutoSignIn(activity: Activity) {
    if (firebaseAuth.currentUser != null || emailAccountStore.getActiveSession() != null) return

    val serverClientId = context.getString(R.string.default_web_client_id)
    if (serverClientId.isBlank()) return

    val googleIdOption = GetGoogleIdOption.Builder()
      .setServerClientId(serverClientId)
      .setAutoSelectEnabled(true)
      .build()

    val request = GetCredentialRequest.Builder()
      .addCredentialOption(googleIdOption)
      .build()

    try {
      val result = credentialManager.getCredential(activity, request)
      handleCredentialResponse(result)
    } catch (_: GetCredentialCancellationException) {
      // User dismissed or canceled
    } catch (_: Exception) {
      // Auto sign-in failed silently
    }
  }

  suspend fun signInWithGoogle(activity: Activity): Result<AuthenticatedUser> {
    val serverClientId = context.getString(R.string.default_web_client_id)
    if (serverClientId.isBlank()) {
      return Result.failure(IllegalStateException("Google Client ID not configured"))
    }

    val signInWithGoogleOption = GetSignInWithGoogleOption.Builder(serverClientId)
      .build()

    val request = GetCredentialRequest.Builder()
      .addCredentialOption(signInWithGoogleOption)
      .build()

    return try {
      val result = credentialManager.getCredential(activity, request)
      handleCredentialResponse(result)
    } catch (e: GetCredentialCancellationException) {
      Result.failure(e)
    } catch (e: GetCredentialException) {
      Result.failure(e)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      Log.e("GoogleAuthManager", "Google Sign-In failed", e)
      Result.failure(e)
    }
  }

  private suspend fun handleCredentialResponse(response: GetCredentialResponse): Result<AuthenticatedUser> {
    val credential = response.credential
    if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
      val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
      val idToken = googleIdTokenCredential.idToken
      val firebaseCredential = GoogleAuthProvider.getCredential(idToken, null)
      val authResult = firebaseAuth.signInWithCredential(firebaseCredential).await()
      val user = authResult.user
      if (user != null) {
        val authenticatedUser = AuthenticatedUser(
          uid = user.uid,
          displayName = user.displayName ?: googleIdTokenCredential.displayName ?: "রংপুর ব্যবহারকারী",
          email = user.email ?: googleIdTokenCredential.id,
          photoUrl = user.photoUrl?.toString() ?: googleIdTokenCredential.profilePictureUri?.toString(),
          provider = "google"
        )
        emailAccountStore.clearSession()
        onUserChanged(authenticatedUser)
        return Result.success(authenticatedUser)
      }
    }
    return Result.failure(IllegalStateException("Unknown credential type returned"))
  }

  fun loginWithEmail(email: String, pass: String): Result<AuthenticatedUser> {
    val result = emailAccountStore.loginUser(email, pass)
    if (result.isSuccess) {
      firebaseAuth.signOut()
      onUserChanged(result.getOrNull())
    }
    return result
  }

  fun registerWithEmail(name: String, email: String, pass: String, phone: String): Result<AuthenticatedUser> {
    val result = emailAccountStore.registerUser(name, email, pass, phone)
    if (result.isSuccess) {
      firebaseAuth.signOut()
      onUserChanged(result.getOrNull())
    }
    return result
  }

  fun signOut() {
    try {
      firebaseAuth.signOut()
    } catch (_: Exception) {}
    emailAccountStore.clearSession()
    onUserChanged(null)
  }
}

/**
 * Animated preloader shown during app initialization.
 */
@Composable
fun RecyclRangpurPreloader(
  modifier: Modifier = Modifier,
  isBangla: Boolean = true
) {
  val infiniteTransition = rememberInfiniteTransition(label = "preloader_spin")
  val rotation by infiniteTransition.animateFloat(
    initialValue = 0f,
    targetValue = 360f,
    animationSpec = infiniteRepeatable(
      animation = tween(1800, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "rotation"
  )

  val pulse by infiniteTransition.animateFloat(
    initialValue = 0.92f,
    targetValue = 1.08f,
    animationSpec = infiniteRepeatable(
      animation = tween(900, easing = FastOutSlowInEasing),
      repeatMode = RepeatMode.Reverse
    ),
    label = "pulse"
  )

  Box(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.surface)
      .testTag("app_startup_preloader"),
    contentAlignment = Alignment.Center
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
      modifier = Modifier.padding(32.dp)
    ) {
      // Spinning recycling badge
      Box(
        modifier = Modifier
          .size(90.dp)
          .rotate(rotation),
        contentAlignment = Alignment.Center
      ) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .border(
              width = 4.dp,
              brush = Brush.sweepGradient(
                listOf(
                  MaterialTheme.colorScheme.primary,
                  MaterialTheme.colorScheme.tertiary,
                  Color(0xFF16A34A),
                  MaterialTheme.colorScheme.primary
                )
              ),
              shape = CircleShape
            )
        )
        Icon(
          imageVector = Icons.Default.Autorenew,
          contentDescription = null,
          tint = MaterialTheme.colorScheme.primary,
          modifier = Modifier.size(46.dp)
        )
      }

      Spacer(modifier = Modifier.height(28.dp))

      // Brand Title with enlarged styling
      Text(
        text = "Recycl Rangpur",
        style = MaterialTheme.typography.headlineMedium.copy(
          fontWeight = FontWeight.ExtraBold,
          fontSize = 28.sp
        ),
        color = MaterialTheme.colorScheme.primary
      )

      Text(
        text = if (isBangla) "রিসাইকেল রংপুর • ব্যবহৃত পণ্যের নির্ভরযোগ্য হাট" else "Recycl Rangpur • Trusted Marketplace",
        style = MaterialTheme.typography.titleMedium.copy(
          fontWeight = FontWeight.SemiBold,
          fontSize = 16.sp
        ),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = 8.dp)
      )

      Spacer(modifier = Modifier.height(32.dp))

      // Elegant Progress Indicator
      LinearProgressIndicator(
        modifier = Modifier
          .width(180.dp)
          .height(6.dp)
          .clip(RoundedCornerShape(3.dp)),
        color = MaterialTheme.colorScheme.primary,
        trackColor = MaterialTheme.colorScheme.primaryContainer
      )

      Text(
        text = if (isBangla) "রংপুর শহরের বিজ্ঞাপনগুলো লোড হচ্ছে..." else "Loading Rangpur listings...",
        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
        color = MaterialTheme.colorScheme.outline,
        modifier = Modifier.padding(top = 12.dp)
      )
    }
  }
}

/**
 * Auth modal allowing users to log in or sign up via Google or Email & Password.
 */
@Composable
fun RecyclRangpurAuthModal(
  isOpen: Boolean,
  isBangla: Boolean,
  authManager: GoogleAuthManager,
  titleText: String = if (isBangla) "লগইন করুন" else "Sign In",
  subtitleText: String = if (isBangla) "বিজ্ঞাপন দিতে আপনার অ্যাকাউন্টে প্রবেশ করুন" else "Sign in to post and manage your ads",
  onSuccess: (AuthenticatedUser) -> Unit,
  onDismiss: () -> Unit
) {
  if (!isOpen) return

  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()

  var isSignUpMode by remember { mutableStateOf(false) }

  var emailInput by remember { mutableStateOf("") }
  var passwordInput by remember { mutableStateOf("") }
  var nameInput by remember { mutableStateOf("") }
  var phoneInput by remember { mutableStateOf("") }
  var passwordVisible by remember { mutableStateOf(false) }

  var isLoading by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      modifier = Modifier
        .widthIn(max = 420.dp)
        .fillMaxWidth(0.92f)
        .wrapContentHeight()
        .shadow(8.dp, RoundedCornerShape(22.dp))
        .clip(RoundedCornerShape(22.dp))
        .testTag("recycl_auth_modal"),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        // Top row: App title + close button
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Box(
              modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.Autorenew,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
              )
            }
            Text(
              text = if (isSignUpMode) {
                if (isBangla) "নতুন অ্যাকাউন্ট তৈরি" else "Create Account"
              } else {
                if (isBangla) "স্বাগতম - লগইন" else "Sign In"
              },
              style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
              )
            )
          }

          IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
            Icon(Icons.Default.Close, contentDescription = "বন্ধ করুন")
          }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 1. Google One-Tap Sign In Button
        OutlinedButton(
          onClick = {
            val act = context as? Activity ?: return@OutlinedButton
            isLoading = true
            errorMessage = null
            coroutineScope.launch {
              val res = authManager.signInWithGoogle(act)
              isLoading = false
              if (res.isSuccess) {
                onSuccess(res.getOrThrow())
                onDismiss()
              } else {
                errorMessage = res.exceptionOrNull()?.localizedMessage ?: "Google Sign-In ব্যর্থ হয়েছে"
              }
            }
          },
          enabled = !isLoading,
          modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .testTag("google_signin_button"),
          shape = RoundedCornerShape(12.dp)
        ) {
          if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
          } else {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Icon(
                imageVector = Icons.Default.AccountCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
              )
              Text(
                text = if (isBangla) "Google দিয়ে চালিয়ে যান" else "Continue with Google",
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
              )
            }
          }
        }

        // 2. Minimal Divider "অথবা"
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 14.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outlineVariant)
          Text(
            text = if (isBangla) "অথবা ইমেইল দিয়ে" else "or with email",
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 12.sp),
            color = MaterialTheme.colorScheme.outline,
            modifier = Modifier.padding(horizontal = 10.dp)
          )
          HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outlineVariant)
        }

        // 3. Email & Password Form Fields
        AnimatedVisibility(visible = isSignUpMode) {
          Column(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
              value = nameInput,
              onValueChange = { nameInput = it },
              label = { Text(if (isBangla) "নাম" else "Full Name", fontSize = 13.sp) },
              modifier = Modifier
                .fillMaxWidth()
                .testTag("auth_name_input"),
              shape = RoundedCornerShape(10.dp),
              singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
              value = phoneInput,
              onValueChange = { phoneInput = it },
              label = { Text(if (isBangla) "মোবাইল নম্বর" else "Phone Number", fontSize = 13.sp) },
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("auth_phone_input"),
              shape = RoundedCornerShape(10.dp),
              singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))
          }
        }

        OutlinedTextField(
          value = emailInput,
          onValueChange = { emailInput = it },
          label = { Text(if (isBangla) "ইমেইল ঠিকানা" else "Email Address", fontSize = 13.sp) },
          keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
          modifier = Modifier
            .fillMaxWidth()
            .testTag("auth_email_input"),
          shape = RoundedCornerShape(10.dp),
          singleLine = true
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
          value = passwordInput,
          onValueChange = { passwordInput = it },
          label = { Text(if (isBangla) "পাসওয়ার্ড" else "Password", fontSize = 13.sp) },
          trailingIcon = {
            IconButton(onClick = { passwordVisible = !passwordVisible }) {
              Icon(
                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                contentDescription = null
              )
            }
          },
          visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
          keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
          modifier = Modifier
            .fillMaxWidth()
            .testTag("auth_password_input"),
          shape = RoundedCornerShape(10.dp),
          singleLine = true
        )

        errorMessage?.let { err ->
          Text(
            text = err,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            modifier = Modifier.padding(top = 8.dp)
          )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 4. Primary Submit Button
        Button(
          onClick = {
            errorMessage = null
            isLoading = true
            if (isSignUpMode) {
              val res = authManager.registerWithEmail(nameInput, emailInput, passwordInput, phoneInput)
              isLoading = false
              if (res.isSuccess) {
                onSuccess(res.getOrThrow())
                onDismiss()
              } else {
                errorMessage = res.exceptionOrNull()?.localizedMessage ?: "সাইন আপ ব্যর্থ হয়েছে"
              }
            } else {
              val res = authManager.loginWithEmail(emailInput, passwordInput)
              isLoading = false
              if (res.isSuccess) {
                onSuccess(res.getOrThrow())
                onDismiss()
              } else {
                errorMessage = res.exceptionOrNull()?.localizedMessage ?: "লগইন ব্যর্থ হয়েছে"
              }
            }
          },
          enabled = !isLoading && emailInput.isNotBlank() && passwordInput.isNotBlank(),
          modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .testTag("email_auth_submit_button"),
          shape = RoundedCornerShape(12.dp),
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
          if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
          } else {
            Text(
              text = if (isSignUpMode) {
                if (isBangla) "অ্যাকাউন্ট তৈরি করুন" else "Create Account"
              } else {
                if (isBangla) "লগইন করুন" else "Sign In"
              },
              fontWeight = FontWeight.Bold,
              fontSize = 15.sp
            )
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // 5. Toggle Login / Sign Up
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.Center
        ) {
          Text(
            text = if (isSignUpMode) {
              if (isBangla) "আগে থেকেই অ্যাকাউন্ট আছে? " else "Already have an account? "
            } else {
              if (isBangla) "নতুন ব্যবহারকারী? " else "Don't have an account? "
            },
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
          Text(
            text = if (isSignUpMode) {
              if (isBangla) "লগইন করুন" else "Sign In"
            } else {
              if (isBangla) "সাইন আপ" else "Sign Up"
            },
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier
              .clickable {
                isSignUpMode = !isSignUpMode
                errorMessage = null
              }
              .padding(4.dp)
          )
        }

        // 6. Guest Option
        TextButton(
          onClick = onDismiss,
          modifier = Modifier.testTag("dismiss_auth_modal_button")
        ) {
          Text(
            text = if (isBangla) "গেস্ট হিসেবে দেখুন" else "Continue as Guest",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.outline
          )
        }
      }
    }
  }
}
