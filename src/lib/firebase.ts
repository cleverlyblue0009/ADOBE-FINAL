import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-X7ffM8-eBZuUcdhSgzpRMIR32qePB1Q",
  authDomain: "adobe-20046.firebaseapp.com",
  projectId: "adobe-20046",
  storageBucket: "adobe-20046.firebasestorage.app",
  messagingSenderId: "266038965089",
  appId: "1:266038965089:web:95704a2e5e529b9d07cb20",
  measurementId: "G-D6TY2PRJRZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// LinkedIn Auth Provider
export const linkedinProvider = new OAuthProvider('linkedin.com');
linkedinProvider.addScope('r_emailaddress');
linkedinProvider.addScope('r_liteprofile');

export default app; 