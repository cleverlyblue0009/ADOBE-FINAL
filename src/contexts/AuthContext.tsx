import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, linkedinProvider } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  isGuestMode: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  enterGuestMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = "There was an error signing in with Google. Please try again.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google sign-in. Please contact support.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked. Please allow pop-ups for this site.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      await signInWithPopup(auth, linkedinProvider);
    } catch (error: any) {
      console.error('LinkedIn sign-in error:', error);
      let errorMessage = "There was an error signing in with LinkedIn. Please try again.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for LinkedIn sign-in. Please contact support.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked. Please allow pop-ups for this site.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await signOut(auth);
      }
      setIsGuestMode(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const enterGuestMode = () => {
    setIsGuestMode(true);
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    isGuestMode,
    loading,
    signInWithGoogle,
    signInWithLinkedIn,
    enterGuestMode,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 