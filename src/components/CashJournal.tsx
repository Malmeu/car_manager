import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllVehicles } from '../services/vehicleService';

interface Revenue {
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  amount: number;
  date: Date;
}

interface CashMovement {
  id: string;
  date: Date;
  designation: string;
  revenue: number;
  expense: number;
  type: 'vehicle_revenue' | 'vehicle_expense' | 'business_expense';
}

const CashJournal: React.FC = () => {
  const { currentUser } = useAuth();
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (currentUser) {
      fetchAllMovements();
    }
  }, [currentUser]);

  const fetchAllMovements = async () => {
    if (!currentUser) return;

    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const movements: CashMovement[] = [];

      // 1. Récupérer les véhicules
      const vehicles = await getAllVehicles(currentUser.uid);
      const vehiclesMap = new Map(vehicles.map(v => [v.id, { brand: v.brand, model: v.model }]));

      // 2. Récupérer les revenus des locations
      const rentalsRef = collection(db, 'rentals');
      const rentalsQuery = query(
        rentalsRef,
        where('userId', '==', currentUser.uid),
        where('startDate', '>=', Timestamp.fromDate(start)),
        where('startDate', '<=', Timestamp.fromDate(end))
      );
      const rentalsSnapshot = await getDocs(rentalsQuery);

      // Traiter les locations
      rentalsSnapshot.forEach((doc) => {
        const data = doc.data();
        const vehicle = vehiclesMap.get(data.vehicleId);
        if (vehicle && data.totalCost > 0) {
          movements.push({
            id: doc.id,
            date: data.startDate.toDate(),
            designation: `Location - ${vehicle.brand} ${vehicle.model}`,
            revenue: data.totalCost,
            expense: 0,
            type: 'vehicle_revenue'
          });
        }
      });

      // 3. Récupérer les dépenses véhicules
      const vehicleExpensesRef = collection(db, 'expenses');
      const vehicleExpensesQuery = query(
        vehicleExpensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );
      const vehicleExpensesSnapshot = await getDocs(vehicleExpensesQuery);

      vehicleExpensesSnapshot.forEach((doc) => {
        const data = doc.data();
        const vehicle = vehiclesMap.get(data.carId);
        movements.push({
          id: doc.id,
          date: data.date.toDate(),
          designation: `${data.name}${vehicle ? ` - ${vehicle.brand} ${vehicle.model}` : ''}`,
          revenue: 0,
          expense: data.amount,
          type: 'vehicle_expense'
        });
      });

      // 4. Récupérer les dépenses entreprise
      const businessExpensesRef = collection(db, 'businessExpenses');
      const businessExpensesQuery = query(
        businessExpensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );
      const businessExpensesSnapshot = await getDocs(businessExpensesQuery);

      businessExpensesSnapshot.forEach((doc) => {
        const data = doc.data();
        movements.push({
          id: doc.id,
          date: data.date.toDate(),
          designation: `Frais entreprise - ${data.designation}`,
          revenue: 0,
          expense: data.amount,
          type: 'business_expense'
        });
      });

      // Trier les mouvements par date
      const sortedMovements = movements.sort((a, b) => b.date.getTime() - a.date.getTime());
      setCashMovements(sortedMovements);

      // Calculer les totaux
      const totals = movements.reduce(
        (acc, mov) => ({
          revenue: acc.revenue + mov.revenue,
          expense: acc.expense + mov.expense
        }),
        { revenue: 0, expense: 0 }
      );

      setTotalRevenue(totals.revenue);
      setTotalExpense(totals.expense);
      setTotalCash(totals.revenue - totals.expense);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Journal de Caisse
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenus
              </Typography>
              <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                +{totalRevenue.toLocaleString('fr-FR')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sorties
              </Typography>
              <Typography variant="h5" component="div" sx={{ color: 'error.main' }}>
                -{totalExpense.toLocaleString('fr-FR')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                État de la Caisse
              </Typography>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ color: totalCash >= 0 ? 'success.main' : 'error.main' }}
              >
                {totalCash.toLocaleString('fr-FR')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Désignation</TableCell>
              <TableCell align="right">Revenus</TableCell>
              <TableCell align="right">Sorties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cashMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  {format(movement.date, 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>{movement.designation}</TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    color: 'success.main',
                    fontWeight: movement.revenue > 0 ? 'bold' : 'normal'
                  }}
                >
                  {movement.revenue > 0 ? `${movement.revenue.toLocaleString('fr-FR')} DA` : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: 'error.main',
                    fontWeight: movement.expense > 0 ? 'bold' : 'normal'
                  }}
                >
                  {movement.expense > 0 ? `${movement.expense.toLocaleString('fr-FR')} DA` : '-'}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                Totaux
              </TableCell>
              <TableCell 
                align="right" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'success.main'
                }}
              >
                {totalRevenue.toLocaleString('fr-FR')} DA
              </TableCell>
              <TableCell 
                align="right"
                sx={{ 
                  fontWeight: 'bold',
                  color: 'error.main'
                }}
              >
                {totalExpense.toLocaleString('fr-FR')} DA
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default CashJournal;
