// app/services/api.ts
// Backend API service for EcoThonn
// Change 192.168.76.203 to your machine's actual IP address
// Run: ifconfig | grep "inet " to find it

const BACKEND_URL = "http://192.168.76.203:8000";

// Normalise soil type from backend format to SOIL_PROFILES key format
// e.g. "Black_Soil" → "Black Soil", "alluvial soil" → "Alluvial Soil"
export function normalizeSoilType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Transform backend response (with _id) to frontend interface (with id)
function transformScanResponse(data: any): SoilScan {
  return {
    id: data._id, // Map MongoDB's _id to id
    user_id: data.user_id,
    image_url: data.image_url,
    image_uri: data.image_url, // FIX: alias so ResultScreen's image_uri works
    soil_type: normalizeSoilType(data.soil_type ?? ""), // FIX: normalise casing on ingest
    confidence_score: data.confidence_score,
    ph_range: data.ph_range,
    npk_values: data.npk_values,
    health_status: data.health_status,
    quality_score: data.quality_score,
    recommendations: data.recommendations,
    suggested_crops: data.suggested_crops,
    fertilizer_recommendation: data.fertilizer_recommendation,
    location: data.location,
    field_name: data.field_name,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export interface SoilScan {
  id: string;
  user_id: string;
  image_url?: string;
  image_uri?: string; // FIX: added so ResultScreen can read scanData.image_uri
  soil_type: string;
  confidence_score: number;
  ph_range?: string;
  npk_values?: {
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
  };
  health_status: string;
  quality_score?: number;
  recommendations?: string[];
  suggested_crops?: string[];
  fertilizer_recommendation?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  field_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  total_scans: number;
  scans_this_month: number;
  scans_this_week: number;
  soil_type_distribution: Record<string, number>;
  health_distribution: Record<string, number>;
  average_confidence: number;
  average_quality_score: number;
  most_common_soil_type: string;
  most_common_health_status: string;
  recent_scans: SoilScan[];
  scan_history_by_date: Record<string, number>;
}

export interface InferenceResult {
  prediction: string;
  confidence_score: number;
  props: {
    pH_range: string;
    Nitrogen_N: string;
    Phosphorus_P: string;
    Potassium_K: string;
  };
  success: boolean;
  low_confidence?: boolean;
  scan_id?: string;
  saved?: boolean;
  error?: string;
}

// Perform inference and optionally save to database
export async function performInference(
  imageUri: string,
  userId: string,
  fieldName?: string,
): Promise<InferenceResult> {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: "soil_sample.jpg",
      type: "image/jpeg",
    } as any);

    const params = new URLSearchParams();
    params.append("user_id", userId);
    if (fieldName) {
      params.append("field_name", fieldName);
    }

    const response = await fetch(`${BACKEND_URL}/infer?${params.toString()}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const data: InferenceResult = await response.json();

    // FIX: normalise prediction so it matches SOIL_PROFILES keys in ResultScreen
    data.prediction = normalizeSoilType(data.prediction ?? "");

    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to perform inference",
    );
  }
}

// Save soil scan result manually
export async function saveSoilScan(
  scanData: Partial<SoilScan>,
): Promise<SoilScan> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/soil-scan/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scanData),
    });

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const data: SoilScan = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to save scan",
    );
  }
}

// Get user's recent scans (for homepage)
export async function getRecentScans(
  userId: string,
  limit: number = 5,
): Promise<SoilScan[]> {
  try {
    const url = `${BACKEND_URL}/api/v1/soil-scan/recent/${userId}?limit=${limit}`;
    console.log("📡 Fetching recent scans from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const rawData = await response.json();
    console.log("✅ Backend returned scans:", rawData);
    console.log("📊 Number of scans:", rawData.length);

    const transformedData: SoilScan[] = rawData.map(transformScanResponse);

    if (transformedData.length > 0) {
      console.log("🔑 First scan ID (after transform):", transformedData[0].id);
      console.log(
        "📋 First scan after transform:",
        JSON.stringify(transformedData[0], null, 2),
      );
    }
    return transformedData;
  } catch (error) {
    console.error("Error fetching recent scans:", error);
    return [];
  }
}

// Get user's scan history with pagination
export async function getScanHistory(
  userId: string,
  skip: number = 0,
  limit: number = 10,
  sortBy: string = "created_at",
  order: number = -1,
): Promise<SoilScan[]> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/soil-scan/history/${userId}?skip=${skip}&limit=${limit}&sort_by=${sortBy}&order=${order}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const rawData = await response.json();
    const transformedData: SoilScan[] = rawData.map(transformScanResponse);
    return transformedData;
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return [];
  }
}

// Get user's analytics data
export async function getAnalytics(
  userId: string,
): Promise<AnalyticsData | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/soil-scan/analytics/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const rawData = await response.json();

    const data: AnalyticsData = {
      ...rawData,
      recent_scans: rawData.recent_scans?.map(transformScanResponse) || [],
    };

    return data;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}

// Get total scan count
export async function getScanCount(userId: string): Promise<number> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/soil-scan/count/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const data: { user_id: string; total_scans: number } =
      await response.json();
    return data.total_scans;
  } catch (error) {
    console.error("Error fetching scan count:", error);
    return 0;
  }
}

// Get specific scan by ID
export async function getScanById(scanId: string): Promise<SoilScan | null> {
  try {
    console.log("Fetching scan with ID:", scanId);
    const url = `${BACKEND_URL}/api/v1/soil-scan/${scanId}`;
    console.log("Full URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server error ${response.status}:`, errorText);
      throw new Error(`Server error ${response.status}: ${errorText}`);
    }

    const rawData = await response.json();
    console.log("Raw scan data from backend:", rawData);

    const transformedData = transformScanResponse(rawData);
    console.log("Scan data after transform:", transformedData);
    console.log("Transformed ID:", transformedData.id);
    return transformedData;
  } catch (error) {
    console.error("Error fetching scan:", error);
    return null;
  }
}

