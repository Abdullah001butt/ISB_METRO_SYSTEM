# Islamabad Metro Bus AI Information System

A prototype AI-powered information layer for the Islamabad Metro Bus network: live (simulated)
GPS tracking, AI-assisted ETA/delay prediction, and centralized management — built as a
learning/demo project, not a production transit system.

## Project structure

This is a monorepo with four independent pieces, each owned by one "member" of the team plan:

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend) | REST API, database, auth, AI prediction hub | Next.js API routes, PostgreSQL, Prisma |
| [`admin-portal/`](admin-portal) | Internal dashboard for managing the network | Next.js, Tailwind |
| [`passenger-portal/`](passenger-portal) | Public-facing live tracking site (no login) | Next.js, Tailwind |
| [`ai-module/`](ai-module) | Trains a speed model on GPS history, publishes ETA/delay predictions | Python, scikit-learn |

See `backend/API_DOCS.md` for the full API reference.

## Running locally

You need Node.js, Python 3.10+, and a PostgreSQL database (a free one from
[Prisma Postgres](https://www.prisma.io/postgres) works well for development).

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, AI_API_KEY
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

## Architecture notes

- **No WebSockets** — the system deliberately uses simple REST polling (every few seconds)
  instead of a real-time transport layer, to keep the prototype's infrastructure simple.
- **Simulated GPS** — there's no real hardware. Buses report position via
  `POST /api/gps/update`, either from a driver-facing mobile app (not yet built) or simulated
  directly against the API.
- **AI predictions are additive, not required** — `GET /api/eta` prefers a fresh AI
  prediction (<2 min old) but transparently falls back to a haversine-distance/speed estimate
  when none exists, so the frontends work identically whether or not the AI module is running.
