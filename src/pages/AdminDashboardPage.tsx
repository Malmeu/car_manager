import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  trialSubscriptions: number;
  revenueThisMonth: number;
  percentageChange: number;
}

interface RecentActivity {
  id: string;
  type: 'subscription' | 'user' | 'payment';
  message: string;
  date: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    trialSubscriptions: 0,
    revenueThisMonth: 0,
    percentageChange: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques des utilisateurs
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;

      // Charger les statistiques des abonnements
      const subscriptionsRef = collection(db, 'subscriptions');
      const [activeSnapshot, pendingSnapshot, trialSnapshot] = await Promise.all([
        getDocs(query(subscriptionsRef, where('status', '==', 'active'))),
        getDocs(query(subscriptionsRef, where('status', '==', 'pending'))),
        getDocs(query(subscriptionsRef, where('status', '==', 'trial')))
      ]);

      // Calculer le revenu du mois en cours
      const calculateMonthlyRevenue = async () => {
        try {
          const paymentsRef = collection(db, 'payments');
          
          // Date de début du mois en cours
          const startOfCurrentMonth = new Date();
          startOfCurrentMonth.setDate(1);
          startOfCurrentMonth.setHours(0, 0, 0, 0);
          
          // Date de début du mois précédent
          const startOfPreviousMonth = new Date(startOfCurrentMonth);
          startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);
          
          // Date de fin du mois précédent
          const endOfPreviousMonth = new Date(startOfCurrentMonth);
          endOfPreviousMonth.setMilliseconds(-1);

          console.log('Dates de calcul:');
          console.log('Début mois courant:', startOfCurrentMonth);
          console.log('Début mois précédent:', startOfPreviousMonth);
          console.log('Fin mois précédent:', endOfPreviousMonth);

          // Requête pour le mois en cours
          const currentMonthQuery = query(
            paymentsRef,
            where('date', '>=', Timestamp.fromDate(startOfCurrentMonth))
          );

          // Requête pour le mois précédent
          const previousMonthQuery = query(
            paymentsRef,
            where('date', '>=', Timestamp.fromDate(startOfPreviousMonth)),
            where('date', '<', Timestamp.fromDate(startOfCurrentMonth))
          );

          const [currentMonthSnapshot, previousMonthSnapshot] = await Promise.all([
            getDocs(currentMonthQuery),
            getDocs(previousMonthQuery)
          ]);

          // Calcul du revenu du mois en cours
          let currentMonthRevenue = 0;
          currentMonthSnapshot.forEach(doc => {
            const payment = doc.data();
            console.log('Paiement mois courant:', payment);
            currentMonthRevenue += Number(payment.amount) || 0;
          });

          // Calcul du revenu du mois précédent
          let previousMonthRevenue = 0;
          previousMonthSnapshot.forEach(doc => {
            const payment = doc.data();
            console.log('Paiement mois précédent:', payment);
            previousMonthRevenue += Number(payment.amount) || 0;
          });

          console.log('Revenu mois courant:', currentMonthRevenue);
          console.log('Revenu mois précédent:', previousMonthRevenue);

          // Calcul du pourcentage de changement
          let percentageChange = 0;
          if (previousMonthRevenue > 0) {
            percentageChange = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
          } else if (currentMonthRevenue > 0) {
            percentageChange = 100; // Si le mois précédent était 0 et le mois actuel > 0
          }

          setStats({
            totalUsers,
            activeSubscriptions: activeSnapshot.size,
            pendingSubscriptions: pendingSnapshot.size,
            trialSubscriptions: trialSnapshot.size,
            revenueThisMonth: currentMonthRevenue,
            percentageChange
          });

        } catch (error) {
          console.error('Erreur lors du calcul des revenus:', error);
        }
      };

      await calculateMonthlyRevenue();

      // Données pour le graphique d'évolution des abonnements
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          label: format(date, 'MMM yyyy', { locale: fr })
        };
      }).reverse();

      const subscriptionData = await Promise.all(
        last6Months.map(async ({ start, end, label }) => {
          const activeQuery = query(subscriptionsRef, 
            where('status', '==', 'active'),
            where('startDate', '<=', end)
          );
          const trialQuery = query(subscriptionsRef,
            where('status', '==', 'trial'),
            where('startDate', '<=', end)
          );

          const [activeSnapshot, trialSnapshot] = await Promise.all([
            getDocs(activeQuery),
            getDocs(trialQuery)
          ]);

          const activeCount = activeSnapshot.docs.filter(doc => {
            const data = doc.data();
            const endDate = data.endDate?.toDate();
            return endDate >= start;
          }).length;

          const trialCount = trialSnapshot.docs.filter(doc => {
            const data = doc.data();
            const endDate = data.endDate?.toDate();
            return endDate >= start;
          }).length;

          console.log(`${label} - Actifs: ${activeCount}, Essai: ${trialCount}`);

          return {
            name: label,
            actifs: activeCount,
            essai: trialCount
          };
        })
      );

      setSubscriptionData(subscriptionData);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            onClick={loadDashboardData}
          >
            Réessayer
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Administrateur
        </Typography>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Utilisateurs</Typography>
              </Box>
              <Typography variant="h4">{stats.totalUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total des utilisateurs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Abonnements</Typography>
              </Box>
              <Typography variant="h4">{stats.activeSubscriptions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Abonnements actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">En attente</Typography>
              </Box>
              <Typography variant="h4">{stats.pendingSubscriptions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Demandes en attente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Revenus</Typography>
              </Box>
              <Typography variant="h4">
                {stats.revenueThisMonth.toLocaleString()} DZD
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" color={stats.percentageChange >= 0 ? 'success' : 'error'}>
                  {stats.percentageChange >= 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  vs mois dernier
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique et Activités Récentes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Évolution des Abonnements
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subscriptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="actifs"
                    stroke={theme.palette.primary.main}
                    name="Abonnements actifs"
                  />
                  <Line
                    type="monotone"
                    dataKey="essai"
                    stroke={theme.palette.warning.main}
                    name="Périodes d'essai"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activités Récentes
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemText
                      primary={activity.message}
                      secondary={format(activity.date, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    />
                    <Chip
                      size="small"
                      label={activity.type}
                      color={
                        activity.status === 'success' ? 'success' :
                        activity.status === 'warning' ? 'warning' :
                        activity.status === 'error' ? 'error' : 'default'
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboardPage;
