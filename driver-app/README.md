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
- **Start Trip / End Trip** — `Start Trip` calls `/api/trip/start` (creating
  a `Trip` row) and launches an Android foreground service that keeps
  streaming GPS to `/api/gps/update` even if the app is backgrounded or the
  screen is locked — a persistent notification shows it's running. `End Trip`
  stops the service and calls `/api/trip/end`.
- **Crowd level reporting** — one-tap LOW / MEDIUM / HIGH buttons post to
  `/api/crowd/update`.
- **Emergency button** — one tap (with a confirmation dialog) posts an
  `EMERGENCY` alert to `/api/alerts/emergency`, visible to admins immediately.
- **Route deviation warning** — while on a trip, the app polls
  `/api/driver/alerts` every 15s and shows an in-app banner if the backend's
  route-deviation detection has flagged the bus as off-route.

### Background GPS details

True background tracking uses the `flutter_background_service` plugin to run
a foreground Android service (`foregroundServiceType="location"`). On first
"Start Trip" the app also requests the "Allow all the time" background
location permission and notification permission — Android requires these to
be granted via the system permission flow, not just an in-app dialog.

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
