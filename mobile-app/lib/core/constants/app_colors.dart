import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary palette
  static const Color primary = Color(0xFF1e3a8a);
  static const Color primaryLight = Color(0xFF2d4fad);
  static const Color primaryDark = Color(0xFF142b6d);
  static const Color secondary = Color(0xFF3b82f6);
  static const Color accent = Color(0xFF0ea5e9);

  // Neutral
  static const Color white = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color grey100 = Color(0xFFF1F5F9);
  static const Color grey200 = Color(0xFFE2E8F0);
  static const Color grey400 = Color(0xFF94A3B8);
  static const Color grey600 = Color(0xFF475569);
  static const Color grey800 = Color(0xFF1E293B);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textHint = Color(0xFF94A3B8);

  // Status colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Appointment status
  static const Color statusScheduled = Color(0xFF3B82F6);
  static const Color statusConfirmed = Color(0xFF10B981);
  static const Color statusCompleted = Color(0xFF6B7280);
  static const Color statusCancelled = Color(0xFFEF4444);
  static const Color statusNoShow = Color(0xFFF59E0B);

  // Invoice status
  static const Color invoicePaid = Color(0xFF10B981);
  static const Color invoicePending = Color(0xFFF59E0B);
  static const Color invoiceOverdue = Color(0xFFEF4444);
}
