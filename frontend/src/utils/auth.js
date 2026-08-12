import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB83mdTxCO_WzeKrKINC6xJzm8dVb-OYbQ",
  authDomain: "pipewise-ai.firebaseapp.com",
  projectId: "pipewise-ai",
  storageBucket: "pipewise-ai.firebasestorage.app",
  messagingSenderId: "979880944794",
  appId: "1:979880944794:web:4a1b066e476c9cbda92b23",
  measurementId: "G-WGHTM1SGD4"
};

let app;
let auth;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Analytics can sometimes fail if extensions block it, so we wrap it in a try-catch or just initialize it safely
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase Authentication is not initialized.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Google login error", error);
    throw error;
  }
};

export const signInWithGithub = async () => {
  if (!auth) {
    throw new Error("Firebase Authentication is not initialized.");
  }
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return result;
  } catch (error) {
    console.error("GitHub login error", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  return signOut(auth);
};

export { auth, analytics };
