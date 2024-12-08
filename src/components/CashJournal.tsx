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
  TableFooter,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
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
  isPending?: boolean;
  totalAmount: number;  
  paidAmount: number;   
  remainingAmount: number; 
}

const CashJournal: React.FC = () => {
  const { currentUser } = useAuth();
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePayRemaining = async (movementId: string, remainingAmount: number) => {
    try {
      setIsLoading(true);
      const rentalRef = doc(db, 'rentals', movementId);
      const rentalDoc = await getDoc(rentalRef);
      
      if (rentalDoc.exists()) {
        const rentalData = rentalDoc.data();
        
        // Mettre à jour le statut de paiement et le montant payé
        await updateDoc(rentalRef, {
          paymentStatus: 'paid',
          paidAmount: rentalData.totalCost
        });

        // Rafraîchir les données
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur lors du solde du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllMovements();
    }
  }, [currentUser, refreshKey]);

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
      const rentalsMovements = rentalsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          const rentalDays = Math.ceil(
            (data.endDate.toDate().getTime() - data.startDate.toDate().getTime()) / (1000 * 3600 * 24)
          );
          const baseRevenue = data.totalCost;
          const additionalFees = data.additionalFees?.amount || 0;
          const totalRevenue = baseRevenue + additionalFees;

          // Créer un seul mouvement par location
          const paidAmount = data.paymentStatus === 'paid' ? totalRevenue : (data.paidAmount || 0);
          const remainingAmount = totalRevenue - paidAmount;
          
          return {
            id: doc.id,
            date: data.startDate.toDate(),
            designation: `Location de véhicule - ${data.vehicleBrand} ${data.vehicleModel}${
              data.additionalFees?.description ? ` (+ ${data.additionalFees.description})` : ''
            }${
              data.paymentStatus === 'pending' ? ' (En attente)' : 
              data.paymentStatus === 'partial' ? ' (Paiement partiel)' : ''
            }`,
            revenue: paidAmount,
            expense: 0,
            type: 'vehicle_revenue' as const,
            totalAmount: totalRevenue,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            isPending: data.paymentStatus === 'pending'
          } as CashMovement;
        });

      // Ajouter les mouvements de location valides
      movements.push(...rentalsMovements);

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
          type: 'vehicle_expense' as const,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
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
          type: 'business_expense' as const,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      });

      // Trier les mouvements par date
      const sortedMovements = movements.sort((a, b) => b.date.getTime() - a.date.getTime());
      setCashMovements(sortedMovements);

      // Calculer les totaux
      const totals = movements.reduce(
        (acc, mov) => ({
          revenue: acc.revenue + (mov.paidAmount || mov.revenue),
          expense: acc.expense + mov.expense,
          pending: acc.pending + (mov.remainingAmount || 0)
        }),
        { revenue: 0, expense: 0, pending: 0 }
      );

      setTotalRevenue(totals.revenue);
      setTotalExpense(totals.expense);
      setTotalPending(totals.pending);
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
              <TableCell align="right">Montant Total</TableCell>
              <TableCell align="right">Montant Payé</TableCell>
              <TableCell align="right">Reste à Payer</TableCell>
              <TableCell align="right">Dépense</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cashMovements.map((movement, index) => (
              <TableRow
                key={movement.id}
                sx={{
                  backgroundColor: 
                    movement.type === 'vehicle_expense' || movement.type === 'business_expense' 
                      ? 'rgba(254, 226, 226, 0.5)'  // Rouge très clair pour les dépenses
                      : movement.isPending 
                        ? 'rgba(255, 244, 229, 0.9)'  // Orange clair pour les paiements en attente
                        : movement.remainingAmount > 0 
                          ? 'rgba(254, 243, 199, 0.9)'  // Jaune clair pour les paiements partiels
                          : movement.type === 'vehicle_revenue'
                            ? 'rgba(220, 252, 231, 0.5)'  // Vert très clair pour les locations payées
                            : 'inherit',
                  '&:hover': {
                    backgroundColor: 
                      movement.type === 'vehicle_expense' || movement.type === 'business_expense'
                        ? 'rgba(254, 226, 226, 0.7)'
                        : movement.isPending
                          ? 'rgba(255, 244, 229, 1)'
                          : movement.remainingAmount > 0
                            ? 'rgba(254, 243, 199, 1)'
                            : movement.type === 'vehicle_revenue'
                              ? 'rgba(220, 252, 231, 0.7)'
                              : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <TableCell>{movement.date.toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {movement.type === 'vehicle_expense' || movement.type === 'business_expense' ? (
                      <span className="inline-flex items-center justify-center w-2 h-2 mr-2 bg-red-500 rounded-full"/>
                    ) : (
                      <span className="inline-flex items-center justify-center w-2 h-2 mr-2 bg-green-500 rounded-full"/>
                    )}
                    
                    {movement.designation}
                  </div>
                </TableCell>
                <TableCell align="right">
                  {movement.totalAmount.toLocaleString('fr-FR')} DA
                </TableCell>
                <TableCell align="right" sx={{ 
                  color: movement.type === 'vehicle_revenue' ? 'success.main' : 'error.main',
                  fontWeight: 'bold' 
                }}>
                  {movement.paidAmount.toLocaleString('fr-FR')} DA
                </TableCell>
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  {movement.remainingAmount > 0 ? (
                    <div className="flex items-center justify-end gap-2">
                      <span>{movement.remainingAmount.toLocaleString('fr-FR')} DA</span>
                      <button
                        onClick={() => handlePayRemaining(movement.id, movement.remainingAmount)}
                        disabled={isLoading}
                        className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {isLoading ? 'Chargement...' : 'Solder'}
                      </button>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell align="right" sx={{ color: movement.expense > 0 ? 'error.main' : 'inherit' }}>
                  {movement.expense > 0 ? `${movement.expense.toLocaleString('fr-FR')} DA` : '-'}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
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
                {totalPending.toLocaleString('fr-FR')} DA
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
