import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import VehicleList from './components/vehicles/VehicleList';
import CustomerList from './components/customers/CustomerList';
import RentalList from './components/rentals/RentalList';
import Reports from './components/reports/Reports';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminSubscriptionPage from './pages/AdminSubscriptionPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import SubscriptionPendingPage from './pages/SubscriptionPendingPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const AdminLayout = () => {
  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
};

const UserLayout = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscription-pending" element={<SubscriptionPendingPage />} />
            
            {/* Routes Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionPage />} />
            </Route>

            {/* Routes Utilisateur */}
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/rentals" element={<RentalList />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
