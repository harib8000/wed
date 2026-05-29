# [DEPRECATED — Mobile Only]

> ⚠️ **This web application is no longer the primary delivery vehicle for WeddingOS.**
>
> All user-facing features (Customer, Vendor, Coordinator, Admin) are now served exclusively
> through the **Flutter mobile app** (`apps/mobile`) on iOS and Android.
>
> This directory is retained for reference only. It will not be built or deployed in CI/CD pipelines.
> Do **not** add new features here.

## Migration

All features in this app have been ported to:

- **Customer flows** → `apps/mobile/lib/features/` (home, vendors, bookings, checkout, chat, wishlist, checklist, profile)
- **API integration** → `apps/mobile/lib/core/api_client.dart`
- **State management** → `apps/mobile/lib/providers/`

## Running (local dev only)

```bash
pnpm dev
```

The 12 backend microservices remain unchanged and continue to serve the mobile app via Kong gateway.
