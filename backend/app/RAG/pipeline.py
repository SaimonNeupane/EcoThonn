#!/usr/bin/env python
# coding: utf-8

"""
SoilSense RAG pipeline — Ollama + Qwen2.5 7B Q4
Returns structured JSON so the frontend has zero static fallbacks.
"""

import json
import os
import re
import torch
import ollama
import numpy as np
import pandas as pd
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer, util
from time import perf_counter as timer

# ─── Resolve paths relative to this file, not the CWD ───────────────────────
# This prevents FileNotFoundError when uvicorn is launched from a different
# working directory (e.g. `uvicorn app.main:app` from P:\eco\backend).
_HERE = os.path.dirname(os.path.abspath(__file__))

def _data_path(filename: str) -> str:
    """Return absolute path to a data file sitting next to pipeline.py."""
    return os.path.join(_HERE, filename)

# ─── Device ───────────────────────────────────────────────────────────────────
device = "cuda" if torch.cuda.is_available() else "cpu"

# ─── Ollama model ─────────────────────────────────────────────────────────────
OLLAMA_MODEL = "qwen2.5:7b-instruct-q4_K_M"

# ─── Embedding model (loaded once at import time) ────────────────────────────
embedding_model = SentenceTransformer(
    model_name_or_path="all-mpnet-base-v2",
    device=device,
)

# ─── Load pre-computed chunk embeddings ──────────────────────────────────────
_df = pd.read_csv(_data_path("text_chunks_and_embeddings_df.csv"))
_df["embedding"] = _df["embedding"].apply(
    lambda x: np.fromstring(x.strip("[]"), sep=" ")
)
embeddings: torch.Tensor = torch.tensor(
    np.stack(_df["embedding"].tolist(), axis=0),
    dtype=torch.float32,
).to(device)
pages_and_chunks: list[dict] = _df.to_dict(orient="records")

# ─── Soil properties lookup ───────────────────────────────────────────────────
with open(_data_path("soil_prop.json")) as _f:
    SOIL_PROPERTIES: dict = json.load(_f)


# ─── Input dataclass ──────────────────────────────────────────────────────────
@dataclass
class SoilSenseInput:
    soil_type: str
    confidence: float
    location: str
    elevation_m: float
    temp_celsius: float
    humidity_percent: float
    rainfall_last_7d_mm: float
    rainfall_forecast_14d_mm: float
    season: str
    days_since_last_rain: int
    query: str


# ─── Retrieval ────────────────────────────────────────────────────────────────
def retrieve_relevant_resources(
    query: str,
    n: int = 5,
) -> tuple[torch.Tensor, torch.Tensor]:
    q_emb = embedding_model.encode(query, convert_to_tensor=True)
    scores = util.dot_score(q_emb, embeddings)[0]
    return torch.topk(scores, k=n)


# ─── Prompt builder ───────────────────────────────────────────────────────────
_JSON_SCHEMA = """
{
  "health_score": <integer 0-100>,
  "ph_value": <float>,
  "ph_label": "<Acidic|Slightly Acidic|Neutral|Mildly Alkaline|Alkaline>",
  "ph_status": "<one-line status, e.g. IDEAL FOR MOST CROPS>",
  "moisture_pct": <integer 0-100>,
  "moisture_label": "<CRITICALLY DRY|LOW MOISTURE|BELOW OPTIMAL|GOOD MOISTURE|OPTIMAL MOISTURE|HIGH MOISTURE>",
  "classification": "<Class I–IV · yield potential label>",
  "ai_summary": "<2–3 sentence agronomic summary>",
  "crops": ["<crop1>", "<crop2>", ...],
  "treatments": ["<step 1>", "<step 2>", "<step 3>"],
  "npk_warning": "<one sentence or null>",
  "risk_factors": [
    {"name": "<risk name>", "risk": "<High|Medium|Low|None Detected>"},
    {"name": "<risk name>", "risk": "<High|Medium|Low|None Detected>"},
    {"name": "<risk name>", "risk": "<High|Medium|Low|None Detected>"}
  ],
  "field_advice": "<weather-aware field advice paragraph (3-5 bullet points)>"
}
"""

