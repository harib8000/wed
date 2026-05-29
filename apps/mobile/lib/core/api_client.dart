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
      dio.post('/users/me/push-token', data: {
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

  // ─── Media ──────────────────────────────────────────────────────────────────

  /// Step 1: Get a presigned S3 upload URL.
  /// [context] is a hint like 'profile', 'portfolio', 'review', 'kyc'.
  static Future<Response> getPresignedUploadUrl({
    String contentType = 'image/jpeg',
    String context = 'profile',
  }) =>
      dio.post('/media/presign', data: {'contentType': contentType, 'context': context});

  /// Step 2: Upload a file directly to S3 using the presigned URL.
  /// Returns the raw Dio response from the S3 PUT request.
  static Future<Response> uploadToS3(String presignedUrl, List<int> fileBytes, String contentType) {
    final s3Dio = Dio();
    return s3Dio.put(
      presignedUrl,
      data: Stream.fromIterable(fileBytes.map((b) => [b])),
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBytes.length,
        },
        sendTimeout: const Duration(seconds: 120),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );
  }

  // ─── Checklist ──────────────────────────────────────────────────────────────

  static Future<Response> getChecklist() => dio.get('/users/me/checklist');

  static Future<Response> createChecklistItem(Map<String, dynamic> data) =>
      dio.post('/users/me/checklist', data: data);

  static Future<Response> updateChecklistItem(String id, Map<String, dynamic> data) =>
      dio.patch('/users/me/checklist/$id', data: data);

  // ─── Vendor Dashboard ───────────────────────────────────────────────────────

  static Future<Response> getVendorDashboard() =>
      dio.get('/bookings/vendor/dashboard');

  static Future<Response> getVendorPaymentStats() =>
      dio.get('/payments/vendor/stats');

  static Future<Response> getVendorBookings({String? status}) =>
      dio.get('/bookings', queryParameters: status != null ? {'status': status} : null);

  // ─── Coordinator ─────────────────────────────────────────────────────────────

  static Future<Response> getCoordinatorEvents() =>
      dio.get('/bookings/coordinator/events');

  static Future<Response> getEventTimeline(String eventId) =>
      dio.get('/timelines/$eventId');

  static Future<Response> createTimelineItem(String eventId, Map<String, dynamic> data) =>
      dio.post('/timelines/$eventId', data: data);

  static Future<Response> updateTimelineItem(
          String eventId, String itemId, Map<String, dynamic> data) =>
      dio.patch('/timelines/$eventId/items/$itemId', data: data);

  static Future<Response> deleteTimelineItem(String eventId, String itemId) =>
      dio.delete('/timelines/$eventId/items/$itemId');

  static Future<Response> getEventTasks(String eventId) =>
      dio.get('/timelines/$eventId/tasks');

  static Future<Response> createTask(String eventId, Map<String, dynamic> data) =>
      dio.post('/timelines/$eventId/tasks', data: data);

  static Future<Response> updateTask(
          String eventId, String taskId, Map<String, dynamic> data) =>
      dio.patch('/timelines/$eventId/tasks/$taskId', data: data);

  static Future<Response> getCoordinatorVendors() =>
      dio.get('/vendors/coordinator/linked');

  // ─── Admin ────────────────────────────────────────────────────────────────────

  static Future<Response> getAdminStats() => dio.get('/admin/stats');

  static Future<Response> getAdminActivityFeed() => dio.get('/admin/activity');

  static Future<Response> getAllUsers(Map<String, dynamic> params) =>
      dio.get('/admin/users', queryParameters: params);

  static Future<Response> updateUserStatus(String userId, String status) =>
      dio.patch('/admin/users/$userId/status', data: {'status': status});

  static Future<Response> getAllVendorsAdmin(Map<String, dynamic> params) =>
      dio.get('/admin/vendors', queryParameters: params);

  static Future<Response> approveKyc(String vendorId) =>
      dio.post('/vendors/$vendorId/kyc/approve');

  static Future<Response> rejectKyc(String vendorId, String reason) =>
      dio.post('/vendors/$vendorId/kyc/reject', data: {'reason': reason});

  static Future<Response> updateVendorFeatured(String vendorId, {required bool featured}) =>
      dio.patch('/admin/vendors/$vendorId/featured', data: {'isFeatured': featured});

  static Future<Response> getAllBookingsAdmin(Map<String, dynamic> params) =>
      dio.get('/admin/bookings', queryParameters: params);

  static Future<Response> overrideBookingStatus(String bookingId, String status) =>
      dio.patch('/admin/bookings/$bookingId/status', data: {'status': status});

  static Future<Response> getDisputes(Map<String, dynamic> params) =>
      dio.get('/admin/disputes', queryParameters: params);

  static Future<Response> resolveDispute(String disputeId, String action) =>
      dio.post('/admin/disputes/$disputeId/resolve', data: {'action': action});

  static Future<Response> getPlatformReports(Map<String, dynamic> params) =>
      dio.get('/admin/reports', queryParameters: params);

  static Future<Response> broadcastNotification({
    required String title,
    required String body,
    String? targetRole,
  }) =>
      dio.post('/admin/notifications/broadcast', data: {
        'title': title,
        'body': body,
        if (targetRole != null) 'targetRole': targetRole,
      });
}
