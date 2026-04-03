import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: Clay.bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Clay.primary,
        primary: Clay.primary,
        error: Clay.critical,
        surface: Clay.surface,
      ),
      fontFamily: 'Plus Jakarta Sans',
      appBarTheme: const AppBarTheme(
        backgroundColor: Clay.surface,
        foregroundColor: Clay.text,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Clay.primary,
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
      scaffoldBackgroundColor: Clay.bg,
      colorScheme: ColorScheme.dark(
        primary: Clay.primary,
        surface: Clay.surface,
        error: Clay.critical,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Clay.surface,
        foregroundColor: Clay.text,
        elevation: 1,
      ),
      cardTheme: CardThemeData(
        color: Clay.surface,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: Clay.border, width: 1),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
