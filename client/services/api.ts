// app/services/api.ts
// Backend API service for EcoThonn
// Change 192.168.76.203 to your machine's actual IP address
// Run: ifconfig | grep "inet " to find it

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Paths, File as FSFile } from "expo-file-system";

const BACKEND_URL = "http://192.168.76.198:8000";

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
  rag_data?: any; // Persistent structured RAG payload
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

const LOCAL_SCANS_KEY = "soilsense_local_scans";

// Helper function to seed mock database on first run
async function seedLocalDatabase() {
  // Database seeding disabled to keep recent scans empty initially
}

// Save soil scan result locally
export async function saveSoilScan(
  scanData: Partial<SoilScan>,
): Promise<SoilScan> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];

    const id = scanData.id || `local_${Date.now()}`;
    let persistentImageUri = scanData.image_uri || scanData.image_url;

    // Persist photo to documents folder if it is in a temporary path
    const docDirUri: string = Paths.document.uri;
    if (persistentImageUri && !persistentImageUri.startsWith(docDirUri)) {
      try {
        const fileExt = persistentImageUri.split('.').pop() || "jpg";
        const filename = `soil_scan_${id}.${fileExt}`;
        const srcFile = new FSFile(persistentImageUri);
        const destFile = new FSFile(Paths.document, filename);
        await srcFile.copy(destFile);
        persistentImageUri = destFile.uri;
      } catch (e) {
        console.error("Failed to copy image to local persistent documents folder:", e);
      }
    }

    const newScan: SoilScan = {
      id,
      user_id: scanData.user_id || "user123",
      image_uri: persistentImageUri,
      image_url: persistentImageUri,
      soil_type: scanData.soil_type || "Unknown Soil",
      confidence_score: scanData.confidence_score ?? 100,
      ph_range: scanData.ph_range,
      npk_values: scanData.npk_values,
      health_status: scanData.health_status || "Unknown",
      quality_score: scanData.quality_score ?? 50,
      recommendations: scanData.recommendations || [],
      suggested_crops: scanData.suggested_crops || [],
      fertilizer_recommendation: scanData.fertilizer_recommendation,
      location: scanData.location,
      field_name: scanData.field_name,
      notes: scanData.notes,
      created_at: scanData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rag_data: scanData.rag_data,
    };

    const existingIdx = scans.findIndex(s => s.id === id);
    if (existingIdx >= 0) {
      scans[existingIdx] = newScan;
    } else {
      scans.unshift(newScan);
    }

    await AsyncStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(scans));
    return newScan;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to save scan locally",
    );
  }
}

// Get user's recent scans locally
export async function getRecentScans(
  userId: string,
  limit: number = 5,
): Promise<SoilScan[]> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];

    const sorted = scans
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return sorted.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent scans locally:", error);
    return [];
  }
}

// Get user's scan history with pagination locally
export async function getScanHistory(
  userId: string,
  skip: number = 0,
  limit: number = 10,
  sortBy: string = "created_at",
  order: number = -1,
): Promise<SoilScan[]> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];

    const filtered = scans.filter(s => s.user_id === userId);

    // Sort based on sortBy and order
    filtered.sort((a: any, b: any) => {
      const valA = a[sortBy] ?? "";
      const valB = b[sortBy] ?? "";

      let comparison = 0;
      if (typeof valA === "string" && typeof valB === "string") {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      }

      return comparison * order;
    });

    return filtered.slice(skip, skip + limit);
  } catch (error) {
    console.error("Error fetching scan history locally:", error);
    return [];
  }
}