def build_prompt(inp: SoilSenseInput, context_items: list[dict]) -> str:
    soil_props = SOIL_PROPERTIES.get(inp.soil_type, {})
    soil_name = inp.soil_type.replace("_", " ")

    soil_block = (
        f"Soil: {soil_name} | pH range: {soil_props.get('pH_range', 'unknown')} | "
        f"N: {soil_props.get('Nitrogen_N', '?')} | P: {soil_props.get('Phosphorus_P', '?')} | "
        f"K: {soil_props.get('Potassium_K', '?')} | Confidence: {inp.confidence * 100:.0f}%"
    )
    weather_block = (
        f"Location: {inp.location} | Elevation: {inp.elevation_m}m | "
        f"Season: {inp.season} | Temp: {inp.temp_celsius}°C | "
        f"Humidity: {inp.humidity_percent}% | "
        f"Rain last 7d: {inp.rainfall_last_7d_mm}mm | "
        f"Forecast 14d: {inp.rainfall_forecast_14d_mm}mm | "
        f"Days since rain: {inp.days_since_last_rain}"
    )
    pdf_context = "\n".join(
        f"- {item['sentence_chunk'][:200]}..." for item in context_items[:3]
    )
    low_conf_note = (
        f"\n[NOTE: confidence is only {inp.confidence * 100:.0f}% — treat soil type as approximate]\n"
        if inp.confidence < 0.80 else ""
    )

    return f"""You are an expert agricultural advisor for Nepal.
{low_conf_note}
SOIL & WEATHER CONTEXT:
{soil_block}
{weather_block}

SUPPORTING DOCUMENTS:
{pdf_context}

FARMER QUERY: {inp.query}

TASK: Respond ONLY with a single valid JSON object matching this schema exactly.
No markdown fences, no commentary, no extra keys.

SCHEMA:
{_JSON_SCHEMA}

Rules:
- health_score: derive from NPK levels, pH suitability, and moisture
- ph_value: pick a representative float within the soil's known pH range
- moisture_pct: estimate from rainfall data and soil type
- crops: 4–6 crops best suited to this soil + current season
- treatments: exactly 3 actionable steps with quantities/timing where possible
- risk_factors: always exactly 3 items
- field_advice: incorporate rainfall, temperature, and season into bullet advice
"""


# ─── LLM call ─────────────────────────────────────────────────────────────────
def _ollama_chat(prompt: str, temperature: float = 0.3) -> str:
    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": temperature,
            "num_predict": 900,
            "num_ctx": 4096,
        },
    )
    return response["message"]["content"]


# ─── JSON extractor with fallback ────────────────────────────────────────────
def _extract_json(raw: str) -> dict:
    """
    Try to extract a JSON object from the model output.
    Falls back to a minimal valid dict on parse failure.
    """
    # Strip markdown fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    # Find first { ... }
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    # Fallback — return empty so caller can surface a partial result
    return {}


# ─── Public entry point ───────────────────────────────────────────────────────
def ask(
    input_data: SoilSenseInput,
    temperature: float = 0.3,
    return_raw: bool = False,
) -> dict:
    """
    Run RAG + LLM and return a fully structured dict.

    Keys returned:
        health_score, ph_value, ph_label, ph_status,
        moisture_pct, moisture_label, classification,
        ai_summary, crops, treatments, npk_warning,
        risk_factors, field_advice,
        _raw (only when return_raw=True)
    """
    # Retrieval
    enriched_query = (
        f"{input_data.query} {input_data.soil_type.replace('_', ' ')} Nepal"
    )
    scores, indices = retrieve_relevant_resources(enriched_query)
    context_items = [pages_and_chunks[i] for i in indices]
    for i, item in enumerate(context_items):
        item["score"] = scores[i].cpu().item()

    # Build prompt and generate
    prompt = build_prompt(input_data, context_items)
    raw = _ollama_chat(prompt, temperature=temperature)

    result = _extract_json(raw)

    # Guarantee every expected key exists so callers never crash on KeyError
    defaults = {
        "health_score": 50,
        "ph_value": 6.5,
        "ph_label": "Neutral",
        "ph_status": "DATA UNAVAILABLE",
        "moisture_pct": 40,
        "moisture_label": "UNKNOWN",
        "classification": "Class III · Moderate Yield Potential",
        "ai_summary": "Analysis unavailable — please re-scan with a clearer image.",
        "crops": [],
        "treatments": [],
        "npk_warning": None,
        "risk_factors": [],
        "field_advice": "",
    }
    for key, default in defaults.items():
        result.setdefault(key, default)

    if return_raw:
        result["_raw"] = raw

    return result