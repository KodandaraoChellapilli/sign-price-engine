from __future__ import annotations

import json
import pickle
import warnings
from pathlib import Path
from typing import Any

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "sign_price_model.pickle"
COLUMNS_PATH = BASE_DIR / "columns.json"

_data_columns: list[str] | None = None
_model: Any | None = None


def _normalize_text(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def load_saved_artifacts() -> None:
    global _data_columns, _model

    if _data_columns is None:
        if not COLUMNS_PATH.exists():
            raise FileNotFoundError(f"Columns file not found at {COLUMNS_PATH}")
        with COLUMNS_PATH.open("r", encoding="utf-8") as columns_file:
            payload = json.load(columns_file)
        data_columns = payload.get("data_columns")
        if not isinstance(data_columns, list) or not data_columns:
            raise ValueError("columns.json must contain a non-empty 'data_columns' list")
        _data_columns = [str(column) for column in data_columns]

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        with MODEL_PATH.open("rb") as model_file:
            _model = pickle.load(model_file)


def get_data_columns() -> list[str]:
    load_saved_artifacts()
    return list(_data_columns or [])


def get_estimated_price(
    width: float,
    height: float,
    sign_type: str,
    material: str,
    complexity: str,
    lighting: bool,
    installation: bool,
    quantity: int,
) -> float:
    load_saved_artifacts()

    if width <= 0 or height <= 0:
        raise ValueError("width and height must be greater than 0")
    if quantity <= 0:
        raise ValueError("quantity must be greater than 0")

    area = width * height
    row = pd.DataFrame(
        [
            {
                "width": width,
                "height": height,
                "area": area,
                "sign_type": _normalize_text(sign_type),
                "material": _normalize_text(material),
                "complexity": _normalize_text(complexity),
                "lighting": int(lighting),
                "installation": int(installation),
                "quantity": quantity,
            }
        ]
    )

    encoded = pd.get_dummies(
        row,
        columns=["sign_type", "material", "complexity"],
        prefix="",
        prefix_sep="",
    )
    aligned = encoded.reindex(columns=_data_columns, fill_value=0)

    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="X has feature names, but RandomForestRegressor was fitted without feature names",
            category=UserWarning,
        )
        prediction = float(_model.predict(aligned)[0])
    return round(prediction, 2)