// Get user's analytics data locally
export async function getAnalytics(
  userId: string,
): Promise<AnalyticsData | null> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];
    const userScans = scans.filter(s => s.user_id === userId);

    if (userScans.length === 0) {
      return {
        total_scans: 0,
        scans_this_month: 0,
        scans_this_week: 0,
        soil_type_distribution: {},
        health_distribution: {},
        average_confidence: 0,
        average_quality_score: 0,
        most_common_soil_type: "N/A",
        most_common_health_status: "N/A",
        recent_scans: [],
        scan_history_by_date: {},
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    let scansThisWeek = 0;
    let scansThisMonth = 0;
    let totalConfidence = 0;
    let totalQuality = 0;

    const soilTypes: Record<string, number> = {};
    const healths: Record<string, number> = {};
    const dateHistory: Record<string, number> = {};

    userScans.forEach(scan => {
      const scanDate = new Date(scan.created_at);
      if (scanDate >= oneWeekAgo) scansThisWeek++;
      if (scanDate >= oneMonthAgo) scansThisMonth++;

      totalConfidence += scan.confidence_score;
      totalQuality += scan.quality_score ?? 50;

      const type = scan.soil_type || "Unknown Soil";
      soilTypes[type] = (soilTypes[type] || 0) + 1;

      const health = scan.health_status || "Unknown";
      healths[health] = (healths[health] || 0) + 1;

      const dateStr = scanDate.toISOString().split("T")[0];
      dateHistory[dateStr] = (dateHistory[dateStr] || 0) + 1;
    });

    let mostCommonSoil = "N/A";
    let maxSoilCount = 0;
    Object.entries(soilTypes).forEach(([soil, count]) => {
      if (count > maxSoilCount) {
        maxSoilCount = count;
        mostCommonSoil = soil;
      }
    });

    let mostCommonHealth = "N/A";
    let maxHealthCount = 0;
    Object.entries(healths).forEach(([health, count]) => {
      if (count > maxHealthCount) {
        maxHealthCount = count;
        mostCommonHealth = health;
      }
    });

    const sortedScans = [...userScans].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      total_scans: userScans.length,
      scans_this_month: scansThisMonth,
      scans_this_week: scansThisWeek,
      soil_type_distribution: soilTypes,
      health_distribution: healths,
      average_confidence: totalConfidence / userScans.length,
      average_quality_score: totalQuality / userScans.length,
      most_common_soil_type: mostCommonSoil,
      most_common_health_status: mostCommonHealth,
      recent_scans: sortedScans.slice(0, 5),
      scan_history_by_date: dateHistory,
    };
  } catch (error) {
    console.error("Error generating analytics locally:", error);
    return null;
  }
}

// Get total scan count locally
export async function getScanCount(userId: string): Promise<number> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];
    return scans.filter(s => s.user_id === userId).length;
  } catch (error) {
    console.error("Error getting scan count locally:", error);
    return 0;
  }
}

// Get specific scan by ID locally
export async function getScanById(scanId: string): Promise<SoilScan | null> {
  try {
    await seedLocalDatabase();
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];
    const found = scans.find(s => s.id === scanId);
    return found || null;
  } catch (error) {
    console.error("Error fetching scan by ID locally:", error);
    return null;
  }
}

// Update soil scan locally
export async function updateSoilScan(
  scanId: string,
  updateData: Partial<SoilScan>,
): Promise<SoilScan | null> {
  try {
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];
    const idx = scans.findIndex(s => s.id === scanId);
    if (idx === -1) return null;

    const updated = {
      ...scans[idx],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    scans[idx] = updated;
    await AsyncStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(scans));
    return updated;
  } catch (error) {
    console.error("Error updating scan locally:", error);
    return null;
  }
}

// Delete soil scan locally
export async function deleteSoilScan(scanId: string): Promise<boolean> {
  try {
    const rawScans = await AsyncStorage.getItem(LOCAL_SCANS_KEY);
    const scans: SoilScan[] = rawScans ? JSON.parse(rawScans) : [];
    const idx = scans.findIndex(s => s.id === scanId);
    if (idx === -1) return false;

    const scanToDelete = scans[idx];
    const imgPath = scanToDelete.image_uri || scanToDelete.image_url;

    // Delete image file persistently if stored in documents folder
    const docDirUri: string = Paths.document.uri;
    if (imgPath && imgPath.startsWith(docDirUri)) {
      try {
        const imgFile = new FSFile(imgPath);
        await imgFile.delete();
      } catch (e) {
        console.warn("Failed to delete local image file:", e);
      }
    }

    scans.splice(idx, 1);
    await AsyncStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(scans));
    return true;
  } catch (error) {
    console.error("Error deleting scan locally:", error);
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
