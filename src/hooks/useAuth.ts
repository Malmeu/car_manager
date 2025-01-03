import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    currentUser: null,
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Vérifier si l'utilisateur est admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdmin = userDoc.exists() ? userDoc.data()?.isAdmin || false : false;
        
        setState({
          currentUser: user,
          loading: false,
          isAdmin
        });
      } else {
        setState({
          currentUser: null,
          loading: false,
          isAdmin: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
};
