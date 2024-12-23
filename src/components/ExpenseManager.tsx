import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Card,
  CardContent,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DatePicker
} from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startOfMonth, endOfMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useAuth } from '../contexts/AuthContext';
import { getAllVehicles } from '../services/vehicleService';
import { getAllRentals, Rental } from '../services/rentalService';

interface Car {
  id: string;
  brand: string;
  model: string;
  registration: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: Date;
  carId: string;
}

interface BusinessExpense {
  id: string;
  designation: string;
  amount: number;
  date: Date;
  userId: string;
}

const ExpenseManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<Date | null>(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([]);
  const [allVehicleExpenses, setAllVehicleExpenses] = useState<Expense[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  
  // Business expense form states
  const [businessDesignation, setBusinessDesignation] = useState('');
  const [businessAmount, setBusinessAmount] = useState('');
  const [businessDate, setBusinessDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (currentUser) {
      fetchCars();
      fetchAllVehicleExpenses();
      fetchBusinessExpenses();
      fetchRentals();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllVehicleExpenses();
    }
  }, [expenses]);

  useEffect(() => {
    if (selectedCar) {
      fetchExpenses();
    }
  }, [selectedCar]);

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 1) {
        fetchBusinessExpenses();
      }
    }
  }, [currentUser, activeTab]);

  const fetchCars = async () => {
    try {
      if (!currentUser) return;
      const carsData = await getAllVehicles(currentUser.uid);
      // Convert Vehicle[] to Car[]
      const cars = carsData.map(vehicle => ({
        id: vehicle.id || '', // Ensure id is always a string
        brand: vehicle.brand,
        model: vehicle.model,
        registration: vehicle.registration
      }));
      setCars(cars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedCar || !currentUser) return;

    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('carId', '==', selectedCar),
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          name: data.name,
          amount: data.amount,
          date: data.date.toDate(),
          carId: data.carId,
        });
      });
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchBusinessExpenses = async () => {
    if (!currentUser) return;

    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const expensesRef = collection(db, 'businessExpenses');
      const q = query(
        expensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      const expensesData: BusinessExpense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          designation: data.designation,
          amount: data.amount,
          date: data.date.toDate(),
          userId: data.userId,
        });
      });
      setBusinessExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching business expenses:', error);
    }
  };

  const fetchAllVehicleExpenses = async () => {
    if (!currentUser) return;

    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expense = {
          id: doc.id,
          name: data.name,
          amount: Number(data.amount), // Utiliser Number au lieu de parseFloat
          date: data.date.toDate(),
          carId: data.carId,
        };
        expensesData.push(expense);
      });

      setAllVehicleExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching all vehicle expenses:', error);
    }
  };

  const fetchRentals = async () => {
    if (!currentUser) return;
    try {
      const rentalsData = await getAllRentals(currentUser.uid);
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      
      const currentMonthRentals = rentalsData.filter(rental => {
        const rentalDate = rental.startDate.toDate();
        return rentalDate >= start && 
               rentalDate <= end;
      });
      
      setRentals(currentMonthRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !expenseName || !expenseAmount || !expenseDate || !currentUser) return;

    try {
      const expenseData = {
        name: expenseName,
        amount: parseFloat(expenseAmount),
        date: Timestamp.fromDate(expenseDate),
        carId: selectedCar,
        userId: currentUser.uid,
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      
      // Reset form
      setExpenseName('');
      setExpenseAmount('');
      setExpenseDate(new Date());
      
      // Refresh expenses list
      fetchExpenses();
      // Refresh all vehicle expenses to update totals
      fetchAllVehicleExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleBusinessExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessDesignation || !businessAmount || !businessDate || !currentUser) return;

    try {
      const expenseData = {
        designation: businessDesignation,
        amount: parseFloat(businessAmount),
        date: Timestamp.fromDate(businessDate),
        userId: currentUser.uid,
      };

      await addDoc(collection(db, 'businessExpenses'), expenseData);
      
      // Reset form
      setBusinessDesignation('');
      setBusinessAmount('');
      setBusinessDate(new Date());
      
      // Refresh business expenses list
      fetchBusinessExpenses();
    } catch (error) {
      console.error('Error adding business expense:', error);
    }
  };

  // Ajout des fonctions de suppression
  const handleDeleteVehicleExpense = async (expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      // Mise à jour de l'état local
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      // Refresh all vehicle expenses to update totals
      fetchAllVehicleExpenses();
    } catch (error) {
      console.error("Erreur lors de la suppression des frais véhicule:", error);
    }
  };

  const handleDeleteBusinessExpense = async (expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'businessExpenses', expenseId));
      // Mise à jour de l'état local
      setBusinessExpenses(businessExpenses.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error("Erreur lors de la suppression des frais entreprise:", error);
    }
  };

  // Combine and sort all transactions by date
  const allTransactions = useMemo(() => {
    // Créer les transactions pour les revenus (locations)
    const rentalTransactions = rentals.map(rental => ({
      date: rental.startDate.toDate(),
      description: `Location - ${cars.find(c => c.id === rental.vehicleId)?.brand || ''} ${cars.find(c => c.id === rental.vehicleId)?.model || ''}`,
      amount: rental.totalCost,
      type: 'entrée' as const
    }));

    // Créer les transactions pour les dépenses
    const expenseTransactions = [
      ...allVehicleExpenses.map(expense => ({
        date: expense.date,
        description: `${expense.name} - ${cars.find(c => c.id === expense.carId)?.brand || ''} ${cars.find(c => c.id === expense.carId)?.model || ''}`,
        amount: -Math.abs(expense.amount),
        type: 'sortie' as const
      })),
      ...businessExpenses.map(expense => ({
        date: expense.date,
        description: expense.designation,
        amount: -Math.abs(expense.amount),
        type: 'sortie' as const
      }))
    ];

    // Combiner et trier toutes les transactions
    const allTrans = [...rentalTransactions, ...expenseTransactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return allTrans;
  }, [rentals, allVehicleExpenses, businessExpenses, cars]);

  // Calculer les totaux
  const totals = useMemo(() => {
    return allTransactions.reduce((acc, transaction) => ({
      entrées: acc.entrées + (transaction.type === 'entrée' ? transaction.amount : 0),
      sorties: acc.sorties + (transaction.type === 'sortie' ? Math.abs(transaction.amount) : 0),
      total: acc.total + transaction.amount
    }), { entrées: 0, sorties: 0, total: 0 });
  }, [allTransactions]);

  // Calculate totals
  const totalVehicleExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBusinessExpenses = businessExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRentalIncome = rentals.reduce((sum, rental) => sum + rental.totalCost, 0);
  const totalAllExpenses = totalVehicleExpenses + totalBusinessExpenses;
  const netIncome = totalRentalIncome - totalAllExpenses;

  // Calculer le total de tous les véhicules
  const totalAllVehicles = useMemo(() => {
    return allVehicleExpenses.reduce((sum, expense) => {
      return sum + (typeof expense.amount === 'number' ? expense.amount : 0);
    }, 0);
  }, [allVehicleExpenses]);

  // Group expenses by vehicle avec useMemo pour optimiser les performances
  const expensesByVehicle = useMemo(() => {
    return allVehicleExpenses.reduce((acc, expense) => {
      const car = cars.find(c => c.id === expense.carId);
      const vehicleName = car ? `${car.brand} ${car.model}` : 'Véhicule inconnu';
      
      if (!acc[expense.carId]) {
        acc[expense.carId] = {
          name: vehicleName,
          total: 0
        };
      }
      acc[expense.carId].total += typeof expense.amount === 'number' ? expense.amount : 0;
      return acc;
    }, {} as { [key: string]: { name: string; total: number } });
  }, [allVehicleExpenses, cars]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Gestion des frais
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Frais véhicules" />
        <Tab label="Frais entreprise" />
      </Tabs>

      {activeTab === 0 ? (
        // Frais véhicules
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ajouter des frais véhicule
                </Typography>
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Véhicule</InputLabel>
                    <Select
                      value={selectedCar}
                      onChange={(e) => setSelectedCar(e.target.value)}
                      required
                    >
                      {cars.map((car) => (
                        <MenuItem key={car.id} value={car.id}>
                          {car.brand} {car.model} - {car.registration}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Nom de la dépense"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Montant"
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <DatePicker
                      label="Date"
                      value={expenseDate}
                      onChange={(newValue) => setExpenseDate(newValue)}
                      sx={{ width: '100%', mb: 2 }}
                    />
                  </LocalizationProvider>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Ajouter
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total des frais par véhicule
                </Typography>
                {Object.entries(expensesByVehicle).map(([carId, data]) => (
                  <Box key={carId} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {data.name}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {data.total.toLocaleString('fr-FR')} DA
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Détails des frais véhicules
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {expense.date.toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>{expense.name}</TableCell>
                          <TableCell align="right">
                            {expense.amount.toLocaleString('fr-FR')} DA
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleDeleteVehicleExpense(expense.id)}
                              color="error"
                              size="small"
                              title="Supprimer"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString('fr-FR')} DA
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Frais entreprise
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ajouter des frais entreprise
                </Typography>
                <form onSubmit={handleBusinessExpenseSubmit}>
                  <TextField
                    fullWidth
                    label="Désignation"
                    value={businessDesignation}
                    onChange={(e) => setBusinessDesignation(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Montant"
                    type="number"
                    value={businessAmount}
                    onChange={(e) => setBusinessAmount(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <DatePicker
                      label="Date"
                      value={businessDate}
                      onChange={(newValue) => setBusinessDate(newValue)}
                      sx={{ width: '100%', mb: 2 }}
                    />
                  </LocalizationProvider>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Ajouter
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Détails des frais entreprise
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Désignation</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {businessExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>{expense.designation}</TableCell>
                          <TableCell align="right">
                            {expense.amount.toLocaleString('fr-FR')} DA
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleDeleteBusinessExpense(expense.id)}
                              color="error"
                              size="small"
                              title="Supprimer"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {businessExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString('fr-FR')} DA
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ExpenseManager;
