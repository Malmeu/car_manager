import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  CircularProgress,
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatCurrency } from '../../utils/formatters';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Rental } from '../../types';

interface VehicleFinancialSummaryProps {
  vehicleId: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueByCategory: { [key: string]: number };
  expensesByCategory: { [key: string]: number };
}

interface VehicleExpense {
  id: string;
  name: string;
  amount: number;
  date: Date;
  carId: string;
}

const VehicleFinancialSummary: React.FC<VehicleFinancialSummaryProps> = ({ vehicleId }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    revenueByCategory: {},
    expensesByCategory: {},
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        // Récupérer les locations (revenus)
        const rentalQuery = query(
          collection(db, 'rentals'),
          where('vehicleId', '==', vehicleId),
          where('status', 'in', ['completed', 'active'])
        );
        const rentalSnapshot = await getDocs(rentalQuery);
        
        // Récupérer les dépenses générales
        const expenseQuery = query(
          collection(db, 'expenses'),
          where('carId', '==', vehicleId)
        );
        const expenseSnapshot = await getDocs(expenseQuery);

        // Calculer les totaux et les catégories
        let totalRevenue = 0;
        let totalExpenses = 0;
        const revenueByCategory: { [key: string]: number } = {
          'Locations': 0,
          'Services chauffeur': 0
        };
        const expensesByCategory: { [key: string]: number } = {};

        // Traiter les revenus de location
        rentalSnapshot.forEach((doc) => {
          const rental = doc.data() as Rental;
          const rentalRevenue = rental.totalCost || 0;
          const driverRevenue = rental.withDriver ? (rental.driverCost || 0) : 0;
          
          totalRevenue += rentalRevenue + driverRevenue;
          revenueByCategory['Locations'] += rentalRevenue;
          if (driverRevenue > 0) {
            revenueByCategory['Services chauffeur'] += driverRevenue;
          }
        });

        // Traiter les dépenses
        expenseSnapshot.forEach((doc) => {
          const expense = doc.data() as VehicleExpense;
          const amount = expense.amount || 0;
          totalExpenses += amount;
          
          const category = expense.name || 'Autres dépenses';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
        });

        setSummary({
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          revenueByCategory,
          expensesByCategory,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données financières:', error);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchFinancialData();
    }
  }, [vehicleId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Résumé Financier
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="success.main" variant="subtitle2">
                Revenus Totaux
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  {formatCurrency(summary.totalRevenue)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="error.main" variant="subtitle2">
                Dépenses Totales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error.main">
                  {formatCurrency(summary.totalExpenses)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color={summary.netIncome >= 0 ? 'success.main' : 'error.main'}>
                Résultat Net
              </Typography>
              <Typography variant="h6" color={summary.netIncome >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(summary.netIncome)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Revenus par Catégorie
            </Typography>
            {Object.entries(summary.revenueByCategory)
              .filter(([_, amount]) => amount > 0)
              .map(([category, amount]) => (
                <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{category}</Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(amount)}
                  </Typography>
                </Box>
              ))}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Dépenses par Catégorie
            </Typography>
            {Object.entries(summary.expensesByCategory)
              .filter(([_, amount]) => amount > 0)
              .map(([category, amount]) => (
                <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{category}</Typography>
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(amount)}
                  </Typography>
                </Box>
              ))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VehicleFinancialSummary;
