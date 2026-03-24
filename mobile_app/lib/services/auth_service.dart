import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  // ── Login ──────────────────────────────────────
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await ApiService.post(
      ApiConfig.login,
      {'email': email, 'password': password},
      auth: false,
    );
    if (res['success'] == true) {
      final token = res['data']['token'] as String;
      final user  = res['data']['user']
          as Map<String, dynamic>;
      await _saveSession(token, user);
    }
    return res;
  }

  // ── Logout ─────────────────────────────────────
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConfig.tokenKey);
    await prefs.remove(ApiConfig.userKey);
  }

  // ── Save Session ───────────────────────────────
  static Future<void> _saveSession(
    String token,
    Map<String, dynamic> user,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.tokenKey, token);
    await prefs.setString(
      ApiConfig.userKey, jsonEncode(user),
    );
  }

  // ── Get Saved User ─────────────────────────────
  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(ApiConfig.userKey);
    if (userStr == null) return null;
    try {
      return UserModel.fromJson(
        jsonDecode(userStr) as Map<String, dynamic>,
      );
    } catch (_) {
      return null;
    }
  }

  // ── Is Logged In ───────────────────────────────
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(ApiConfig.tokenKey);
  }

  // ── Get Profile ────────────────────────────────
  static Future<UserModel> getProfile() async {
    final res = await ApiService.get(ApiConfig.profile);
    return UserModel.fromJson(
      res['data'] as Map<String, dynamic>,
    );
  }

  // ── Change Password ────────────────────────────
  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await ApiService.put(
      ApiConfig.changePassword,
      {
        'current_password': currentPassword,
        'new_password':     newPassword,
      },
    );
  }

  // ── Forgot Password ────────────────────────────
  static Future<Map<String, dynamic>> forgotPassword(
    String email,
  ) async {
    return ApiService.post(
      ApiConfig.forgotPassword,
      {'email': email},
      auth: false,
    );
  }

  // ── Reset Password ─────────────────────────────
  static Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    await ApiService.post(
      ApiConfig.resetPassword,
      {
        'email':        email,
        'otp':          otp,
        'new_password': newPassword,
      },
      auth: false,
    );
  }
}