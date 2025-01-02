import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { User, UserCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithGoogle, loginWithEmailPassword, registerWithEmailPassword, logOut } from '../firebase/auth';
import { isTwoFactorEnabled } from '../services/twoFactorService';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isClient: boolean;
  loading: boolean;
  twoFactorEnabled: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  register: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential: UserCredential = await loginWithEmailPassword(email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      setIsAdmin(userData?.isAdmin || false);
      setIsClient(!userData?.isAdmin && userData?.subscription !== undefined);
      
      return userCredential;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<UserCredential> => {
    try {
      const userCredential: UserCredential = await signInWithGoogle();
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      setIsAdmin(userData?.isAdmin || false);
      setIsClient(!userData?.isAdmin && userData?.subscription !== undefined);
      
      return userCredential;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential: UserCredential = await registerWithEmailPassword(email, password);
      setIsAdmin(false);
      setIsClient(false);
      return userCredential;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logOut();
      setCurrentUser(null);
      setIsAdmin(false);
      setIsClient(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user); // Mettre à jour currentUser immédiatement
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData && userData.subscription?.status === 'pending' && !userData.subscription?.plan) {
            setIsAdmin(false);
            setIsClient(false);
          } else {
            setIsAdmin(userData?.isAdmin || false);
            setIsClient(!userData?.isAdmin && userData?.subscription !== undefined);
          }

          // Vérifier si la 2FA est activée
          const has2FA = await isTwoFactorEnabled(user.uid);
          setTwoFactorEnabled(has2FA);
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          setIsAdmin(false);
          setIsClient(false);
          setTwoFactorEnabled(false);
        }
      } else {
        setIsAdmin(false);
        setIsClient(false);
        setTwoFactorEnabled(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAdmin,
    isClient,
    loading,
    twoFactorEnabled,
    login,
    loginWithGoogle,
    register,
    logout
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
