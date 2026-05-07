import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api_client.dart';
import '../models/user.dart';

const _storage = FlutterSecureStorage(
  webOptions: WebOptions.defaultOptions,
);

// ─── Auth Notifier ────────────────────────────────────────────────────────────

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _init();
    return const AuthState(status: AuthStatus.unknown);
  }

  Future<void> _init() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        state = const AuthState(status: AuthStatus.unauthenticated);
        return;
      }
      final res = await ApiClient.getMe();
      final user = User.fromJson(res.data['data'] as Map<String, dynamic>);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      debugPrint('Auth init failed: $e');
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> sendOtp(String phone) async {
    await ApiClient.sendOtp(phone);
  }

  Future<void> verifyOtp(String phone, String otp) async {
    final res = await ApiClient.verifyOtp(phone, otp);
    final data = res.data['data'] as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String;

    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);

    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final res = await ApiClient.dio.put('/users/me', data: data);
    final userData = (res.data['data'] as Map<String, dynamic>?)?['user'] as Map<String, dynamic>?;
    if (userData != null) {
      final user = User.fromJson(userData);
      state = state.copyWith(user: user);
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.dio.post('/auth/logout');
    } catch (e) {
      debugPrint('Logout API call failed (OK): $e');
    }
    await _storage.deleteAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// Convenience selectors
final currentUserProvider = Provider<User?>((ref) => ref.watch(authProvider).user);
final isAuthenticatedProvider = Provider<bool>((ref) => ref.watch(authProvider).isAuthenticated);
