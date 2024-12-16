import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        // Si c'est un nouvel utilisateur sans abonnement, rediriger vers la page des plans
        if (userData && userData.subscription?.status === 'pending' && !userData.subscription?.plan) {
          if (location.pathname !== '/subscription/plans') {
            window.location.href = '/subscription/plans';
          }
        }
      }
    };
    
    checkSubscription();
  }, [currentUser, location.pathname]);

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
