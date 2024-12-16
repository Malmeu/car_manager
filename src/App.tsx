import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import DashboardWrapper from './components/DashboardWrapper';
import VehicleList from './components/vehicles/VehicleList';
import VehicleTrackingWrapper from './components/vehicles/VehicleTrackingWrapper';
import CustomerList from './components/customers/CustomerList';
import RentalList from './components/rentals/RentalList';
import Reports from './components/reports/Reports';
import CashJournal from './components/CashJournal';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminSubscriptionPage from './pages/AdminSubscriptionPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import SubscriptionPendingPage from './pages/SubscriptionPendingPage';
import ExpenseManager from './components/ExpenseManager';
import ContractForm from './components/contracts/ContractForm';
import ContractList from './components/contracts/ContractList';
import ContractPreview from './components/contracts/ContractPreview';
import UserSubscriptionPage from './pages/UserSubscriptionPage';
import UtilitiesPage from './pages/UtilitiesPage';
import ProfileCustomization from './components/profile/ProfileCustomization';
import GuidePage from './pages/GuidePage';
import GuideArticlePage from './pages/GuideArticlePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

const UserLayout = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
};

const AdminProtectedRoute = () => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const DefaultRedirect = () => {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? "/dashboard" : "/"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscription/pending" element={<SubscriptionPendingPage />} />
            
            {/* Routes protégées utilisateur */}
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/vehicles/:id/tracking" element={<VehicleTrackingWrapper />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/rentals" element={<RentalList />} />
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/contracts/new" element={<ContractForm />} />
              <Route path="/contracts/:id" element={<ContractPreview />} />
              <Route path="/expenses" element={<ExpenseManager />} />
              <Route path="/cash-journal" element={<CashJournal />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/subscription" element={<UserSubscriptionPage />} />
              <Route path="/utilities" element={<UtilitiesPage />} />
              <Route path="/profile" element={<ProfileCustomization />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/guide/:articleId" element={<GuideArticlePage />} />
            </Route>

            {/* Routes protégées admin */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptionPage />} />
                <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>

            {/* Redirection par défaut */}
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
