import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Timestamp } from 'firebase/firestore';
import { Vehicle, Rental } from '../../types';
import { getAllRentals } from '../../services/rentalService';
import { getAllVehicles } from '../../services/vehicleService';

interface RentalStats {
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topVehicles: Array<{ name: string; rentals: number }>;
  statistics: {
    totalRevenue: string;
    averageRentalDuration: string;
    totalRentals: string;
  };
  activeRentals: number;
  completedRentals: number;
  vehicleUtilization: Array<{ vehicle: string; totalDays: number; revenue: number }>;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RentalStats>({
    monthlyRevenue: [],
    topVehicles: [],
    statistics: {
      totalRevenue: '0',
      averageRentalDuration: '0',
      totalRentals: '0',
    },
    activeRentals: 0,
    completedRentals: 0,
    vehicleUtilization: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rentalsData, vehiclesData] = await Promise.all([
          getAllRentals(),
          getAllVehicles()
        ]);

        calculateStats(rentalsData, vehiclesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (rentalsData: Rental[], vehiclesData: Vehicle[]) => {
    try {
      const now = new Date();
      const activeRentals = rentalsData.filter(rental => rental.status === 'active');
      const completedRentals = rentalsData.filter(rental => rental.status === 'completed');

      // Calculate total revenue
      const totalRevenue = completedRentals.reduce((sum, rental) => sum + rental.totalCost, 0);

      // Calculate vehicle utilization
      const vehicleUtilization = vehiclesData.map(vehicle => {
        const vehicleRentals = rentalsData.filter(rental => rental.vehicleId === vehicle.id);
        const totalDays = vehicleRentals.reduce((sum, rental) => {
          const startDate = rental.startDate.toDate();
          const endDate = rental.endDate.toDate();
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);

        return {
          vehicle: `${vehicle.brand} ${vehicle.model}`,
          totalDays,
          revenue: vehicleRentals.reduce((sum, rental) => sum + rental.totalCost, 0),
        };
      });

      const revenueByMonth = new Map<string, number>();
      let totalDuration = 0;

      rentalsData.forEach((rental) => {
        const startDate = rental.startDate.toDate();
        const endDate = rental.endDate.toDate();
        const month = startDate.toLocaleString('fr-FR', { month: 'short' });
        const revenue = rental.totalCost;
        
        revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + revenue);

        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDuration += duration;
      });

      const rentalsByVehicle = new Map<string, number>();
      rentalsData.forEach((rental) => {
        rentalsByVehicle.set(rental.vehicleId, (rentalsByVehicle.get(rental.vehicleId) || 0) + 1);
      });

      const topVehicles = Array.from(rentalsByVehicle.entries())
        .map(([vehicleId, count]) => {
          const vehicle = vehiclesData.find(v => v.id === vehicleId);
          return {
            name: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule inconnu',
            rentals: count
          };
        })
        .sort((a, b) => b.rentals - a.rentals)
        .slice(0, 5);

      const monthlyRevenue = Array.from(revenueByMonth.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];
          return months.indexOf(a.month.toLowerCase()) - months.indexOf(b.month.toLowerCase());
        });

      setStats({
        monthlyRevenue,
        topVehicles,
        statistics: {
          totalRevenue: `${totalRevenue.toLocaleString('fr-FR')} DZD`,
          averageRentalDuration: `${(totalDuration / rentalsData.length || 0).toFixed(1)} jours`,
          totalRentals: rentalsData.length.toString(),
        },
        activeRentals: activeRentals.length,
        completedRentals: completedRentals.length,
        vehicleUtilization,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Rapport
      </Typography>

      <Grid container spacing={3}>
        {/* Graphique des revenus mensuels */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenus Mensuels
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} DZD`, 'Revenus']}
                  />
                  <Bar dataKey="amount" fill="#2196f3" name="Revenus" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Statistiques générales */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques Générales
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Revenu Total"
                  secondary={stats.statistics.totalRevenue}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Durée Moyenne de Location"
                  secondary={stats.statistics.averageRentalDuration}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Nombre Total de Locations"
                  secondary={stats.statistics.totalRentals}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Locations Actives"
                  secondary={stats.activeRentals.toString()}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Locations Terminées"
                  secondary={stats.completedRentals.toString()}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Véhicules les plus loués */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Véhicules les Plus Loués
            </Typography>
            <List>
              {stats.topVehicles.map((vehicle, index) => (
                <React.Fragment key={vehicle.name}>
                  <ListItem>
                    <ListItemText
                      primary={vehicle.name}
                      secondary={`${vehicle.rentals} locations`}
                    />
                  </ListItem>
                  {index < stats.topVehicles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Utilisation des véhicules */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Utilisation des Véhicules
            </Typography>
            <List>
              {stats.vehicleUtilization.map((vehicle, index) => (
                <React.Fragment key={vehicle.vehicle}>
                  <ListItem>
                    <ListItemText
                      primary={vehicle.vehicle}
                      secondary={`Jours de location: ${vehicle.totalDays}, Revenu: ${vehicle.revenue.toLocaleString('fr-FR')} DZD`}
                    />
                  </ListItem>
                  {index < stats.vehicleUtilization.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
