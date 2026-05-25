import { useState, useCallback } from "react";
import { FarmWeatherContext } from "./useWeather";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskFactor {
  name: string;
  /** "High" | "Medium" | "Low" | "None Detected" */
  risk: string;
}

/**
 * Fully structured agronomic report returned by the RAG pipeline.
 * Every field the frontend renders lives here — nothing is hardcoded.
 */
export interface RagData {
  health_score: number; // 0–100
  ph_value: number; // e.g. 6.4
  ph_label: string; // "Slightly Acidic" …
  ph_status: string; // "NEAR IDEAL RANGE" …
  moisture_pct: number; // 0–100
  moisture_label: string; // "OPTIMAL MOISTURE" …
  classification: string; // "Class II · High Yield Potential"
  ai_summary: string; // 2–3 sentence paragraph
  crops: string[]; // ["Rice", "Wheat", …]
  treatments: string[]; // ["Apply urea …", …]
  npk_warning: string | null; // one-liner or null
  risk_factors: RiskFactor[]; // always 3 items
  field_advice: string; // weather-aware bullet advice
}

export interface InferenceResult {
  success: boolean;
  prediction: string;
  confidence_score: number;
  low_confidence: boolean;
  /** Qualitative NPK strings from the soil property lookup */
  props: {
    pH_range?: string;
    Nitrogen_N?: string;
    Phosphorus_P?: string;
    Potassium_K?: string;
  };
  /**
   * Fully structured LLM output.
   * null only when success === false or conf ≤ 0.40.
   */
  rag_data: RagData | null;
  scan_id: string | null;
  saved: boolean;
  error?: string;
}

export interface InferOptions {
  imageUri: string;
  mimeType?: string;
  filename?: string;
  userId?: string;
  fieldName?: string;
  farmContext?: FarmWeatherContext | null;
  query?: string;
}

export interface InferState {
  result: InferenceResult | null;
  loading: boolean;
  error: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const INFER_URL =
  process.env.EXPO_PUBLIC_INFER_URL ?? "http://192.168.76.198:8000/infer";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInfer() {
  const [state, setState] = useState<InferState>({
    result: null,
    loading: false,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ result: null, loading: false, error: null });
  }, []);

  const infer = useCallback(
    async (opts: InferOptions): Promise<InferenceResult | null> => {
      setState({ result: null, loading: true, error: null });

      try {
        const form = new FormData();
        form.append("file", {
          uri: opts.imageUri,
          name: opts.filename ?? "soil_sample.jpg",
          type: opts.mimeType ?? "image/jpeg",
        } as any);

        const ctx = opts.farmContext;
        const qp = new URLSearchParams();

        if (opts.userId) qp.set("user_id", opts.userId);
        if (opts.fieldName) qp.set("field_name", opts.fieldName);

        if (ctx) {
          qp.set("location", ctx.location.name);
          qp.set("elevation_m", String(ctx.location.elevation_m));
          qp.set("temp_celsius", String(ctx.current.temperature_c));
          qp.set("humidity_percent", String(ctx.current.humidity_pct));
          qp.set(
            "rainfall_last_7d_mm",
            String(ctx.rainfall_summary.last_7_days_mm),
          );
          qp.set(
            "rainfall_forecast_14d_mm",
            String(ctx.rainfall_summary.next_14_days_forecast_mm),
          );
          qp.set("season", ctx.season.label);
          qp.set(
            "days_since_last_rain",
            String(ctx.season.days_since_last_rain),
          );
        }

        if (opts.query) qp.set("query", opts.query);

        const url = `${INFER_URL}?${qp.toString()}`;
        const response = await fetch(url, { method: "POST", body: form });

        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          throw new Error(`Server error ${response.status}: ${text}`);
        }

        const data: InferenceResult = await response.json();
        setState({ result: data, loading: false, error: null });
        return data;
      } catch (err: any) {
        const message: string =
          err?.message ?? "Failed to reach inference server.";
        setState({ result: null, loading: false, error: message });
        return null;
      }
    },
    [],
  );

  return {
    infer,
    result: state.result,
    loading: state.loading,
    error: state.error,
    reset,
  };
}
