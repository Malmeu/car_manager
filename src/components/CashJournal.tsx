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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllMovements();
    }
  }, [currentUser, refreshKey, selectedYear]);

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
          paidAmount: rentalData.totalCost,
        });

        // Rafraîchir les données
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Erreur lors du solde du paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllMovements = async () => {
    if (!currentUser) {
      console.log('Aucun utilisateur connecté');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Début du chargement des données de caisse');
      const start = new Date(selectedYear, 0, 1); // 1er janvier de l'année sélectionnée
      const end = new Date(selectedYear, 11, 31); // 31 décembre de l'année sélectionnée
      const movements: CashMovement[] = [];

      // 1. Récupérer les véhicules
      console.log('Chargement des véhicules...');
      const vehicles = await getAllVehicles(currentUser.uid);
      console.log(`${vehicles.length} véhicules trouvés`);
      const vehiclesMap = new Map(vehicles.map((v) => [v.id, { brand: v.brand, model: v.model }]));

      // 2. Récupérer les revenus des locations
      console.log('Chargement des locations...');
      const rentalsRef = collection(db, 'rentals');
      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      console.log('Période de recherche:', {
        year: selectedYear,
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const rentalsQuery = query(
        rentalsRef,
        where('userId', '==', currentUser.uid),
        where('startDate', '>=', startTimestamp),
        where('startDate', '<=', endTimestamp)
      );

      const rentalsSnapshot = await getDocs(rentalsQuery);
      console.log(`${rentalsSnapshot.docs.length} locations trouvées pour l'année ${selectedYear}`);

      // Traiter les locations
      const rentalsMovements = rentalsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const vehicle = vehiclesMap.get(data.vehicleId);
        const totalRevenue = (data.totalCost || 0) + (data.additionalFees?.amount || 0);
        const paidAmount = data.paymentStatus === 'paid' ? totalRevenue : (data.paidAmount || 0);
        const remainingAmount = totalRevenue - paidAmount;

        return {
          id: doc.id,
          date: data.startDate.toDate(),
          designation: `Location de véhicule${vehicle ? ` - ${vehicle.brand} ${vehicle.model}` : ''}${
            data.additionalFees?.description ? ` (+ ${data.additionalFees.description})` : ''
          }${
            data.paymentStatus === 'pending' ? ' (En attente)' : data.paymentStatus === 'partial' ? ' (Paiement partiel)' : ''
          }`,
          revenue: paidAmount,
          expense: 0,
          type: 'vehicle_revenue' as const,
          totalAmount: totalRevenue,
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          isPending: data.paymentStatus === 'pending',
        } as CashMovement;
      });

      console.log(`${rentalsMovements.length} mouvements de location traités`);
      movements.push(...rentalsMovements);

      // 3. Récupérer les dépenses véhicules
      console.log('Chargement des dépenses véhicules...');
      const vehicleExpensesRef = collection(db, 'expenses');
      const vehicleExpensesQuery = query(
        vehicleExpensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );
      const vehicleExpensesSnapshot = await getDocs(vehicleExpensesQuery);
      console.log(`${vehicleExpensesSnapshot.docs.length} dépenses véhicules trouvées`);

      vehicleExpensesSnapshot.forEach((doc) => {
        const data = doc.data();
        const vehicle = vehiclesMap.get(data.carId);
        movements.push({
          id: doc.id,
          date: data.date.toDate(),
          designation: `${data.name}${vehicle ? ` - ${vehicle.brand} ${vehicle.model}` : ''}`,
          revenue: 0,
          expense: data.amount || 0,
          type: 'vehicle_expense' as const,
          totalAmount: data.amount || 0,
          paidAmount: data.amount || 0,
          remainingAmount: 0,
        });
      });

      // 4. Récupérer les dépenses entreprise
      console.log('Chargement des dépenses entreprise...');
      const businessExpensesRef = collection(db, 'businessExpenses');
      const businessExpensesQuery = query(
        businessExpensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );
      const businessExpensesSnapshot = await getDocs(businessExpensesQuery);
      console.log(`${businessExpensesSnapshot.docs.length} dépenses entreprise trouvées`);

      businessExpensesSnapshot.forEach((doc) => {
        const data = doc.data();
        movements.push({
          id: doc.id,
          date: data.date.toDate(),
          designation: `Frais entreprise - ${data.designation}`,
          revenue: 0,
          expense: data.amount || 0,
          type: 'business_expense' as const,
          totalAmount: data.amount || 0,
          paidAmount: data.amount || 0,
          remainingAmount: 0,
        });
      });

      // Trier les mouvements par date
      movements.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculer les totaux
      const totals = movements.reduce(
        (acc, mov) => ({
          revenue: acc.revenue + mov.revenue,
          expense: acc.expense + mov.expense,
          pending: acc.pending + (mov.isPending ? mov.remainingAmount : 0),
        }),
        { revenue: 0, expense: 0, pending: 0 }
      );

      console.log('Totaux calculés:', totals);

      setCashMovements(movements);
      setTotalRevenue(totals.revenue);
      setTotalExpense(totals.expense);
      setTotalCash(totals.revenue - totals.expense);
      setTotalPending(totals.pending);

      console.log('Chargement des données terminé avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Journal de Caisse
      </Typography>

      <FormControl sx={{ mb: 4 }}>
        <InputLabel id="year-select-label">Année</InputLabel>
        <Select
          labelId="year-select-label"
          id="year-select"
          value={selectedYear}
          label="Année"
          onChange={(e) => handleYearChange(Number(e.target.value))}
        >
          <MenuItem value={2024}>2024</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
        </Select>
      </FormControl>

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
                      ? 'rgba(254, 226, 226, 0.5)' // Rouge très clair pour les dépenses
                      : movement.isPending
                        ? 'rgba(255, 244, 229, 0.9)' // Orange clair pour les paiements en attente
                        : movement.remainingAmount > 0
                          ? 'rgba(254, 243, 199, 0.9)' // Jaune clair pour les paiements partiels
                          : movement.type === 'vehicle_revenue'
                            ? 'rgba(220, 252, 231, 0.5)' // Vert très clair pour les locations payées
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
                              : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <TableCell>{movement.date.toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {movement.type === 'vehicle_expense' || movement.type === 'business_expense' ? (
                      <span className="inline-flex items-center justify-center w-2 h-2 mr-2 bg-red-500 rounded-full" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-2 h-2 mr-2 bg-green-500 rounded-full" />
                    )}

                    {movement.designation}
                  </div>
                </TableCell>
                <TableCell align="right">
                  {movement.totalAmount.toLocaleString('fr-FR')} DA
                </TableCell>
                <TableCell align="right" sx={{ color: movement.type === 'vehicle_revenue' ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
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
                  ) : (
                    '-'
                  )}
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
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {totalRevenue.toLocaleString('fr-FR')} DA
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {totalPending.toLocaleString('fr-FR')} DA
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
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
