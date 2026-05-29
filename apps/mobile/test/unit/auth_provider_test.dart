import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:wedding_os/models/user.dart';
import 'package:wedding_os/providers/auth_provider.dart';

void main() {
  group('AuthState', () {
    test('default status is unknown', () {
      const state = AuthState(status: AuthStatus.unknown);
      expect(state.status, AuthStatus.unknown);
      expect(state.isAuthenticated, false);
      expect(state.user, null);
    });

    test('authenticated state with user', () {
      const user = User(
        id: 'u1',
        phone: '9876543210',
        name: 'Test User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: true,
      );
      const state = AuthState(status: AuthStatus.authenticated, user: user);
      expect(state.isAuthenticated, true);
      expect(state.user?.name, 'Test User');
    });

    test('copyWith preserves user when not provided', () {
      const user = User(
        id: 'u1',
        phone: '9876543210',
        name: 'Test',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: true,
      );
      const original = AuthState(status: AuthStatus.authenticated, user: user);
      final updated = original.copyWith(status: AuthStatus.unauthenticated);
      expect(updated.status, AuthStatus.unauthenticated);
      expect(updated.user, user);
    });
  });

  group('AuthNotifier demo logins', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('demoCustomerLogin sets CUSTOMER role', () {
      container.read(authProvider.notifier).demoCustomerLogin();
      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.role, 'CUSTOMER');
      expect(state.user?.name, isNotEmpty);
    });

    test('demoVendorLogin sets VENDOR role', () {
      container.read(authProvider.notifier).demoVendorLogin();
      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.role, 'VENDOR');
    });

    test('demoCoordinatorLogin sets COORDINATOR role', () {
      container.read(authProvider.notifier).demoCoordinatorLogin();
      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.role, 'COORDINATOR');
    });

    test('demoAdminLogin sets ADMIN role', () {
      container.read(authProvider.notifier).demoAdminLogin();
      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.role, 'ADMIN');
    });

    test('isAuthenticatedProvider reflects auth state', () {
      expect(container.read(isAuthenticatedProvider), false);
      container.read(authProvider.notifier).demoCustomerLogin();
      expect(container.read(isAuthenticatedProvider), true);
    });

    test('currentUserProvider returns user when authenticated', () {
      expect(container.read(currentUserProvider), null);
      container.read(authProvider.notifier).demoVendorLogin();
      expect(container.read(currentUserProvider), isNotNull);
      expect(container.read(currentUserProvider)?.role, 'VENDOR');
    });
  });
}
