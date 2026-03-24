import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  // ── Get Token ─────────────────────────────────
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiConfig.tokenKey);
  }

  // ── Headers ───────────────────────────────────
  static Future<Map<String, String>> _headers({
    bool auth = true,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (auth) {
      final token = await _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // ── GET ───────────────────────────────────────
  static Future<Map<String, dynamic>> get(
    String url, {
    Map<String, dynamic>? params,
  }) async {
    try {
      final uri = Uri.parse(url).replace(
        queryParameters: params?.map(
          (k, v) => MapEntry(k, v.toString()),
        ),
      );
      final response = await http.get(
        uri,
        headers: await _headers(),
      ).timeout(const Duration(seconds: 30));
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  // ── POST ──────────────────────────────────────
  static Future<Map<String, dynamic>> post(
    String url,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: await _headers(auth: auth),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  // ── PUT ───────────────────────────────────────
  static Future<Map<String, dynamic>> put(
    String url,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http.put(
        Uri.parse(url),
        headers: await _headers(),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  // ── PATCH ─────────────────────────────────────
  static Future<Map<String, dynamic>> patch(
    String url,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse(url),
        headers: await _headers(),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  // ── DELETE ────────────────────────────────────
  static Future<Map<String, dynamic>> delete(
    String url,
  ) async {
    try {
      final response = await http.delete(
        Uri.parse(url),
        headers: await _headers(),
      ).timeout(const Duration(seconds: 30));
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  // ── Handle Response ───────────────────────────
  static Map<String, dynamic> _handleResponse(
    http.Response response,
  ) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      return body;
    } else if (response.statusCode == 401) {
      throw ApiException(
        body['message'] ?? 'Unauthorized. Please login again.',
        statusCode: 401,
      );
    } else if (response.statusCode == 404) {
      throw ApiException(
        body['message'] ?? 'Resource not found.',
        statusCode: 404,
      );
    } else {
      throw ApiException(
        body['message'] ?? 'Something went wrong.',
        statusCode: response.statusCode,
      );
    }
  }
}

// ── API Exception ──────────────────────────────
class ApiException implements Exception {
  final String message;
  final int?   statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}