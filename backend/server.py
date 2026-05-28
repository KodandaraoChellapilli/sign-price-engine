from __future__ import annotations

import importlib
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

try:
    model_utils = importlib.import_module("utilits")
except ModuleNotFoundError:
    model_utils = importlib.import_module("utils")


app = FastAPI(title="Sign Price Predictor API", version="1.0.0")
logger = logging.getLogger("uvicorn.error")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    sign_type: str
    material: str
    complexity: str
    lighting: bool
    installation: bool
    quantity: int = Field(..., gt=0)

    @field_validator("sign_type", "material", "complexity")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("value cannot be empty")
        return value


class PredictResponse(BaseModel):
    estimated_price: float


@app.on_event("startup")
def startup_load_artifacts() -> None:
    # Pickled scikit-learn models can warn or fail if training and runtime versions differ.
    try:
        model_utils.load_saved_artifacts()
        logger.info("Model artifacts loaded successfully.")
    except Exception:
        logger.exception("Failed to load model artifacts during startup.")
        raise


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "Sign Price Predictor API is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    try:
        price = model_utils.get_estimated_price(
            width=payload.width,
            height=payload.height,
            sign_type=payload.sign_type,
            material=payload.material,
            complexity=payload.complexity,
            lighting=payload.lighting,
            installation=payload.installation,
            quantity=payload.quantity,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    return PredictResponse(estimated_price=price)
