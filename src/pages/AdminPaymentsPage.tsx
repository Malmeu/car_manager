import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where, 
  Timestamp, 
  DocumentData,
  getDoc,
  doc as firestoreDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  description: string;
  userName: string;
  subscriptionId?: string;
}

interface UserData {
  name?: string;
  email?: string;
}

const PAYMENT_METHODS = ['BaridiMob', 'CCP', 'Virement bancaire', 'Espèce'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [methodStats, setMethodStats] = useState<{ name: string; value: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      console.log('Nombre total de paiements trouvés:', querySnapshot.size);
      
      const fetchedPayments = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log('Données brutes du paiement:', data);
          
          // Convertir le montant en nombre
          const amount = typeof data.amount === 'number' ? data.amount : 
                        typeof data.amount === 'string' ? parseFloat(data.amount) : 0;
          
          console.log('Montant converti:', amount);

          // Récupérer les informations de l'utilisateur
          let userName = 'Utilisateur inconnu';
          if (data.userId) {
            try {
              const userDocRef = firestoreDoc(db, 'users', data.userId);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                userName = userData.name || userData.email || 'Utilisateur inconnu';
              }
            } catch (error) {
              console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            }
          }

          // S'assurer que la date est un objet Date valide
          let paymentDate = data.date instanceof Timestamp ? 
            data.date.toDate() : 
            new Date(data.date?.seconds ? data.date.seconds * 1000 : Date.now());
          
          console.log('Date du paiement:', paymentDate);

          return {
            id: doc.id,
            userId: data.userId || '',
            amount: amount,
            date: paymentDate,
            status: data.status || 'pending',
            method: data.method || 'Non spécifié',
            description: data.description || 'Pas de description',
            userName: userName
          };
        })
      );

      console.log('Paiements traités:', fetchedPayments);
      setPayments(fetchedPayments);

      // Calculer les statistiques
      const total = fetchedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      console.log('Revenu total calculé:', total);
      setTotalRevenue(total);

      // Calculer le revenu mensuel
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyTotal = fetchedPayments
        .filter(payment => payment.date >= startOfMonth)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      console.log('Revenu mensuel calculé:', monthlyTotal);
      setMonthlyRevenue(monthlyTotal);

      // Statistiques par méthode de paiement
      const methodStats = PAYMENT_METHODS.map(method => ({
        name: method,
        value: fetchedPayments.filter(p => p.method === method).length
      }));
      setMethodStats(methodStats);

    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = !selectedMethod || payment.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const createTestPayment = async () => {
    try {
      // Créer un paiement de test
      const paymentData = {
        userId: "test_user",
        amount: 5000, // 5000 DA
        date: Timestamp.now(),
        status: 'completed',
        method: 'CCP',
        description: 'Paiement test',
        createdAt: Timestamp.now()
      };

      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('Paiement de test créé:', paymentRef.id);
      
      // Recharger les paiements
      await loadPayments();
    } catch (error) {
      console.error('Erreur lors de la création du paiement test:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Gestion des Paiements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createTestPayment}
        >
          Ajouter un paiement test
        </Button>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Revenu Total</Typography>
              </Box>
              <Typography variant="h4">{totalRevenue.toLocaleString()} DA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Revenu Mensuel</Typography>
              </Box>
              <Typography variant="h4">{monthlyRevenue.toLocaleString()} DA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Transactions</Typography>
              </Box>
              <Typography variant="h4">{payments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique des méthodes de paiement */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Répartition des Méthodes de Paiement
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {methodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Méthode de paiement</InputLabel>
            <Select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              label="Méthode de paiement"
            >
              <MenuItem value="">Toutes</MenuItem>
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>{method}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tableau des paiements */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Méthode</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(payment.date, 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell>{payment.userName}</TableCell>
                <TableCell>{payment.amount.toLocaleString()} DA</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminPaymentsPage;
