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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
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
  Print as PrintIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import { Vehicle, Rental } from '../../types';
import { getAllRentals } from '../../services/rentalService';
import { getAllVehicles } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

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

interface DetailedReport {
  vehicleId: string;
  vehicleName: string;
  revenue: number;
  expenses: number;
  totalRentals: number;
  transactions: Array<{
    date: Date;
    type: 'revenue' | 'expense';
    amount: number;
    description: string;
  }>;
}

interface VehicleExpense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  vehicleId: string;
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
  const [isAnnualReport, setIsAnnualReport] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const [reportType, setReportType] = useState<('revenue' | 'expense')[]>(['revenue', 'expense']);
  const [detailedReport, setDetailedReport] = useState<DetailedReport[]>([]);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
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
      const totalRevenue = completedRentals.reduce((sum, rental) => {
        const rentalDays = Math.ceil(
          (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
        );
        const baseRevenue = rental.totalCost;
        const driverRevenue = rental.withDriver ? (rental.driverCost * rentalDays) : 0;
        return sum + baseRevenue + driverRevenue;
      }, 0);

      // Calculate vehicle utilization
      const vehicleUtilization = vehiclesData.map(vehicle => {
        const vehicleRentals = completedRentals.filter(rental => rental.vehicleId === vehicle.id);
        const totalDays = vehicleRentals.reduce((sum, rental) => {
          return sum + Math.ceil(
            (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
          );
        }, 0);

        const revenue = vehicleRentals.reduce((sum, rental) => {
          const rentalDays = Math.ceil(
            (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
          );
          const baseRevenue = rental.totalCost;
          const driverRevenue = rental.withDriver ? (rental.driverCost * rentalDays) : 0;
          return sum + baseRevenue + driverRevenue;
        }, 0);

        return {
          vehicle: `${vehicle.brand} ${vehicle.model}`,
          totalDays,
          revenue
        };
      });

      const revenueByMonth = new Map<string, number>();
      completedRentals.forEach(rental => {
        const dateFormat = isAnnualReport ? 'yyyy' : 'MMMM yyyy';
        const period = format(rental.startDate.toDate(), dateFormat);
        const rentalDays = Math.ceil(
          (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
        );
        const baseRevenue = rental.totalCost;
        const driverRevenue = rental.withDriver ? (rental.driverCost * rentalDays) : 0;
        const totalRevenue = baseRevenue + driverRevenue;
        
        revenueByMonth.set(period, (revenueByMonth.get(period) || 0) + totalRevenue);
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
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          return months.indexOf(a.month.split(' ')[0]) - months.indexOf(b.month.split(' ')[0]);
        });

      setStats({
        monthlyRevenue,
        topVehicles,
        statistics: {
          totalRevenue: `${totalRevenue.toLocaleString('fr-FR')} DZD`,
          averageRentalDuration: `${(completedRentals.reduce((sum, rental) => sum + Math.ceil(
            (rental.endDate.toDate().getTime() - rental.startDate.toDate().getTime()) / (1000 * 3600 * 24)
          ), 0) / completedRentals.length || 0).toFixed(1)} jours`,
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

  const generateDetailedReport = async () => {
    setShowDetailedReport(true);
    const reports: DetailedReport[] = [];
    
    const selectedVehiclesList = vehicles.filter(v => 
      v.id && (selectedVehicles.length === 0 || selectedVehicles.includes(v.id))
    );

    for (const vehicle of selectedVehiclesList) {
      // Récupérer les locations
      const vehicleRentals = rentals.filter(r => 
        r.vehicleId === vehicle.id &&
        r.startDate.toDate() >= dateRange.start &&
        r.startDate.toDate() <= dateRange.end
      );

      console.log('Processing vehicle:', vehicle.brand, vehicle.model);

      // Récupérer les frais véhicule
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('carId', '==', vehicle.id),
        where('userId', '==', currentUser?.uid)
      );

      try {
        const expensesSnapshot = await getDocs(expensesQuery);
        console.log('Expenses found:', expensesSnapshot.size);
        
        const vehicleExpenses = expensesSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Expense data:', data);
          return {
            id: doc.id,
            description: data.name || 'Frais véhicule',
            amount: Number(data.amount),
            date: data.date.toDate(),
            vehicleId: data.carId
          } as VehicleExpense;
        });

        const filteredExpenses = vehicleExpenses.filter(expense => {
          const isInRange = expense.date >= dateRange.start && expense.date <= dateRange.end;
          console.log('Expense in range:', isInRange, expense);
          return isInRange;
        });

        console.log('Filtered expenses:', filteredExpenses);

        const revenue = vehicleRentals.reduce((sum, rental) => sum + rental.totalCost, 0);
        const expenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        console.log('Total revenue:', revenue);
        console.log('Total expenses:', expenses);

        const transactions = [
          ...vehicleRentals.map(rental => ({
            date: rental.startDate.toDate(),
            type: 'revenue' as const,
            amount: rental.totalCost,
            description: `Location du ${format(rental.startDate.toDate(), 'dd/MM/yyyy')} au ${format(rental.endDate.toDate(), 'dd/MM/yyyy')}`,
          })),
          ...filteredExpenses.map(expense => ({
            date: expense.date,
            type: 'expense' as const,
            amount: expense.amount,
            description: expense.description,
          })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        reports.push({
          vehicleId: vehicle.id ?? '',
          vehicleName: vehicle.brand + ' ' + vehicle.model,
          revenue,
          expenses,
          totalRentals: vehicleRentals.length,
          transactions,
        });
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    }

    setDetailedReport(reports);
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <style>
        @media print {
          table { 
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
          }
          th, td { 
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .revenue { color: #2e7d32; }
          .expense { color: #d32f2f; }
          .total-row {
            background-color: #f5f5f5;
            font-weight: bold;
          }
        }
      </style>
      <h2>Rapport Détaillé - ${format(dateRange.start, 'dd/MM/yyyy')} au ${format(dateRange.end, 'dd/MM/yyyy')}</h2>
      <table>
        <thead>
          <tr>
            <th>Véhicule</th>
            ${reportType.includes('revenue') ? '<th>Revenus</th>' : ''}
            ${reportType.includes('expense') ? '<th>Dépenses</th>' : ''}
            <th>Total Locations</th>
          </tr>
        </thead>
        <tbody>
          ${detailedReport.map(report => `
            <tr>
              <td>${report.vehicleName}</td>
              ${reportType.includes('revenue') ? 
                `<td class="revenue">${report.revenue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'DZD',
                  maximumFractionDigits: 0 
                })}</td>` : ''
              }
              ${reportType.includes('expense') ? 
                `<td class="expense">${report.expenses.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'DZD',
                  maximumFractionDigits: 0 
                })}</td>` : ''
              }
              <td>${report.totalRentals}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>Total</td>
            ${reportType.includes('revenue') ? 
              `<td class="revenue">${detailedReport
                .reduce((sum, report) => sum + report.revenue, 0)
                .toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'DZD',
                  maximumFractionDigits: 0 
                })}</td>` : ''
            }
            ${reportType.includes('expense') ? 
              `<td class="expense">${detailedReport
                .reduce((sum, report) => sum + report.expenses, 0)
                .toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'DZD',
                  maximumFractionDigits: 0 
                })}</td>` : ''
            }
            <td>${detailedReport.reduce((sum, report) => sum + report.totalRentals, 0)}</td>
          </tr>
        </tbody>
      </table>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Véhicule', 'Revenus', 'Dépenses', 'Total Locations'],
      ...detailedReport.map(report => [
        report.vehicleName,
        report.revenue.toString(),
        report.expenses.toString(),
        report.totalRentals.toString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${format(dateRange.start, 'dd-MM-yyyy')}_${format(dateRange.end, 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
          Tableau de bord des rapports
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isAnnualReport}
              onChange={(e) => {
                setIsAnnualReport(e.target.checked);
                calculateStats(rentals, vehicles);
              }}
              color="primary"
            />
          }
          label={isAnnualReport ? "Rapport Annuel" : "Rapport Mensuel"}
        />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
        Revenus {isAnnualReport ? "Annuel" : "Mensuel"}
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
                Revenus {isAnnualReport ? "Annuel" : "Mensuel"}
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

          {/* Section Rapport Détaillé */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 4,
                mt: 3,
                borderRadius: 2,
                boxShadow: theme => theme.shadows[3]
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme => theme.palette.primary.main }}>
                  Rapport Détaillé
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Générez un rapport personnalisé en sélectionnant les véhicules et la période souhaitée
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {/* Sélection des véhicules */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="vehicle-select-label">Sélectionner les véhicules</InputLabel>
                    <Select
                      labelId="vehicle-select-label"
                      multiple
                      value={selectedVehicles}
                      onChange={(e) => setSelectedVehicles(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={vehicles.find(v => v.id === value)?.brand + ' ' + 
                                    vehicles.find(v => v.id === value)?.model}
                              sx={{ 
                                backgroundColor: theme => theme.palette.primary.main,
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      sx={{ minWidth: 200 }}
                    >
                      {vehicles
                        .filter(v => v.id && v.brand && v.model)
                        .map((vehicle) => (
                          <MenuItem key={vehicle.id} value={vehicle.id}>
                            <Checkbox 
                              checked={vehicle.id ? selectedVehicles.includes(vehicle.id) : false} 
                            />
                            <ListItemText 
                              primary={vehicle.brand && vehicle.model ? 
                                `${vehicle.brand} ${vehicle.model}` : 
                                'Véhicule sans nom'
                              } 
                            />
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sélection de la période */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Date de début"
                      type="date"
                      value={format(dateRange.start, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{ bgcolor: 'background.paper' }}
                    />
                    <TextField
                      label="Date de fin"
                      type="date"
                      value={format(dateRange.end, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Box>
                </Grid>

                {/* Type de données */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Type de données
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportType.includes('revenue')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportType(prev => [...prev, 'revenue']);
                            } else {
                              setReportType(prev => prev.filter(t => t !== 'revenue'));
                            }
                          }}
                          color="primary"
                        />
                      }
                      label="Revenus"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportType.includes('expense')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportType(prev => [...prev, 'expense']);
                            } else {
                              setReportType(prev => prev.filter(t => t !== 'expense'));
                            }
                          }}
                          color="primary"
                        />
                      }
                      label="Dépenses"
                    />
                  </Box>
                </Grid>

                {/* Boutons d'action */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={generateDetailedReport}
                      startIcon={<AssessmentIcon />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Générer le rapport
                    </Button>
                    {showDetailedReport && (
                      <>
                        <IconButton 
                          onClick={handlePrint}
                          sx={{ 
                            bgcolor: 'action.selected',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton 
                          onClick={handleExport}
                          sx={{ 
                            bgcolor: 'action.selected',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <GetAppIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Tableau de résultats */}
              {showDetailedReport && (
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    mt: 4,
                    borderRadius: 2,
                    boxShadow: theme => theme.shadows[2]
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>Véhicule</TableCell>
                        {reportType.includes('revenue') && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>Revenus</TableCell>
                        )}
                        {reportType.includes('expense') && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>Dépenses</TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>Total Locations</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailedReport.map((report) => (
                        <TableRow 
                          key={report.vehicleId}
                          sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                        >
                          <TableCell>{report.vehicleName}</TableCell>
                          {reportType.includes('revenue') && (
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                              {report.revenue.toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'DZD',
                                maximumFractionDigits: 0 
                              })}
                            </TableCell>
                          )}
                          {reportType.includes('expense') && (
                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                              {report.expenses.toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'DZD',
                                maximumFractionDigits: 0 
                              })}
                            </TableCell>
                          )}
                          <TableCell align="right">{report.totalRentals}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        {reportType.includes('revenue') && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {detailedReport
                              .reduce((sum, report) => sum + report.revenue, 0)
                              .toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'DZD',
                                maximumFractionDigits: 0 
                              })}
                          </TableCell>
                        )}
                        {reportType.includes('expense') && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {detailedReport
                              .reduce((sum, report) => sum + report.expenses, 0)
                              .toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'DZD',
                                maximumFractionDigits: 0 
                              })}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {detailedReport.reduce((sum, report) => sum + report.totalRentals, 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
