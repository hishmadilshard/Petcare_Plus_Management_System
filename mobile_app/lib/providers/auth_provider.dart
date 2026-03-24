import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool       _loading = false;
  String?    _error;

  UserModel? get user    => _user;
  bool       get loading => _loading;
  String?    get error   => _error;
  bool       get isLoggedIn => _user != null;

  // ── Init — check saved session ─────────────────
  Future<bool> init() async {
    final loggedIn = await AuthService.isLoggedIn();
    if (loggedIn) {
      _user = await AuthService.getSavedUser();
      notifyListeners();
    }
    return loggedIn;
  }

  // ── Login ──────────────────────────────────────
  Future<bool> login(String email, String password) async {
    _loading = true;
    _error   = null;
    notifyListeners();
    try {
      final res = await AuthService.login(
        email: email, password: password,
      );
      if (res['success'] == true) {
        _user = UserModel.fromJson(
          res['data']['user'] as Map<String, dynamic>,
        );
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error   = res['message'] ?? 'Login failed.';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error   = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // ── Logout ─────────────────────────────────────
  Future<void> logout() async {
    await AuthService.logout();
    _user  = null;
    _error = null;
    notifyListeners();
  }

  // ── Refresh Profile ────────────────────────────
  Future<void> refreshProfile() async {
    try {
      _user = await AuthService.getProfile();
      notifyListeners();
    } catch (_) {}
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}