import { useState, useEffect } from "react";
import * as Location from "expo-location";

// Module-level global state to persist location across hook instances
let globalLocation: { latitude: number; longitude: number } | null = null;
let globalErrorMsg: string | null = null;
let listeners: ((loc: { latitude: number; longitude: number } | null) => void)[] = [];

const setGlobalLocation = (loc: { latitude: number; longitude: number } | null) => {
  globalLocation = loc;
  listeners.forEach((listener) => listener(loc));
};

export function useLocation() {
  const [location, setLocalLocation] = useState(globalLocation);
  const [errorMsg, setErrorMsg] = useState(globalErrorMsg);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalLocation(globalLocation);
    const listener = (newLoc: { latitude: number; longitude: number } | null) => {
      setLocalLocation(newLoc);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const fetchLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const msg = "Permission to access location was denied";
        setErrorMsg(msg);
        globalErrorMsg = msg;
        setLoading(false);
        return null;
      }

      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      };
      setGlobalLocation(coords);
      setLoading(false);
      return coords;
    } catch (err: any) {
      const msg = err.message || "Failed to fetch location";
      setErrorMsg(msg);
      globalErrorMsg = msg;
      setLoading(false);
      return null;
    }
  };

  return {
    location,
    errorMsg,
    loading,
    fetchLocation,
  };
}
