import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Rediriger vers le dashboard si l'utilisateur n'est pas admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
