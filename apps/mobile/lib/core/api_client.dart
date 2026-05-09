import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  /// Use 10.0.2.2 for Android emulator → localhost, otherwise production URL.
  /// Override via env at build time: --dart-define=API_BASE_URL=...
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kDebugMode
        ? 'http://10.0.2.2:8000/api/v1'
        : 'https://api.weddingos.in/api/v1',
  );

  static final _storage = const FlutterSecureStorage();

  static final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
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
              final newToken = res.data['data']['accessToken'] as String;
              await _storage.write(key: 'access_token', value: newToken);
              error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              return handler.resolve(await dio.fetch(error.requestOptions));
            }
          } catch (e) {
            debugPrint('Token refresh failed: $e');
          }
          // Refresh failed — clear tokens
          await _storage.deleteAll();
        }
        handler.next(error);
      },
    ))
    ..interceptors.add(LogInterceptor(
      requestBody: kDebugMode,
      responseBody: kDebugMode,
      error: true,
      logPrint: (s) => debugPrint('[API] $s'),
    ));

  // ─── Auth ───────────────────────────────────────────────────────────────────
  static Future<Response> sendOtp(String phone) =>
      dio.post('/auth/send-otp', data: {'phone': phone});

  static Future<Response> verifyOtp(String phone, String otp) =>
      dio.post('/auth/verify-otp', data: {'phone': phone, 'otp': otp});

  static Future<Response> getMe() => dio.get('/auth/me');

  static Future<void> registerFcmToken(String token) =>
      dio.post('/users/me/device-token', data: {
        'token': token,
        'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
      });

  // ─── Vendors ────────────────────────────────────────────────────────────────
  static Future<Response> searchVendors(Map<String, dynamic> params) =>
      dio.get('/vendors', queryParameters: params);

  static Future<Response> getVendor(String id) => dio.get('/vendors/$id');

  // ─── Bookings ───────────────────────────────────────────────────────────────
  static Future<Response> getBookings() => dio.get('/bookings');

  static Future<Response> getBooking(String id) => dio.get('/bookings/$id');

  static Future<Response> createEnquiry(Map<String, dynamic> data) =>
      dio.post('/bookings/enquire', data: data);

  // ─── Reviews ────────────────────────────────────────────────────────────────
  static Future<Response> getVendorReviews(String vendorId) =>
      dio.get('/reviews/vendor/$vendorId');

  static Future<Response> submitReview(Map<String, dynamic> data) =>
      dio.post('/reviews', data: data);

  // ─── Notifications ─────────────────────────────────────────────────────────
  static Future<Response> getNotifications() => dio.get('/notifications');

  static Future<Response> markNotificationRead(String id) =>
      dio.patch('/notifications/$id/read');

  static Future<Response> markAllNotificationsRead() =>
      dio.patch('/notifications/read-all');

  // ─── Wishlist ───────────────────────────────────────────────────────────────
  static Future<Response> getWishlist() => dio.get('/users/me/wishlist');

  static Future<Response> addToWishlist(String vendorId) =>
      dio.post('/users/me/wishlist', data: {'vendorId': vendorId});

  static Future<Response> removeFromWishlist(String vendorId) =>
      dio.delete('/users/me/wishlist/$vendorId');

  // ─── Chat ───────────────────────────────────────────────────────────────────
  static Future<Response> getChatHistory(String vendorId) =>
      dio.get('/chat/$vendorId/messages');

  static Future<Response> sendChatMessage(String vendorId, String text) =>
      dio.post('/chat/$vendorId/messages', data: {'text': text});
}
