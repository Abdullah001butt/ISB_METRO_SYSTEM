# Driver App (Flutter)

The Member 4 companion app for bus drivers on the Islamabad Metro Bus AI
Information System. Drivers sign in with their CNIC and password, see the
bus/route assigned to them, and report live GPS position and crowd level
directly from their phone — the same endpoints the fleet simulator uses,
now backed by a real device instead of a synthetic script.

## Features

- **Sign in** — CNIC + password against `/api/driver/login`, JWT stored
  locally via `shared_preferences` and reused on next launch.
- **Dashboard** — fetches `/api/driver/me` and lists the bus(es) assigned to
  the signed-in driver.
- **Go On Duty** — streams the device's live location (via `geolocator`)
  and posts each update to `/api/gps/update`, roughly every 10 meters of
  movement.
- **Crowd level reporting** — one-tap LOW / MEDIUM / HIGH buttons post to
  `/api/crowd/update`.

## Backend

Points at the production backend by default:

```
https://backend-snowy-nu.vercel.app
```

Change `ApiClient.baseUrl` in `lib/api_client.dart` to point at a local
backend (`http://10.0.2.2:3000` from an Android emulator) during development.

## Running

Requires the Flutter SDK and Android SDK/toolchain installed.

```bash
flutter pub get
flutter run           # debug, on a connected device/emulator
flutter build apk --release   # release APK at build/app/outputs/flutter-apk/app-release.apk
```

On Windows, if the project and the Flutter pub cache live on different
drive letters, add `kotlin.incremental=false` to `android/gradle.properties`
— Kotlin's incremental compiler cannot compute a relative path across
drive letters and will crash mid-build otherwise (already set in this repo).

## Test credentials

Use any driver seeded by `backend/prisma/seed.ts` (see the backend's own
docs/report for the current CNIC/password pairs — not duplicated here since
this file is committed to a public repo).
