import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  db: Firestore;
  isFirebaseActive: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, initialProfile?: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    }
  };

  const signup = async (email: string, pass: string, initialProfile?: Partial<UserProfile>) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (initialProfile && cred.user) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...initialProfile,
          email: cred.user.email,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e: any) {
      setError(e.message || 'Signup failed');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.warn('Signout error', e);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        error,
        db,
        isFirebaseActive: true,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used within FirebaseProvider');
  return ctx;
};
