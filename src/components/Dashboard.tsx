import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useTheme,
  Tooltip,
  Container,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  DialogActions,
  Button
} from '@mui/material';
import Calendar from './Calendar';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';
import { getAllVehicles } from '../services/vehicleService';
import { getAllRentals, Rental } from '../services/rentalService';
import { Customer, Vehicle } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAllCustomers } from '../services/customerService';

// Extend the Rental interface to include the new properties
interface ExtendedRental extends Rental {
  remainingAmount: number;
  customerId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'rental' | 'maintenance';
}

interface RemainingToCollect {
  total: number;
  details: Array<{
    client: string;
    amount: number;
  }>;
}

interface AvailableCars {
  total: number;
  details: string[];
}

const Dashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [availableCars, setAvailableCars] = useState<AvailableCars>({ total: 0, details: [] });
  const [remainingToCollect, setRemainingToCollect] = useState<RemainingToCollect>({ 
    total: 0, 
    details: [] 
  });
  const [showRemainingDetails, setShowRemainingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const companyName = localStorage.getItem('companyName') || 'Votre Entreprise';

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        console.log('No current user, skipping data fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching data for user:', currentUser.uid);
        
        const [rentalsData, vehiclesData, clientsData] = await Promise.all([
          getAllRentals(currentUser.uid),
          getAllVehicles(currentUser.uid),
          getAllCustomers(currentUser.uid)
        ]) as [Rental[], Vehicle[], Customer[]];

        console.log('Fetched data:', {
          rentals: rentalsData.length,
          vehicles: vehiclesData.length,
          clients: clientsData.length
        });

        setTotalVehicles(vehiclesData.length);
        setTotalClients(clientsData.length);

        const now = new Date();
        let activeRentalsCount = 0;
        let currentRevenueTotal = 0;
        let unpaidAmountTotal = 0;
        let unpaidDetails: RemainingToCollect['details'] = [];

        rentalsData.forEach(rental => {
          const startDate = rental.startDate.toDate();
          const endDate = rental.endDate.toDate();
          const rentalTotal = rental.totalCost + (rental.additionalFees?.amount || 0);
          
          if (startDate <= now && endDate >= now) {
            activeRentalsCount++;
          }
          
          currentRevenueTotal += rentalTotal;
          const unpaid = rentalTotal - (rental.paidAmount || 0);
          
          if (unpaid > 0) {
            unpaidAmountTotal += unpaid;
            const foundClient = clientsData.find(c => c.id === rental.customerId);
            if (foundClient) {
              unpaidDetails.push({
                client: `${foundClient.firstName} ${foundClient.lastName}`,
                amount: unpaid
              });
            }
          }
        });

        setActiveRentals(activeRentalsCount);
        setTotalRevenue(currentRevenueTotal);
        setRemainingToCollect({ 
          total: unpaidAmountTotal, 
          details: unpaidDetails 
        });

        // Calculate available cars
        const availableCarsDetails = vehiclesData
          .filter(vehicle => !rentalsData.some(rental => 
            rental.vehicleId === vehicle.id &&
            rental.startDate.toDate() <= now &&
            rental.endDate.toDate() >= now
          ))
          .map(vehicle => `${vehicle.brand} ${vehicle.model}`);

        setAvailableCars({
          total: availableCarsDetails.length,
          details: availableCarsDetails
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Chargement des données...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Statistiques */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title="Nombre total de véhicules dans votre flotte"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="primary" gutterBottom>
                  Véhicules Totaux
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {totalVehicles}
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title="Nombre total de clients enregistrés"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="success.main" gutterBottom>
                  Clients Totaux
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {totalClients}
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title="Nombre de locations en cours"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="warning.main" gutterBottom>
                  Locations Actives
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {activeRentals}
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title="Revenus des locations en cours"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="error.main" gutterBottom>
                  Revenus En cours
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {totalRevenue} DA
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Véhicules disponibles :
                </Typography>
                {availableCars.details.map((car, index) => (
                  <Typography key={index} variant="body2" sx={{ pl: 2 }}>
                    • {car}
                  </Typography>
                ))}
              </Box>
            }
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  maxWidth: 'none'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="info.main" gutterBottom>
                  Voitures Disponibles
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {availableCars.total}
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Tooltip 
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Détails des paiements en attente :
                </Typography>
                <List>
                  {remainingToCollect.details.map((detail, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={detail.client}
                        secondary={`${detail.amount.toLocaleString('fr-FR')} DZD`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            }
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper',
                  },
                  boxShadow: theme.shadows[1],
                  p: 2,
                  borderRadius: 1,
                  maxWidth: 'none'
                }
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography sx={{ color: 'secondary.main' }} gutterBottom>
                  Reste à Encaisser
                </Typography>
                <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                  {remainingToCollect.total} DA
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Calendrier */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Calendar />
          </Paper>
        </Grid>
      </Grid>
      <Dialog
        open={showRemainingDetails}
        onClose={() => setShowRemainingDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Détails des paiements en attente :
        </DialogTitle>
        <DialogContent>
          <List>
            {remainingToCollect.details.map((detail, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={detail.client}
                  secondary={`${detail.amount.toLocaleString('fr-FR')} DZD`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRemainingDetails(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Exporter le composant sans la vérification d'abonnement
export default Dashboard;
