import { useState } from "react";
import {
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  isSignInWithEmailLink,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Deep link URL ────────────────────────────────────────────────────────────
// During Expo Go development, find your local IP with: npx expo start
// then set it like: exp://192.168.1.5:8081/--/finishSignIn
//
// For production builds, use your Firebase hosting URL:
// https://YOUR_PROJECT_ID.firebaseapp.com/finishSignIn
// (add it to Firebase Console → Authentication → Settings → Authorized domains)
const APP_LINK = "expo_url_here";

const EMAIL_STORAGE_KEY = "soilsense_pending_email";

export function useFirebaseEmailAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: Send magic link ────────────────────────────────────────────────
  const sendLink = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: APP_LINK,
        handleCodeInApp: true,
        iOS: {
          bundleId: "com.yourcompany.soilsense",
        },
        android: {
          packageName: "com.yourcompany.soilsense",
          installApp: true,
          minimumVersion: "12",
        },
      });
      await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email);
      return true;
    } catch (err: any) {
      console.error("Send link error:", err);
      setError(getErrorMessage(err.code));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2a: Complete via deep link (call this from your app's link handler) ─
  const completeSignInFromLink = async (url: string): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, url)) return false;

    setLoading(true);
    setError(null);
    try {
      const email = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
      if (!email) {
        // Link opened on a different device — UI should prompt for email
        setError("EMAIL_NEEDED");
        return false;
      }
      await signInWithEmailLink(auth, email, url);
      await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
      return true;
    } catch (err: any) {
      console.error("Complete sign-in error:", err);
      setError(getErrorMessage(err.code));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2b: Manual paste fallback ────────────────────────────────────────
  const completeSignInManually = async (
    pastedUrl: string,
    email: string,
  ): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, pastedUrl)) {
      setError(
        "That link doesn't look right. Please paste the full URL from the email.",
      );
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithEmailLink(auth, email, pastedUrl);
      await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
      return true;
    } catch (err: any) {
      console.error("Manual sign-in error:", err);
      setError(getErrorMessage(err.code));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return {
    sendLink,
    completeSignInFromLink,
    completeSignInManually,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// ── Friendly error messages ────────────────────────────────────────────────
function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-action-code":
      return "This sign-in link is invalid or has already been used.";
    case "auth/expired-action-code":
      return "This sign-in link has expired. Please request a new one.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
