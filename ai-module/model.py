from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

DEFAULT_SPEED_KMH = 25.0
MIN_SAMPLES_FOR_REGRESSION = 8
MIN_MOVING_SPEED_KMH = 1.0
SPEED_CLIP_MIN = 5.0
SPEED_CLIP_MAX = 60.0


class SpeedModel:
    """Predicts expected bus speed (km/h) as a function of hour-of-day.

    Trained on historical GPSLog speed samples. This directly matches the
    "Peak Hour Identification" / "Travel Time Prediction" AI modules from the
    project proposal: it learns how traffic conditions affect speed over the
    day from real collected data, rather than assuming a constant speed.

    Falls back to simple heuristics when there isn't enough historical data
    yet -- honest behavior for an early-stage prototype instead of pretending
    a regression fit on a handful of points is meaningful.
    """

    def __init__(self, gps_logs: list[dict]):
        df = pd.DataFrame(gps_logs)
        self.sample_count = 0
        self.free_flow_speed_kmh = DEFAULT_SPEED_KMH
        self._regression: LinearRegression | None = None
        self._mean_speed = DEFAULT_SPEED_KMH

        if df.empty or "speed" not in df.columns:
            return

        df = df.dropna(subset=["speed"])
        df = df[df["speed"] > MIN_MOVING_SPEED_KMH]
        if df.empty:
            return

        df["recordedAt"] = pd.to_datetime(df["recordedAt"])
        df["hour"] = df["recordedAt"].dt.hour

        self.sample_count = len(df)
        self._mean_speed = float(df["speed"].mean())
        self.free_flow_speed_kmh = float(np.clip(df["speed"].quantile(0.9), SPEED_CLIP_MIN, SPEED_CLIP_MAX))

        if self.sample_count >= MIN_SAMPLES_FOR_REGRESSION and df["hour"].nunique() >= 2:
            x = df[["hour"]].to_numpy()
            y = df["speed"].to_numpy()
            self._regression = LinearRegression().fit(x, y)

    def predict_speed_kmh(self, at: datetime | None = None) -> float:
        at = at or datetime.now(timezone.utc)

        if self._regression is not None:
            predicted = float(self._regression.predict([[at.hour]])[0])
        else:
            predicted = self._mean_speed

        return float(np.clip(predicted, SPEED_CLIP_MIN, SPEED_CLIP_MAX))

    @property
    def is_trained(self) -> bool:
        return self._regression is not None
