import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.bgLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.trustBlue,
        primary: AppColors.trustBlue,
        error: AppColors.emergencyRed,
      ),
      fontFamily: 'Arial', // Fallback as specified, Flutter actually defaults to Roboto on Android / SF on iOS.
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textDark,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.trustBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
    );
  }

  static ThemeData get authorityTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.authBg,
      colorScheme: ColorScheme.dark(
        primary: AppColors.trustBlue,
        surface: AppColors.authSurface,
        error: AppColors.emergencyRed,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.authSurface,
        foregroundColor: AppColors.textLight,
        elevation: 1,
      ),
      cardTheme: CardThemeData(
        color: AppColors.authSurface,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.authBorder, width: 1),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
