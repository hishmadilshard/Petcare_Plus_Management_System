// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';

class AppTheme {
  // ── Colors ──────────────────────────────────────
  static const Color navy900  = Color(0xFF0D1526);
  static const Color navy800  = Color(0xFF112240);
  static const Color navy700  = Color(0xFF1A2957);
  static const Color navy600  = Color(0xFF1E3A8A);
  static const Color navy500  = Color(0xFF1D4ED8);
  static const Color navy400  = Color(0xFF3B82F6);
  static const Color navy300  = Color(0xFF93C5FD);
  static const Color navy200  = Color(0xFFBFDBFE);
  static const Color navy100  = Color(0xFFDBEAFE);
  static const Color navy50   = Color(0xFFEFF6FF);

  static const Color white    = Color(0xFFFFFFFF);
  static const Color gray50   = Color(0xFFF8FAFC);
  static const Color gray100  = Color(0xFFF1F5F9);
  static const Color gray200  = Color(0xFFE2E8F0);
  static const Color gray300  = Color(0xFFCBD5E1);
  static const Color gray400  = Color(0xFF94A3B8);
  static const Color gray500  = Color(0xFF64748B);
  static const Color gray600  = Color(0xFF475569);
  static const Color gray700  = Color(0xFF334155);
  static const Color gray800  = Color(0xFF1E293B);

  static const Color success  = Color(0xFF10B981);
  static const Color warning  = Color(0xFFF59E0B);
  static const Color danger   = Color(0xFFEF4444);
  static const Color info     = Color(0xFF06B6D4);

  // ── Font ────────────────────────────────────────
  static const String fontFamily = 'TimesNewRoman';

  // ── Theme ───────────────────────────────────────
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    fontFamily: fontFamily,
    colorScheme: ColorScheme.fromSeed(
      seedColor: navy700,
      primary:   navy700,
      secondary: navy500,
      surface:   white,
      background: gray50,
      error:     danger,
    ),
    scaffoldBackgroundColor: gray50,

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: navy800,
      foregroundColor: white,
      elevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: fontFamily,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: white,
        fontStyle: FontStyle.italic,
      ),
      iconTheme: IconThemeData(color: white),
    ),

    // ElevatedButton
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: navy700,
        foregroundColor: white,
        padding: const EdgeInsets.symmetric(
          horizontal: 24, vertical: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontFamily: fontFamily,
          fontSize: 15,
          fontWeight: FontWeight.w700,
          fontStyle: FontStyle.italic,
        ),
        elevation: 2,
      ),
    ),

    // OutlinedButton
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: navy700,
        side: const BorderSide(color: navy200, width: 1.5),
        padding: const EdgeInsets.symmetric(
          horizontal: 24, vertical: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontFamily: fontFamily,
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // TextButton
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: navy600,
        textStyle: const TextStyle(
          fontFamily: fontFamily,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    // InputDecoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: white,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16, vertical: 14,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: gray200, width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: gray200, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: navy500, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: danger, width: 1.5),
      ),
      labelStyle: const TextStyle(
        fontFamily: fontFamily,
        color: gray500,
        fontSize: 14,
      ),
      hintStyle: const TextStyle(
        fontFamily: fontFamily,
        color: gray400,
        fontSize: 14,
        fontStyle: FontStyle.italic,
      ),
    ),

    // Card
   // ✅ NEW — fixed
  cardTheme: CardThemeData(
  color: white,
  elevation: 2,
  shadowColor: navy900.withOpacity(0.08),
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(16),
  ),
),

    // BottomNavigation
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: white,
      selectedItemColor: navy700,
      unselectedItemColor: gray400,
      selectedLabelStyle: TextStyle(
        fontFamily: fontFamily,
        fontSize: 11,
        fontWeight: FontWeight.w700,
      ),
      unselectedLabelStyle: TextStyle(
        fontFamily: fontFamily,
        fontSize: 11,
      ),
      elevation: 12,
      type: BottomNavigationBarType.fixed,
    ),

    // Text
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: 32, fontWeight: FontWeight.w700,
        color: navy900, fontStyle: FontStyle.italic,
      ),
      displayMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: 26, fontWeight: FontWeight.w700,
        color: navy900,
      ),
      headlineLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: 22, fontWeight: FontWeight.w700,
        color: navy900, fontStyle: FontStyle.italic,
      ),
      headlineMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: 18, fontWeight: FontWeight.w700,
        color: navy900,
      ),
      headlineSmall: TextStyle(
        fontFamily: fontFamily,
        fontSize: 16, fontWeight: FontWeight.w700,
        color: navy900,
      ),
      titleLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: 15, fontWeight: FontWeight.w700,
        color: navy800,
      ),
      bodyLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: 15, color: gray700,
      ),
      bodyMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: 13, color: gray600,
      ),
      bodySmall: TextStyle(
        fontFamily: fontFamily,
        fontSize: 12, color: gray500,
      ),
      labelLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: 13, fontWeight: FontWeight.w700,
        color: navy700,
      ),
    ),
  );
}