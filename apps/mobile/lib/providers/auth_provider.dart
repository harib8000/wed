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

  /// Re-run the token check from secure storage (used after biometric auth).
  Future<void> refreshFromStorage() => _init();

  /// Bypass login with a demo customer account
  void demoCustomerLogin() {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: const User(
        id: 'demo-customer-1',
        phone: '9876543210',
        name: 'Priya & Rahul',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: true,
        email: 'priya@example.com',
        city: 'Hyderabad',
        weddingDate: '15 Mar 2025',
        partnerName: 'Rahul',
        budgetPaise: 2500000000, // ₹25 Lakhs
      ),
    );
  }

  /// Bypass login with a demo vendor/seller account
  void demoVendorLogin() {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: const User(
        id: 'demo-vendor-1',
        phone: '9988776655',
        name: 'Royal Grand Palace',
        role: 'VENDOR',
        status: 'ACTIVE',
        phoneVerified: true,
        email: 'info@royalgrandpalace.com',
        city: 'Hyderabad',
      ),
    );
  }

  /// Bypass login with a demo coordinator account
  void demoCoordinatorLogin() {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: const User(
        id: 'demo-coordinator-1',
        phone: '9876543212',
        name: 'Meera Events',
        role: 'COORDINATOR',
        status: 'ACTIVE',
        phoneVerified: true,
        email: 'meera@events.com',
        city: 'Mumbai',
      ),
    );
  }

  /// Bypass login with a demo admin account
  void demoAdminLogin() {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: const User(
        id: 'demo-admin-1',
        phone: '9876543213',
        name: 'WeddingOS Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        phoneVerified: true,
        email: 'admin@weddingos.in',
        city: 'Bangalore',
      ),
    );
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// Convenience selectors
final currentUserProvider = Provider<User?>((ref) => ref.watch(authProvider).user);
final isAuthenticatedProvider = Provider<bool>((ref) => ref.watch(authProvider).isAuthenticated);
