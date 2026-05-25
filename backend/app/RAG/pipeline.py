import json
import torch
import numpy as np
import pandas as pd
import ollama
import os
from sentence_transformers import SentenceTransformer, util
from dataclasses import dataclass

_HERE = os.path.dirname(os.path.abspath(__file__))


# ── config ──────────────────────────────────────────────
OLLAMA_MODEL = "qwen2.5:7b-instruct-q4_K_M"
EMBEDDINGS_CSV = os.path.join(_HERE, "text_chunks_and_embeddings_df.csv")
SOIL_PROPS_JSON = os.path.join(_HERE, "soil_prop.json")

# ── dataclass ────────────────────────────────────────────
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

# ── load everything once ─────────────────────────────────
device = "cuda" if torch.cuda.is_available() else "cpu"
embedding_model = SentenceTransformer("all-mpnet-base-v2", device=device)

df = pd.read_csv(EMBEDDINGS_CSV)
df["embedding"] = df["embedding"].apply(lambda x: np.fromstring(x.strip("[]"), sep=" "))
embeddings = torch.tensor(np.stack(df["embedding"].tolist()), dtype=torch.float32).to(device)
pages_and_chunks = df.to_dict(orient="records")

with open(SOIL_PROPS_JSON) as f:
    SOIL_PROPERTIES = json.load(f)

# ── core functions ───────────────────────────────────────
def retrieve(query: str, n: int = 5):
    q_emb = embedding_model.encode(query, convert_to_tensor=True)
    scores, indices = torch.topk(util.dot_score(q_emb, embeddings)[0], k=n)
    return scores, indices

def ask(input_data: SoilSenseInput, temperature: float = 0.4, max_tokens: int = 512) -> str:
    enriched_query = f"{input_data.query} {input_data.soil_type.replace('_', ' ')} Nepal"
    scores, indices = retrieve(enriched_query)
    context_items = [pages_and_chunks[i] for i in indices]

    soil_props = SOIL_PROPERTIES.get(input_data.soil_type, {})
    soil_block = (
        f"Soil: {input_data.soil_type.replace('_', ' ')} | pH: {soil_props['pH_range']} | "
        f"N: {soil_props['Nitrogen_N']} | P: {soil_props['Phosphorus_P']} | "
        f"K: {soil_props['Potassium_K']} | Confidence: {input_data.confidence*100:.0f}%"
    ) if soil_props else ""

    weather_block = (
        f"Location: {input_data.location} | Elevation: {input_data.elevation_m}m | "
        f"Season: {input_data.season} | Temp: {input_data.temp_celsius}°C | "
        f"Humidity: {input_data.humidity_percent}% | "
        f"Rain last 7d: {input_data.rainfall_last_7d_mm}mm | "
        f"Forecast 14d: {input_data.rainfall_forecast_14d_mm}mm | "
        f"Days since rain: {input_data.days_since_last_rain}"
    )

    pdf_context = "\n".join([
        f"- {item['sentence_chunk'][:200]}..." for item in context_items[:3]
    ])

    confidence_note = (
        f" (low confidence: {input_data.confidence*100:.0f}%, treat soil type as approximate)"
        if input_data.confidence < 0.80 else ""
    )

    prompt = f"""You are an agricultural advisor for Nepal. Answer concisely in 3-5 bullet points max.
No explanations unless critical. Be specific with quantities and timing.
{confidence_note}

CONTEXT:
{soil_block}
{weather_block}

DOCUMENTS:
{pdf_context}

QUERY: {input_data.query}

ANSWER (bullet points only, max 5):"""

    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": temperature, "num_predict": max_tokens, "num_ctx": 4096}
    )
    return response["message"]["content"]



if __name__ == "__main__":
    result = ask(SoilSenseInput(
        soil_type="Red_Soil",
        confidence=0.78,
        location="Chitwan, Nepal",
        elevation_m=200,
        temp_celsius=32,
        humidity_percent=75,
        rainfall_last_7d_mm=5,
        rainfall_forecast_14d_mm=80,
        season="Pre-monsoon",
        days_since_last_rain=3,
        query="What vegetables should I plant this month?"
    ))
    print(result)
