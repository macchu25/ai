import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAAOhmuyN6Ef3G4FxQKTld4oPnpF_NgsH0",
  authDomain: "casos-88d40.firebaseapp.com",
  projectId: "casos-88d40",
  storageBucket: "casos-88d40.firebasestorage.app",
  messagingSenderId: "998553218979",
  appId: "1:998553218979:web:15eb12b248aba3289bf416",
  measurementId: "G-4DGK3GEQZE"
};

// Tránh khởi tạo lại khi Next.js Hot Reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
