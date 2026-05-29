import 'package:flutter_test/flutter_test.dart';
import 'package:wedding_os/models/user.dart';

// Pure-logic tests for role-to-home-route mapping and cross-role block logic
// (mirrors the _homeForRole and _authRedirect logic in router.dart)

String homeForRole(String role) {
  switch (role) {
    case 'VENDOR':
      return '/vendor/dashboard';
    case 'COORDINATOR':
      return '/coordinator/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

bool isCrossRoleViolation(String role, String location) {
  final isVendorRoute = location.startsWith('/vendor');
  final isCoordinatorRoute = location.startsWith('/coordinator');
  final isAdminRoute = location.startsWith('/admin');

  switch (role) {
    case 'VENDOR':
      return !isVendorRoute && location != '/notifications';
    case 'COORDINATOR':
      return !isCoordinatorRoute && location != '/notifications';
    case 'ADMIN':
      return !isAdminRoute && location != '/notifications';
    default: // CUSTOMER
      return isVendorRoute || isCoordinatorRoute || isAdminRoute;
  }
}

void main() {
  group('homeForRole', () {
    test('CUSTOMER → /', () {
      expect(homeForRole('CUSTOMER'), '/');
    });
    test('VENDOR → /vendor/dashboard', () {
      expect(homeForRole('VENDOR'), '/vendor/dashboard');
    });
    test('COORDINATOR → /coordinator/dashboard', () {
      expect(homeForRole('COORDINATOR'), '/coordinator/dashboard');
    });
    test('ADMIN → /admin/dashboard', () {
      expect(homeForRole('ADMIN'), '/admin/dashboard');
    });
    test('unknown role falls back to /', () {
      expect(homeForRole('UNKNOWN'), '/');
    });
  });

  group('isCrossRoleViolation — CUSTOMER', () {
    test('CUSTOMER accessing / is allowed', () {
      expect(isCrossRoleViolation('CUSTOMER', '/'), false);
    });
    test('CUSTOMER accessing /vendors is allowed', () {
      expect(isCrossRoleViolation('CUSTOMER', '/vendors'), false);
    });
    test('CUSTOMER accessing /vendor/dashboard is blocked', () {
      expect(isCrossRoleViolation('CUSTOMER', '/vendor/dashboard'), true);
    });
    test('CUSTOMER accessing /coordinator/dashboard is blocked', () {
      expect(isCrossRoleViolation('CUSTOMER', '/coordinator/dashboard'), true);
    });
    test('CUSTOMER accessing /admin/dashboard is blocked', () {
      expect(isCrossRoleViolation('CUSTOMER', '/admin/dashboard'), true);
    });
  });

  group('isCrossRoleViolation — VENDOR', () {
    test('VENDOR accessing /vendor/dashboard is allowed', () {
      expect(isCrossRoleViolation('VENDOR', '/vendor/dashboard'), false);
    });
    test('VENDOR accessing /notifications is allowed', () {
      expect(isCrossRoleViolation('VENDOR', '/notifications'), false);
    });
    test('VENDOR accessing / is blocked', () {
      expect(isCrossRoleViolation('VENDOR', '/'), true);
    });
    test('VENDOR accessing /coordinator/dashboard is blocked', () {
      expect(isCrossRoleViolation('VENDOR', '/coordinator/dashboard'), true);
    });
    test('VENDOR accessing /admin/dashboard is blocked', () {
      expect(isCrossRoleViolation('VENDOR', '/admin/dashboard'), true);
    });
  });

  group('isCrossRoleViolation — COORDINATOR', () {
    test('COORDINATOR accessing /coordinator/dashboard is allowed', () {
      expect(isCrossRoleViolation('COORDINATOR', '/coordinator/dashboard'), false);
    });
    test('COORDINATOR accessing /coordinator/events is allowed', () {
      expect(isCrossRoleViolation('COORDINATOR', '/coordinator/events'), false);
    });
    test('COORDINATOR accessing /notifications is allowed', () {
      expect(isCrossRoleViolation('COORDINATOR', '/notifications'), false);
    });
    test('COORDINATOR accessing / is blocked', () {
      expect(isCrossRoleViolation('COORDINATOR', '/'), true);
    });
    test('COORDINATOR accessing /vendor/dashboard is blocked', () {
      expect(isCrossRoleViolation('COORDINATOR', '/vendor/dashboard'), true);
    });
    test('COORDINATOR accessing /admin/dashboard is blocked', () {
      expect(isCrossRoleViolation('COORDINATOR', '/admin/dashboard'), true);
    });
  });

  group('isCrossRoleViolation — ADMIN', () {
    test('ADMIN accessing /admin/dashboard is allowed', () {
      expect(isCrossRoleViolation('ADMIN', '/admin/dashboard'), false);
    });
    test('ADMIN accessing /admin/reports is allowed', () {
      expect(isCrossRoleViolation('ADMIN', '/admin/reports'), false);
    });
    test('ADMIN accessing /notifications is allowed', () {
      expect(isCrossRoleViolation('ADMIN', '/notifications'), false);
    });
    test('ADMIN accessing / is blocked', () {
      expect(isCrossRoleViolation('ADMIN', '/'), true);
    });
    test('ADMIN accessing /vendor/dashboard is blocked', () {
      expect(isCrossRoleViolation('ADMIN', '/vendor/dashboard'), true);
    });
    test('ADMIN accessing /coordinator/dashboard is blocked', () {
      expect(isCrossRoleViolation('ADMIN', '/coordinator/dashboard'), true);
    });
  });

  group('User model role fields', () {
    test('User fromJson includes coordinator fields', () {
      final user = User.fromJson({
        '_id': 'u1',
        'phone': '9999999999',
        'role': 'COORDINATOR',
        'organizationName': 'Dream Events',
        'assignedEventIds': ['e1', 'e2'],
        'completedEventsCount': 5,
      });
      expect(user.role, 'COORDINATOR');
      expect(user.organizationName, 'Dream Events');
      expect(user.assignedEventIds, ['e1', 'e2']);
      expect(user.completedEventsCount, 5);
    });

    test('User fromJson includes admin fields', () {
      final user = User.fromJson({
        '_id': 'u2',
        'phone': '8888888888',
        'role': 'ADMIN',
        'permissions': ['kyc.approve', 'dispute.resolve'],
        'adminLevel': 2,
      });
      expect(user.role, 'ADMIN');
      expect(user.permissions, ['kyc.approve', 'dispute.resolve']);
      expect(user.adminLevel, 2);
    });
  });
}
