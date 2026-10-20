package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
  primary = Emerald80,
  onPrimary = Color(0xFF022C22),
  primaryContainer = Color(0xFF064E3B),
  onPrimaryContainer = Color(0xFFD1FAE5),
  secondary = Amber80,
  onSecondary = Color(0xFF451A03),
  secondaryContainer = Color(0xFF78350F),
  onSecondaryContainer = Color(0xFFFEF3C7),
  tertiary = Color(0xFF38BDF8),
  background = SlateBackground,
  onBackground = Color(0xFFF1F5F9),
  surface = SlateSurface,
  onSurface = Color(0xFFF8FAFC),
  surfaceVariant = SlateCard,
  onSurfaceVariant = Color(0xFFCBD5E1),
  outline = Color(0xFF64748B)
)

private val LightColorScheme = lightColorScheme(
  primary = Emerald40,
  onPrimary = Color.White,
  primaryContainer = Color(0xFFD1FAE5),
  onPrimaryContainer = Color(0xFF064E3B),
  secondary = Amber40,
  onSecondary = Color.White,
  secondaryContainer = Color(0xFFFEF3C7),
  onSecondaryContainer = Color(0xFF78350F),
  tertiary = Color(0xFF0284C7),
  background = WarmSurfaceBackground,
  onBackground = Color(0xFF0F172A),
  surface = PureCardSurface,
  onSurface = Color(0xFF0F172A),
  surfaceVariant = Color(0xFFE2E8F0),
  onSurfaceVariant = Color(0xFF334155),
  outline = Color(0xFF64748B)
)

@Composable
fun RecyclRangpurTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content
  )
}

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  RecyclRangpurTheme(darkTheme, dynamicColor, content)
}
