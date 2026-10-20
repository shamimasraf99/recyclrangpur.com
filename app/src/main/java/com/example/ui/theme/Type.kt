package com.example.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.R

val PoppinsFontFamily = FontFamily(
  Font(R.font.poppins, FontWeight.Normal),
  Font(R.font.poppins, FontWeight.Medium),
  Font(R.font.poppins, FontWeight.SemiBold),
  Font(R.font.poppins, FontWeight.Bold),
  Font(R.font.poppins, FontWeight.ExtraBold)
)

val HindSiliguriFontFamily = FontFamily(
  Font(R.font.hind_siliguri, FontWeight.Normal),
  Font(R.font.hind_siliguri, FontWeight.Medium),
  Font(R.font.hind_siliguri, FontWeight.SemiBold),
  Font(R.font.hind_siliguri, FontWeight.Bold)
)

val Typography = Typography(
  displayLarge = TextStyle(
    fontFamily = PoppinsFontFamily,
    fontWeight = FontWeight.ExtraBold,
    fontSize = 36.sp,
    lineHeight = 44.sp,
    letterSpacing = (-0.5).sp
  ),
  headlineLarge = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Bold,
    fontSize = 28.sp,
    lineHeight = 36.sp
  ),
  headlineMedium = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Bold,
    fontSize = 24.sp,
    lineHeight = 32.sp
  ),
  titleLarge = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Bold,
    fontSize = 22.sp,
    lineHeight = 29.sp
  ),
  titleMedium = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 19.sp,
    lineHeight = 26.sp
  ),
  bodyLarge = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Normal,
    fontSize = 18.sp,
    lineHeight = 26.sp,
    letterSpacing = 0.2.sp
  ),
  bodyMedium = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Normal,
    fontSize = 16.sp,
    lineHeight = 23.sp
  ),
  labelLarge = TextStyle(
    fontFamily = PoppinsFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 15.sp,
    lineHeight = 21.sp
  ),
  labelSmall = TextStyle(
    fontFamily = HindSiliguriFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 13.sp,
    lineHeight = 18.sp
  )
)
