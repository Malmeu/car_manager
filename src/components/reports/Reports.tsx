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
  MonetizationOn as MonetizationOnIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import { Vehicle, RentalType } from '../../types';
import { getAllRentals } from '../../services/rentalService';
import { getAllVehicles } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Stats {
  totalRentals: number;
  totalRevenue: number;
  averageRentalDuration: number;
  vehicleUtilization: { [key: string]: number };
  monthlyRevenue: { [key: string]: number };
  mostProfitableVehicle: { name: string; revenue: number } | null;
  topRentedVehicles: Array<{ name: string; count: number }>;
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
  const [rentals, setRentals] = useState<RentalType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRentals: 0,
    totalRevenue: 0,
    averageRentalDuration: 0,
    vehicleUtilization: {},
    monthlyRevenue: {},
    mostProfitableVehicle: null,
    topRentedVehicles: []
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
        getAllVehicles(currentUser.uid)
      ]);

      const formattedRentals = rentalsData.map(rental => ({
        ...rental,
        additionalFees: rental.additionalFees || { description: '', amount: 0 },
        startDate: rental.startDate instanceof Timestamp ? rental.startDate : Timestamp.fromDate(rental.startDate),
        endDate: rental.endDate instanceof Timestamp ? rental.endDate : Timestamp.fromDate(rental.endDate)
      })) as RentalType[];

      setRentals(formattedRentals);
      setVehicles(vehiclesData);
      calculateStats(formattedRentals, vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (rentalsData: RentalType[], vehiclesData: Vehicle[]) => {
    try {
      let totalRevenue = 0;
      let currentMonthRevenue = 0;
      let unpaidAmount = 0;
      let activeRentals = 0;
      const now = new Date();
      const monthlyRevenueMap = new Map<string, number>();
      const vehicleRentalsMap = new Map<string, number>();
      const vehicleUtilization: Array<{ vehicleId: string; utilization: number }> = [];

      // Initialiser les compteurs pour chaque véhicule
      vehiclesData.forEach(vehicle => {
        if (vehicle.id) {
          vehicleRentalsMap.set(vehicle.id, 0);
        }
      });

      rentalsData.forEach(rental => {
        const startDate = rental.startDate.toDate();
        const endDate = rental.endDate.toDate();
        const vehicle = vehiclesData.find(v => v.id === rental.vehicleId);

        if (vehicle) {
          // Compter le nombre de locations par véhicule
          const currentCount = vehicleRentalsMap.get(rental.vehicleId) || 0;
          vehicleRentalsMap.set(rental.vehicleId, currentCount + 1);
        }

        // Calculer le total des revenus
        totalRevenue += rental.paidAmount || 0;

        // Calculer les revenus mensuels
        const monthYear = format(startDate, 'MM/yyyy');
        const currentMonthlyRevenue = monthlyRevenueMap.get(monthYear) || 0;
        monthlyRevenueMap.set(monthYear, currentMonthlyRevenue + (rental.paidAmount || 0));

        // Calculer les jours d'utilisation
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const existingUtilization = vehicleUtilization.find(vu => vu.vehicleId === rental.vehicleId);
        if (existingUtilization) {
          existingUtilization.utilization += days;
        } else {
          vehicleUtilization.push({ vehicleId: rental.vehicleId, utilization: days });
        }

        // Calculer le montant impayé
        const unpaid = (rental.totalCost || 0) - (rental.paidAmount || 0);
        if (unpaid > 0) {
          unpaidAmount += unpaid;
        }

        // Calculer les locations actives
        if (startDate <= now && endDate >= now) {
          activeRentals++;
        }
      });

      // Convertir les données pour les véhicules les plus loués
      const topRentedVehicles = Array.from(vehicleRentalsMap.entries())
        .map(([vehicleId, count]) => {
          const vehicle = vehiclesData.find(v => v.id === vehicleId);
          return {
            name: vehicle ? `${vehicle.brand} ${vehicle.model}` : vehicleId,
            count: count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculer le véhicule le plus rentable
      const vehicleRevenue = new Map<string, number>();
      rentalsData.forEach(rental => {
        const currentRevenue = vehicleRevenue.get(rental.vehicleId) || 0;
        vehicleRevenue.set(rental.vehicleId, currentRevenue + (rental.paidAmount || 0));
      });

      const mostProfitableVehicle = Array.from(vehicleRevenue.entries())
        .map(([vehicleId, revenue]) => {
          const vehicle = vehiclesData.find(v => v.id === vehicleId);
          return {
            name: vehicle ? `${vehicle.brand} ${vehicle.model}` : vehicleId,
            revenue: revenue
          };
        })
        .sort((a, b) => b.revenue - a.revenue)[0];

      setStats({
        totalRentals: rentalsData.length,
        totalRevenue,
        averageRentalDuration: vehicleUtilization.reduce((acc, curr) => acc + curr.utilization, 0) / rentalsData.length,
        vehicleUtilization: vehicleUtilization.reduce((acc, curr) => ({ ...acc, [curr.vehicleId]: curr.utilization }), {}),
        monthlyRevenue: Object.fromEntries(monthlyRevenueMap),
        mostProfitableVehicle,
        topRentedVehicles
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

        const revenue = vehicleRentals.reduce((sum, rental) => sum + rental.totalCost + (rental.additionalFees?.amount || 0), 0);
        const expenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        console.log('Total revenue:', revenue);
        console.log('Total expenses:', expenses);

        const transactions = [
          ...vehicleRentals.map(rental => ({
            date: rental.startDate.toDate(),
            type: 'revenue' as const,
            amount: rental.totalCost + (rental.additionalFees?.amount || 0),
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

  const VehicleUtilizationChart = () => {
    const data = Object.entries(stats.vehicleUtilization).map(([vehicleId, days]) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      return {
        name: vehicle ? `${vehicle.brand} ${vehicle.model}` : vehicleId,
        days: days
      };
    }).sort((a, b) => b.days - a.days);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Utilisation des Véhicules
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Jours d\'utilisation', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="days" fill="#3f51b5" name="Jours d'utilisation" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
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
                  <Typography variant="h4">{stats.totalRevenue.toLocaleString('fr-FR')} DZD</Typography>
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
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                    Durée Moyenne de Location
                  </Typography>
                  <Typography variant="h4">
                    {stats.averageRentalDuration.toFixed(2)} jours
                  </Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MonetizationOnIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
                  Véhicule le Plus Rentable
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                {stats.mostProfitableVehicle?.name}
              </Typography>
              {stats.mostProfitableVehicle && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {stats.mostProfitableVehicle.revenue.toLocaleString('fr-FR')} DZD
                </Typography>
              )}
              <LinearProgress 
                variant="determinate" 
                value={0}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.action.disabledBackground,
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
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Véhicule le Plus Loué</Typography>
                  <Typography variant="h4">
                    {stats.topRentedVehicles[0]?.name}
                  </Typography>
                  {stats.topRentedVehicles[0] && (
                    <Typography variant="subtitle2" color="text.secondary">
                      {stats.topRentedVehicles[0].count} locations
                    </Typography>
                  )}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={0} 
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
                  <BarChart data={Object.keys(stats.monthlyRevenue).map(key => ({ month: key, amount: stats.monthlyRevenue[key] }))}>
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
                      data={stats.topRentedVehicles}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                    >
                      {stats.topRentedVehicles.map((entry, index) => (
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
            <VehicleUtilizationChart />
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
