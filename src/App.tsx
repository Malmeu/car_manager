import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import VehicleList from './components/vehicles/VehicleList';
import CustomerList from './components/customers/CustomerList';
import RentalList from './components/rentals/RentalList';
import Reports from './components/reports/Reports';
import Layout from './components/layout/Layout';
import LocationHistory from './components/rentals/LocationHistory';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import { auth } from './config/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return null; // ou un composant de chargement
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Pages protégées */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/vehicles/*" element={
            <ProtectedRoute>
              <Layout><VehicleList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/customers/*" element={
            <ProtectedRoute>
              <Layout><CustomerList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/rentals/*" element={
            <ProtectedRoute>
              <Layout><RentalList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/location-history" element={
            <ProtectedRoute>
              <Layout><LocationHistory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports/*" element={
            <ProtectedRoute>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
