// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "REACT_APP_FIREBASE_API_KEY",
  authDomain: "REACT_APP_FIREBASE_AUTH_DOMAIN",
  projectId: "REACT_APP_FIREBASE_PROJECT_ID",
  storageBucket: "REACT_APP_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REACT_APP_FIREBASE_APP_ID",
  measurementId: "REACT_APP_FIREBASE_MEASUREMENTID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("This email is already registered. Please use email/password to login.");
    }
    throw error;
  }
}
// Register with email/password
export async function registerWithEmail(name, email, password) {
  try {
    // Check if email already exists
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error("This email is already registered. Please login instead.");
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Save the name to profile
    await updateProfile(result.user, { displayName: name });
    return result.user.reload();
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already registered. Please login instead.");
    }
    throw error;
  }
}

// Login with email/password
export async function loginWithEmail(email, password) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    await result.user.reload();
    return result.user;
  } catch (error) {
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      throw new Error("These credentials are not registered. Please register first.");  // 👈
    }
    if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address.");
    }
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
}