import os
import requests

BACKEND_URL = os.environ["BACKEND_URL"].rstrip("/")
AI_API_KEY = os.environ["AI_API_KEY"]

HEADERS = {"x-api-key": AI_API_KEY, "Content-Type": "application/json"}

# The dev Postgres instance this prototype talks to occasionally has multi-second
# cold-start latency, so timeouts here are generous to avoid spurious failures.
REQUEST_TIMEOUT_SECONDS = 25


def get_active_buses():
    res = requests.get(f"{BACKEND_URL}/api/live-buses", timeout=REQUEST_TIMEOUT_SECONDS)
    res.raise_for_status()
    buses = res.json()["buses"]
    return [b for b in buses if b["isActive"] and b["routeId"] and b["location"]]


def get_route(route_id: str):
    res = requests.get(f"{BACKEND_URL}/api/routes/{route_id}", timeout=REQUEST_TIMEOUT_SECONDS)
    res.raise_for_status()
    return res.json()["route"]


def get_gps_history(limit: int = 5000):
    res = requests.get(
        f"{BACKEND_URL}/api/gps/history",
        headers=HEADERS,
        params={"limit": limit},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    res.raise_for_status()
    return res.json()["logs"]


def post_prediction(bus_id: str, station_id: str, eta_minutes: float, delay_minutes: float):
    res = requests.post(
        f"{BACKEND_URL}/api/predictions",
        headers=HEADERS,
        json={
            "busId": bus_id,
            "stationId": station_id,
            "predictedEtaMinutes": round(eta_minutes, 2),
            "predictedDelayMinutes": round(delay_minutes, 2),
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    res.raise_for_status()
    return res.json()["prediction"]
