import argparse
import time

from dotenv import load_dotenv

load_dotenv()

import api_client
from geo import haversine_distance_km
from model import SpeedModel

MODEL_REFRESH_EVERY_N_LOOPS = 10


def run_prediction_pass(model: SpeedModel) -> int:
    buses = api_client.get_active_buses()
    route_cache: dict[str, dict] = {}
    predictions_made = 0

    for bus in buses:
        route_id = bus["routeId"]
        if route_id not in route_cache:
            route_cache[route_id] = api_client.get_route(route_id)
        route = route_cache[route_id]

        location = bus["location"]
        predicted_speed = model.predict_speed_kmh()
        free_flow_speed = model.free_flow_speed_kmh

        for bus_route in route["busRoutes"]:
            station = bus_route["station"]
            distance_km = haversine_distance_km(
                location["latitude"], location["longitude"], station["latitude"], station["longitude"]
            )

            eta_minutes = (distance_km / predicted_speed) * 60
            free_flow_minutes = (distance_km / free_flow_speed) * 60
            delay_minutes = max(0.0, eta_minutes - free_flow_minutes)

            api_client.post_prediction(bus["id"], station["id"], eta_minutes, delay_minutes)
            predictions_made += 1
            print(
                f"  {bus['busNumber']} -> {station['name']}: "
                f"eta={eta_minutes:.1f}min delay={delay_minutes:.1f}min "
                f"(speed={predicted_speed:.1f}km/h, dist={distance_km:.2f}km)"
            )

    return predictions_made


def train_model() -> SpeedModel:
    print("Fetching GPS history to train speed model...")
    history = api_client.get_gps_history(limit=5000)
    model = SpeedModel(history)
    status = "regression trained" if model.is_trained else "using heuristic fallback (not enough data yet)"
    print(
        f"Model ready: {model.sample_count} samples, {status}. "
        f"free-flow speed ~{model.free_flow_speed_kmh:.1f}km/h"
    )
    return model


def main():
    parser = argparse.ArgumentParser(description="Islamabad Metro Bus AI prediction service")
    parser.add_argument("--once", action="store_true", help="Run a single prediction pass and exit")
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help="Seconds between prediction passes (overrides POLL_INTERVAL_SECONDS env var)",
    )
    args = parser.parse_args()

    import os

    interval = args.interval or int(os.environ.get("POLL_INTERVAL_SECONDS", "30"))

    model = train_model()
    loop_count = 0

    while True:
        loop_count += 1
        print(f"\n[pass {loop_count}] evaluating active buses...")
        try:
            count = run_prediction_pass(model)
            print(f"[pass {loop_count}] published {count} predictions")
        except Exception as exc:  # noqa: BLE001 - keep the service alive on transient API errors
            print(f"[pass {loop_count}] error: {exc}")

        if args.once:
            break

        if loop_count % MODEL_REFRESH_EVERY_N_LOOPS == 0:
            model = train_model()

        time.sleep(interval)


if __name__ == "__main__":
    main()
