import 'package:flutter/foundation.dart';

import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  Map<String, dynamic>? _user;
  bool _isLoggedIn = false;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get user => _user;
  bool get isLoggedIn => _isLoggedIn;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get userName => _user?['name'] as String? ?? 'User';

  Future<void> loadUser() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final loggedIn = await _authService.isLoggedIn();
      if (loggedIn) {
        final profile = await _authService.getProfile();
        _user = profile['user'] as Map<String, dynamic>? ?? profile;
        _isLoggedIn = true;
      } else {
        _isLoggedIn = false;
      }
    } catch (_) {
      _isLoggedIn = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _authService.login(email, password);
      _user = data['user'] as Map<String, dynamic>? ?? {};
      _isLoggedIn = true;
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _authService.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
      );
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
