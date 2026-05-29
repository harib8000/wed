# WeddingOS Mobile App

Flutter app for the WeddingOS platform — serving all four user roles (Customer, Vendor, Coordinator, Admin) on **iOS and Android exclusively**.

---

## Roles

| Role | Shell | Home Route |
|---|---|---|
| Customer | `AppShell` | `/` |
| Vendor | `VendorAppShell` | `/vendor/dashboard` |
| Coordinator | `CoordinatorAppShell` | `/coordinator/dashboard` |
| Admin | `AdminAppShell` | `/admin/dashboard` |

---

## Running

```bash
# Install dependencies
flutter pub get

# Dev environment
flutter run --dart-define-from-file=env/dev.json

# Staging
flutter run --dart-define-from-file=env/staging.json
```

### Environment files

`apps/mobile/env/` contains:
- `dev.json` — local/dev API gateway URL
- `staging.json` — staging API gateway URL
- `prod.json` — production API gateway URL

Each file exposes `API_BASE_URL` and `RAZORPAY_KEY_ID`.

---

## Build

### Android debug APK (for testing)

```bash
flutter build apk --debug --dart-define-from-file=env/dev.json
```

### Android release AAB (Play Store)

1. Place your keystore at `android/app/keystore.jks`
2. Set environment variables:
   ```
   KEYSTORE_FILE=keystore.jks
   KEYSTORE_PASSWORD=<your-password>
   KEY_ALIAS=<your-alias>
   KEY_PASSWORD=<your-key-password>
   ```
3. Build:
   ```bash
   flutter build appbundle --release --dart-define-from-file=env/prod.json
   ```

### iOS (Xcode required)

1. Open `ios/Runner.xcworkspace` in Xcode
2. Set your Apple Developer Team and Bundle Identifier in Signing & Capabilities
3. Set up a Distribution provisioning profile for App Store release
4. Build from Xcode **or**:
   ```bash
   flutter build ipa --release --dart-define-from-file=env/prod.json
   ```

The `.ipa` is at `build/ios/ipa/`.

### App signing secrets (CI/CD)

Set these GitHub Actions repository secrets for automated release builds:

| Secret | Description |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias in keystore |
| `ANDROID_KEY_PASSWORD` | Key password |

---

## Tests

```bash
flutter test
```

Test files are in `test/unit/` and `test/widget/`.

---

## Architecture

- **State**: Riverpod (`FutureProvider`, `NotifierProvider`, `StateProvider`)
- **Navigation**: `go_router` with RBAC-aware redirect
- **HTTP**: Dio via `ApiClient` (static methods)
- **Caching**: Hive (coordinator events, admin stats cached offline)
- **Real-time chat**: `socket_io_client`
- **Biometrics**: `local_auth`
- **Push notifications**: Firebase Messaging + `flutter_local_notifications`
- **Theme**: Light/dark mode via `ThemeModeNotifier` + `SharedPreferences`

---

## Release Tracks (Google Play / App Store)

Recommended progression: **Internal → Alpha → Beta → Production**

For Play Store: upload the `.aab` from the release build to the Internal Testing track first.  
For App Store: submit the `.ipa` to TestFlight before promoting to App Store review.

