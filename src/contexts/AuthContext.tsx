import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { User, signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isClient: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
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
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Vérifier si c'est un nouvel utilisateur qui n'a pas encore choisi son abonnement
        if (userData && userData.subscription?.status === 'pending' && !userData.subscription?.plan) {
          // Ne pas définir isClient pour les nouveaux utilisateurs
          setIsAdmin(false);
          setIsClient(false);
        } else {
          setIsAdmin(userData?.isAdmin || false);
          setIsClient(!userData?.isAdmin && userData?.subscription !== undefined);
        }
      } else {
        setIsAdmin(false);
        setIsClient(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAdmin,
    isClient,
    loading,
    login,
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
