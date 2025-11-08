// Firebase: Custom hook for authentication state management
import { auth } from '@/src/lib/firebase';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase: Subscribe to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Firebase: Login with email and password
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  // Firebase: Sign up with email and password
  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  // Firebase: Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Firebase: Send password reset email
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Firebase: Update user profile
  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    try {
      if (user) {
        await updateProfile(user, { displayName, photoURL });
        return { error: null };
      }
      return { error: 'No user logged in' };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Firebase: Change password
  const changePassword = async (newPassword: string) => {
    try {
      if (user) {
        await updatePassword(user, newPassword);
        return { error: null };
      }
      return { error: 'No user logged in' };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
  };
};
