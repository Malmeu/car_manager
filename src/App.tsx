import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import VehicleList from './components/vehicles/VehicleList';
import CustomerList from './components/customers/CustomerList';
import RentalList from './components/rentals/RentalList';
import Reports from './components/reports/Reports';
import Layout from './components/layout/Layout';
import Home from './components/Home';
import LocationHistory from './components/rentals/LocationHistory';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/vehicles/*" element={<Layout><VehicleList /></Layout>} />
          <Route path="/customers/*" element={<Layout><CustomerList /></Layout>} />
          <Route path="/rentals/*" element={<Layout><RentalList /></Layout>} />
          <Route path="/location-history" element={<Layout><LocationHistory /></Layout>} />
          <Route path="/reports/*" element={<Layout><Reports /></Layout>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
