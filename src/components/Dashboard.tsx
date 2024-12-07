import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  useTheme,
} from '@mui/material';
import Calendar from './Calendar';
import StatCard from './StatCard';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'rental' | 'maintenance';
}

interface Rental {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalCost: number;
  withDriver: boolean;
  driverCost: number;
}

const Dashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const companyName = localStorage.getItem('companyName') || 'Votre Entreprise';

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.uid) {
        console.log('No current user UID');
        return;
      }

      try {
        // Fetch total vehicles
        const vehiclesQuery = query(
          collection(db, 'vehicles'),
          where('userId', '==', currentUser.uid)
        );
        const vehiclesSnapshot = await getDocs(vehiclesQuery);
        setTotalVehicles(vehiclesSnapshot.size);

        // Fetch total clients - Utilisation de la collection 'customers'
        const customersQuery = query(
          collection(db, 'customers'),
          where('userId', '==', currentUser.uid)
        );
        const customersSnapshot = await getDocs(customersQuery);
        setTotalClients(customersSnapshot.size);

        // Fetch active rentals and calculate revenue
        const rentalsSnapshot = await getDocs(
          query(collection(db, 'rentals'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'active')
          )
        );
        
        let revenue = 0;
        const activeRentalsData = rentalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Rental));
        setActiveRentals(activeRentalsData.length);
        
        // Calculate total revenue including driver cost
        for (const rental of activeRentalsData) {
          const rentalDays = Math.ceil(
            (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
          );
          const baseRevenue = rental.totalCost;
          const driverRevenue = rental.withDriver ? (rental.driverCost * rentalDays) : 0;
          revenue += baseRevenue + driverRevenue;
        }
        
        setTotalRevenue(revenue);
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
            <Typography variant="h5" gutterBottom>
              Bienvenue, {companyName}
            </Typography>
          </Paper>
        </Grid>

        {/* Statistiques */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Véhicules Totaux"
            value={totalVehicles}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clients Totaux"
            value={totalClients}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Locations Actives"
            value={activeRentals}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenus En cours"
            value={`${totalRevenue.toLocaleString()} DZD`}
            color={theme.palette.info.main}
          />
        </Grid>

        {/* Calendrier */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Calendar />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
