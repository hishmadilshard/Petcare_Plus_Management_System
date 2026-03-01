import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    final data = response.data as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>?;
    if (user != null && user['role'] != 'Owner') {
      throw Exception('Access denied. This app is for pet owners only.');
    }
    final accessToken = data['access_token'] as String?;
    final refreshToken = data['refresh_token'] as String?;
    if (accessToken != null) {
      await _storage.write(key: 'access_token', value: accessToken);
    }
    if (refreshToken != null) {
      await _storage.write(key: 'refresh_token', value: refreshToken);
    }
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final response = await _api.post(
      ApiConstants.register,
      data: {'name': name, 'email': email, 'phone': phone, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiConstants.logout);
    } catch (_) {}
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _api.get(ApiConstants.profile);
    return response.data as Map<String, dynamic>;
  }

  Future<String?> refreshToken() async {
    final token = await _storage.read(key: 'refresh_token');
    if (token == null) return null;
    final response = await _api.post(
      ApiConstants.refreshToken,
      data: {'refresh_token': token},
    );
    final newToken = (response.data as Map<String, dynamic>)['access_token']
        as String?;
    if (newToken != null) {
      await _storage.write(key: 'access_token', value: newToken);
    }
    return newToken;
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }
}