// Update soil scan
export async function updateSoilScan(
  scanId: string,
  updateData: Partial<SoilScan>,
): Promise<SoilScan | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/soil-scan/${scanId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const data: SoilScan = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating scan:", error);
    return null;
  }
}

// Delete soil scan
export async function deleteSoilScan(scanId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/soil-scan/${scanId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting scan:", error);
    return false;
  }
}

// Helper to generate recommendations from soil profile
export function generateRecommendations(
  soilType: string,
  npkValues: any,
): string[] {
  const recommendations: string[] = [];

  if (npkValues) {
    if (
      npkValues.nitrogen &&
      npkValues.nitrogen.toLowerCase().includes("low")
    ) {
      recommendations.push("Add nitrogen-rich fertilizer for better yield");
    }
    if (
      npkValues.phosphorus &&
      npkValues.phosphorus.toLowerCase().includes("low")
    ) {
      recommendations.push("Apply phosphorus fertilizer for root development");
    }
    if (
      npkValues.potassium &&
      npkValues.potassium.toLowerCase().includes("low")
    ) {
      recommendations.push(
        "Add potassium fertilizer to improve plant strength",
      );
    }
  }

  // FIX: switch cases now use normalised names to match SOIL_PROFILES keys
  switch (normalizeSoilType(soilType)) {
    case "Laterite Soil":
      recommendations.push("Laterite soil is acidic - consider lime treatment");
      recommendations.push("Add organic matter regularly to improve fertility");
      break;
    case "Arid Soil":
      recommendations.push("Install irrigation system for moisture management");
      recommendations.push("Use mulch to reduce water evaporation");
      break;
    case "Black Soil":
      recommendations.push("Well-suited for cotton, sugarcane, and pulses");
      break;
    case "Red Soil":
      recommendations.push(
        "Acidic soil - add lime for better nutrient availability",
      );
      break;
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Soil appears healthy - maintain current management practices",
    );
  }

  return recommendations;
}
