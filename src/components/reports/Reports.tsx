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
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(145deg, #1a237e 0%, #0d47a1 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 'bold' }}>
        Tableau de Bord
      </Typography>

      <Grid container spacing={3}>
        {/* Cartes des statistiques principales */}
        <Grid item xs={12} md={3}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoneyIcon sx={{ fontSize: 40, mr: 2, color: '#4fc3f7' }} />
              <Box>
                <Typography variant="h6" sx={{ color: '#4fc3f7' }}>Revenu Total</Typography>
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
                  backgroundColor: '#4fc3f7'
                }
              }} 
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimelineIcon sx={{ fontSize: 40, mr: 2, color: '#81c784' }} />
              <Box>
                <Typography variant="h6" sx={{ color: '#81c784' }}>Durée Moyenne</Typography>
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
                  backgroundColor: '#81c784'
                }
              }} 
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CarIcon sx={{ fontSize: 40, mr: 2, color: '#ba68c8' }} />
              <Box>
                <Typography variant="h6" sx={{ color: '#ba68c8' }}>Locations Actives</Typography>
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
                  backgroundColor: '#ba68c8'
                }
              }} 
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SpeedIcon sx={{ fontSize: 40, mr: 2, color: '#ff8a65' }} />
              <Box>
                <Typography variant="h6" sx={{ color: '#ff8a65' }}>Total Locations</Typography>
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
                  backgroundColor: '#ff8a65'
                }
              }} 
            />
          </Paper>
        </Grid>

        {/* Graphique des revenus mensuels */}
        <Grid item xs={12} md={8}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              Revenus Mensuels
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} DZD`, 'Revenus']}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="amount" fill="#4fc3f7" name="Revenus" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Graphique des véhicules les plus loués */}
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            height: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
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
                    fill="#8884d8"
                  >
                    {stats.topVehicles.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4fc3f7', '#81c784', '#ba68c8', '#ff8a65', '#ffb74d'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} locations`, '']}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Utilisation des véhicules */}
        <Grid item xs={12}>
          <Paper sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              Utilisation des Véhicules
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="10%" 
                  outerRadius="80%" 
                  data={stats.vehicleUtilization.map((item, index) => ({
                    name: item.vehicle,
                    utilization: Math.round((item.totalDays / 365) * 100),
                    fill: ['#4fc3f7', '#81c784', '#ba68c8', '#ff8a65', '#ffb74d'][index % 5]
                  }))}
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar
                    background
                    dataKey="utilization"
                    label={{
                      position: 'insideStart',
                      fill: '#fff',
                    }}
                    cornerRadius={10}
                    stackId="stack"
                  />
                  <Legend
                    iconSize={10}
                    width={120}
                    height={140}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      color: '#fff'
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}% d'utilisation`, '']}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
