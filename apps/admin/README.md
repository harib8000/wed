# [DEPRECATED — Mobile Only]

> ⚠️ **This web application is no longer the primary delivery vehicle for WeddingOS.**
>
> All admin-facing features are now served exclusively through the **Flutter mobile app**
> (`apps/mobile`) on iOS and Android.
>
> This directory is retained for reference only. It will not be built or deployed in CI/CD pipelines.
> Do **not** add new features here.

## Migration

All admin features have been ported to:

- **Admin Dashboard** → `apps/mobile/lib/features/admin_dashboard/admin_dashboard_screen.dart`
- **User Management** → `apps/mobile/lib/features/admin_dashboard/admin_users_screen.dart`
- **Vendor & KYC** → `apps/mobile/lib/features/admin_dashboard/admin_vendors_screen.dart`
- **Bookings** → `apps/mobile/lib/features/admin_dashboard/admin_bookings_screen.dart`
- **Disputes** → `apps/mobile/lib/features/admin_dashboard/admin_disputes_screen.dart`
- **Reports** → `apps/mobile/lib/features/admin_dashboard/admin_reports_screen.dart`
- **Settings** → `apps/mobile/lib/features/admin_dashboard/admin_settings_screen.dart`
- **API integration** → `apps/mobile/lib/core/api_client.dart`
- **State management** → `apps/mobile/lib/providers/admin_provider.dart`

## Running (local dev only)

```bash
pnpm dev
```

The 12 backend microservices remain unchanged and continue to serve the mobile app via Kong gateway.
