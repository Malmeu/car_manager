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
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import {
  Speed as SpeedIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import { Vehicle, Rental } from '../../types';
import { getAllRentals } from '../../services/rentalService';
import { getAllVehicles } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';

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
  const { currentUser } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
  const theme = useTheme();

  useEffect(() => {
    if (!currentUser?.uid) return;
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const [rentalsData, vehiclesData] = await Promise.all([
        getAllRentals(currentUser.uid),
        getAllVehicles(currentUser.uid),
      ]);
      setRentals(rentalsData);
      setVehicles(vehiclesData);
      calculateStats(rentalsData, vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" sx={{ mb: 4, color: theme.palette.primary.main }}>
        Tableau de bord des rapports
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {/* Cards */}
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.primary.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ fontSize: 40, mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Revenu Total</Typography>
                  <Typography variant="h4">{stats.statistics.totalRevenue}</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={70} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.primary.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ fontSize: 40, mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Durée Moyenne</Typography>
                  <Typography variant="h4">{stats.statistics.averageRentalDuration}</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={85} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.primary.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CarIcon sx={{ fontSize: 40, mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Locations Actives</Typography>
                  <Typography variant="h4">{stats.activeRentals}</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={60} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }} 
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.primary.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ fontSize: 40, mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Total Locations</Typography>
                  <Typography variant="h4">{stats.statistics.totalRentals}</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={75} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }} 
              />
            </Paper>
          </Grid>

          {/* Monthly Revenue Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{
              p: 3,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.primary.light}`,
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Revenus Mensuels
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.primary.light} />
                    <XAxis 
                      dataKey="month" 
                      stroke={theme.palette.text.primary}
                    />
                    <YAxis 
                      stroke={theme.palette.text.primary}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.primary.light}`
                      }}
                    />
                    <Bar dataKey="amount" fill={theme.palette.primary.main} name="Revenus" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Top Vehicles Chart */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 3,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.primary.light}`,
              height: '100%'
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Top Véhicules
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topVehicles}
                      dataKey="rentals"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                    >
                      {stats.topVehicles.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            theme.palette.primary.main,
                            theme.palette.primary.light,
                            theme.palette.secondary.main,
                            theme.palette.secondary.light,
                            theme.palette.primary.dark
                          ][index % 5]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.primary.light}`
                      }}
                    />
                    <Legend 
                      formatter={(value) => (
                        <span style={{ color: theme.palette.text.primary }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Vehicle Utilization Chart */}
          <Grid item xs={12}>
            <Paper sx={{
              p: 3,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.primary.light}`,
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Utilisation des Véhicules
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.vehicleUtilization}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.primary.light} />
                    <XAxis 
                      type="number"
                      stroke={theme.palette.text.primary}
                    />
                    <YAxis 
                      dataKey="vehicle" 
                      type="category"
                      stroke={theme.palette.text.primary}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.primary.light}`
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: theme.palette.text.primary }}>{value}</span>
                      )}
                    />
                    <Bar 
                      dataKey="totalDays" 
                      fill={theme.palette.primary.main}
                      name="Jours d'utilisation"
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill={theme.palette.secondary.main}
                      name="Revenus (DZD)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
