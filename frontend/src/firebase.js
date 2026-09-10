// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// ----------------------------------------------------------------------
// FIREBASE CONFIGURATION (10,000 FREE Real SMS / Month)
// Replace these with your project keys from Firebase Console:
// https://console.firebase.google.com/
// ----------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyCwXN2KJDPja6hwn9lVStu5d7e-HFAvVWU",
  authDomain: "rentyourhome-f342e.firebaseapp.com",
  projectId: "rentyourhome-f342e",
  storageBucket: "rentyourhome-f342e.firebasestorage.app",
  messagingSenderId: "210560877779",
  appId: "1:210560877779:web:22888b5409cb8846958026"
};

// Check if Firebase is already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

/**
 * Initializes Invisible reCAPTCHA verifier for phone OTP SMS dispatch
 */
export const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified successfully for real SMS dispatch.");
        },
        "expired-callback": () => {
          console.warn("reCAPTCHA expired. Please retry.");
        }
      }
    );
  }
  return window.recaptchaVerifier;
};

/**
 * Dispatches real physical SMS with a 6-digit OTP to any phone number worldwide
 * @param {string} phoneNumber E.164 formatted number (e.g. +919876543210)
 * @param {RecaptchaVerifier} appVerifier
 * @returns {Promise<ConfirmationResult>}
 */
export const sendFirebasePhoneOtp = async (phoneNumber, appVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    console.log("✅ Real Google SMS OTP dispatched to:", phoneNumber);
    return confirmationResult;
  } catch (error) {
    console.error("❌ Firebase Phone Auth Error:", error);
    throw error;
  }
};

/**
 * Opens a Google sign-in popup and returns the Firebase ID token for backend verification.
 * @returns {Promise<{ idToken: string, email: string, displayName: string }>}
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  // Force account selection even if already signed in
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    email: result.user.email,
    displayName: result.user.displayName,
  };
};
