# AI Module — Islamabad Metro Bus AI Information System

Python service that trains a speed-prediction model on real GPS history collected by
the backend, and publishes ETA/delay predictions back to it.

## What it actually does

This directly implements the "Peak Hour Identification" and "Travel Time Prediction"
AI modules from the project proposal:

1. **Trains a `SpeedModel`** on historical `GPSLog` rows (`GET /api/gps/history`):
   a linear regression predicting expected bus speed (km/h) from hour-of-day, fit with
   scikit-learn. With too little data (the common case early in a prototype's life) it
   honestly falls back to a simple mean-speed heuristic instead of pretending a
   regression on a handful of points means anything.
2. **For every active bus** with a live GPS position and an assigned route, computes
   the haversine distance to every station on that route.
3. **Publishes a prediction per bus/station pair** (`POST /api/predictions`, authenticated
   with `AI_API_KEY`): `etaMinutes = distance / predicted_speed`, and
   `delayMinutes = etaMinutes - eta_at_free_flow_speed` (free-flow speed = the 90th
   percentile of historically observed speeds for that data).
4. The backend's `GET /api/eta` (used by both the admin and passenger portals) already
   prefers a prediction under 2 minutes old over its own rule-based estimate — so this
   service's output shows up automatically with no frontend changes.

## Setup

```bash
cd ai-module
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then set AI_API_KEY to match backend/.env's AI_API_KEY
```

## Run

Requires the backend running (`cd backend && npm run dev`).

```bash
# one prediction pass, then exit — good for testing
python main.py --once

# continuous loop (default: every 30s, override with --interval or POLL_INTERVAL_SECONDS)
python main.py
```

The model retrains from fresh GPS history every 10 loop passes so it keeps improving
as more real driving data accumulates.

## Why hour-of-day speed regression instead of a fancier model

The proposal explicitly defers model selection ("AI model selection after evaluating
collected transportation data") since this is a prototype with simulated GPS data, not
months of real traffic history. A defensible, honest approach for this stage is a
model that (a) is trained on real recorded data rather than fabricated, (b) degrades
gracefully to a simple heuristic when data is sparse instead of overfitting noise, and
(c) is easy to explain and swap out later once real operational data exists.
