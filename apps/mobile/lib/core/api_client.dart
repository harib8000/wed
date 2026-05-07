import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'https://api.weddingos.com/api/v1';
  static final _storage = const FlutterSecureStorage();

  static final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ))
    ..interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Attempt token refresh
          try {
            final refreshToken = await _storage.read(key: 'refresh_token');
            if (refreshToken != null) {
              final res = await Dio().post(
                '$baseUrl/auth/refresh',
                data: {'refreshToken': refreshToken},
              );
              final newToken = res.data['data']['accessToken'];
              await _storage.write(key: 'access_token', value: newToken);
              error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              return handler.resolve(await dio.fetch(error.requestOptions));
            }
          } catch (_) {}
          // Refresh failed — clear tokens
          await _storage.deleteAll();
        }
        handler.next(error);
      },
    ));

  // Auth
  static Future<Response> sendOtp(String phone) =>
      dio.post('/auth/send-otp', data: {'phone': phone});

  static Future<Response> verifyOtp(String phone, String otp) =>
      dio.post('/auth/verify-otp', data: {'phone': phone, 'otp': otp});

  static Future<Response> getMe() => dio.get('/auth/me');

  // Vendors
  static Future<Response> searchVendors(Map<String, dynamic> params) =>
      dio.get('/vendors', queryParameters: params);

  static Future<Response> getVendor(String id) => dio.get('/vendors/$id');

  // Bookings
  static Future<Response> getBookings() => dio.get('/bookings');

  static Future<Response> createEnquiry(Map<String, dynamic> data) =>
      dio.post('/bookings/enquire', data: data);
}
