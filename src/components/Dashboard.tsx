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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'rental' | 'maintenance';
}

const Dashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

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
        const rentalsQuery = query(
          collection(db, 'rentals'),
          where('userId', '==', currentUser.uid)
        );
        const rentalsSnapshot = await getDocs(rentalsQuery);
        let active = 0;
        let revenue = 0;

        rentalsSnapshot.forEach((doc) => {
          const rental = doc.data();
          
          // Vérifier la structure des dates
          const endDate = rental.endDate?.toDate?.();
          const now = new Date();
          
          if (endDate && endDate >= now) {
            active++;
          }
          
          // Utiliser directement totalCost pour le revenu
          if (typeof rental.totalCost === 'number') {
            revenue += rental.totalCost;
          }
        });

        setActiveRentals(active);
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
          <Typography variant="h4" gutterBottom>
            Bienvenue, {currentUser?.email}
          </Typography>
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
            title="Revenus Totaux"
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
