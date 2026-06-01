import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

export { db, auth };
export default app;
