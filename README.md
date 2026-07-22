# Islamabad Metro Bus AI Information System

A prototype AI-powered information layer for the Islamabad Metro Bus network: live (simulated)
GPS tracking, AI-assisted ETA/delay prediction, real-time updates, and centralized management —
built as a learning/demo project, not a production transit system.

## Project structure

This is a monorepo with seven independent pieces:

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend) | REST API, database, auth, rate limiting, AI prediction hub | Next.js API routes, PostgreSQL, Prisma, Upstash Redis |
| [`admin-portal/`](admin-portal) | Internal dashboard for managing the network | Next.js, Tailwind |
| [`passenger-portal/`](passenger-portal) | Public-facing live tracking site (no login) | Next.js, Tailwind |
| [`driver-app/`](driver-app) | Driver-facing mobile app: trip lifecycle, background GPS, offline queueing, emergency alerts, dispatch messaging | Flutter (Android) |
| [`ai-module/`](ai-module) | Trains a speed model on GPS history, publishes ETA/delay predictions | Python, scikit-learn |
| [`ws-server/`](ws-server) | Real-time relay — pushes live bus updates to connected clients | Node.js, ws |
| [`fleet-simulator/`](fleet-simulator) | Drives the seeded fleet along their routes continuously, generating the GPS history the AI module trains on | Node.js |

See `backend/API_DOCS.md` for the full API reference. CI (GitHub Actions) runs
lint + build for all three web apps and the backend's test suite on every
push/PR to `main` — see `.github/workflows/ci.yml`.

## Running locally

You need Node.js, Python 3.10+, and a PostgreSQL database — [Neon](https://neon.tech)'s free
tier is recommended (storage/compute-based limits, not a hard monthly query cap, which matters
once you have background services polling continuously). Rate limiting needs a free
[Upstash Redis](https://upstash.com) database.

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, AI_API_KEY, UPSTASH_*
npx prisma migrate dev
npm run seed            # creates a default admin + realistic sample data
npm run dev              # http://localhost:3000
```
Default admin login: `admin@metrobus.pk` / `admin123`.

**2. Admin Portal**
```bash
cd admin-portal
npm install
# .env.local already points at http://localhost:3000 — adjust if needed
npm run dev              # http://localhost:3001 (auto-shifts if 3000 is taken)
```

**3. Passenger Portal**
```bash
cd passenger-portal
npm install
npm run dev              # http://localhost:3002
```

**4. AI Module** (optional — the backend works fine without it, falling back to a
rule-based ETA estimate)
```bash
cd ai-module
python -m venv venv
venv\Scripts\activate     # or: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # AI_API_KEY must match the backend's
python main.py --once     # single pass, or omit --once to loop continuously
```

**5. WebSocket relay** (optional — frontends fall back to REST polling if this isn't running)
```bash
cd ws-server
npm install
BACKEND_URL=http://localhost:3000 npm start   # ws://localhost:8080
```
Set `NEXT_PUBLIC_WS_URL` in each frontend's `.env.local` to point at it.

**6. Fleet simulator** (optional — without it, buses just sit wherever they last were)
```bash
cd fleet-simulator
BACKEND_URL=http://localhost:3000 npm start
```
Logs in as each seeded driver (13s apart, to respect the login rate limit) and drives their
bus back and forth along its route indefinitely, with realistic speed variance and occasional
simulated stalls. Run this for a while — hours, ideally — before expecting the AI module's
speed-vs-hour regression to have enough data to actually fit (it needs ≥8 samples across ≥2
distinct hours; a five-minute test run will just exercise the fallback heuristic).

**7. Driver app** (optional — the backend and simulator work fine without a real driver;
this is the human-in-the-loop alternative to the fleet simulator for a given bus)
```bash
cd driver-app
flutter pub get
flutter run              # on a connected Android device/emulator
# or: flutter build apk --release
```
Requires the Flutter SDK and Android toolchain. Points at the deployed backend by
default (`lib/api_client.dart`); change `ApiClient.baseUrl` for local development
(`http://10.0.2.2:3000` from an Android emulator). See `driver-app/README.md` for
the full feature list and known Windows/Gradle quirks.

## Architecture notes

- **Real-time updates via a separate relay, not in-process WebSockets** — Vercel's serverless
  functions can't hold a persistent connection, so `ws-server` is a small always-on service
  (deployed on Railway) that polls the backend and pushes changes to connected clients over
  WebSocket. Both frontends connect to it via a shared `useLiveBuses` hook and transparently
  fall back to REST polling if the socket is unavailable.
- **Rate limiting via Upstash Redis** — an in-memory limiter wouldn't work reliably across
  Vercel's serverless instances (each can be a fresh process with its own counter), so
  login and write endpoints are limited using a shared Redis-backed sliding window.
- **GPS comes from two sources** — the fleet simulator (`fleet-simulator/`) drives every bus
  along its route continuously so the AI module always has training data, but the driver app
  (`driver-app/`) lets a real phone report actual position for a specific bus instead. To avoid
  both fighting over the same bus's GPS trail, the simulator checks `GET /api/trip/active` each
  tick and stands down for any bus with a driver currently on a real trip.
- **Session revocation via Redis, not shorter-lived tokens** — JWTs still expire after 7 days,
  but logout (and an admin deactivating/deleting a driver) writes a revocation marker to Upstash
  Redis that's checked centrally in `backend/src/middleware.ts` on every request. This avoids
  reworking every frontend into a refresh-token flow just to support "sign out actually signs out."
- **Push notifications use Web Push (VAPID), not Firebase** — the passenger portal's
  "bus approaching" alerts and the driver app's dispatch-message polling both avoid needing an
  external push provider account. The always-on `ws-server` periodically calls
  `POST /api/push/check` since Vercel functions can't run their own background timers.
- **AI predictions are additive, not required** — `GET /api/eta` prefers a fresh AI
  prediction (<2 min old) but transparently falls back to a haversine-distance/speed estimate
  when none exists, so the frontends work identically whether or not the AI module is running.
- **Database provider**: started on Prisma Postgres (free tier), migrated to Neon after the
  Prisma free plan's monthly query quota was exhausted by continuous polling from the AI module
  and WebSocket relay. If you fork this and add always-on background services, pick a plan whose
  limits match a continuous-polling access pattern, not just interactive/dev usage.
