import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import VehicleList from './components/vehicles/VehicleList';
import CustomerList from './components/customers/CustomerList';
import RentalList from './components/rentals/RentalList';
import Reports from './components/reports/Reports';
import CashJournal from './components/CashJournal';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscription-pending" element={<SubscriptionPendingPage />} />
            
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Routes Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionPage />} />
            </Route>

            {/* Routes Utilisateur */}
            <Route element={<UserLayout />}>
              <Route path="/profile-customization" element={<ProfileCustomization />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/rentals" element={<RentalList />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/expenses" element={<ExpenseManager />} />
              <Route path="/cash-journal" element={<CashJournal />} />
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/contracts/new" element={<ContractForm />} />
              <Route path="/contracts/:id" element={<ContractPreview />} />
              <Route path="/subscription" element={<UserSubscriptionPage />} />
              <Route path="/utilities" element={<UtilitiesPage />} />
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
