import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(_AuthInterceptor(_storage, _dio));
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) {
    return _dio.get(path, queryParameters: queryParams);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  _AuthInterceptor(this._storage, this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        final token = await _storage.read(key: 'access_token');
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $token';
        try {
          final response = await _dio.fetch(opts);
          handler.resolve(response);
          return;
        } catch (_) {}
      }
      await _storage.deleteAll();
    }
    handler.next(err);
  }

  Future<bool> _tryRefresh() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refresh_token': refreshToken},
      );
      final newToken = response.data['access_token'] as String?;
      if (newToken != null) {
        await _storage.write(key: 'access_token', value: newToken);
        return true;
      }
    } catch (_) {}
    return false;
  }
}
