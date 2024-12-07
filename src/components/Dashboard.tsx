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
  Paper
} from '@mui/material';
import Calendar from './Calendar';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';
import { getAllVehicles } from '../services/vehicleService';
import { getAllRentals, Rental } from '../services/rentalService';
import { Customer, COLLECTION_NAME as CUSTOMERS_COLLECTION } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';

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

const Dashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [availableCars, setAvailableCars] = useState<{ total: number, details: string[] }>({ total: 0, details: [] });
  const [remainingToCollect, setRemainingToCollect] = useState<{ total: number, details: { client: string, amount: number }[] }>({ 
    total: 0, 
    details: [] 
  });
  const companyName = localStorage.getItem('companyName') || 'Votre Entreprise';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser) return;

        // Fetch vehicles first
        const vehicles = await getAllVehicles(currentUser.uid);
        setTotalVehicles(vehicles.length);

        // Fetch clients
        const clientsQuery = query(
          collection(db, CUSTOMERS_COLLECTION),
          where('userId', '==', currentUser.uid)
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setTotalClients(clientsSnapshot.size);

        // Fetch rentals
        const rentalsSnapshot = await getDocs(
          query(collection(db, 'rentals'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'active')
          )
        );
        
        let revenue = 0;
        rentalsSnapshot.forEach((doc) => {
          const rental = doc.data();
          revenue += rental.totalCost || 0;
        });
        
        setTotalRevenue(revenue);

        // Calculate active rentals and other stats
        const rentalsData = await getAllRentals(currentUser.uid);
        const rentals = rentalsData as ExtendedRental[];
        const active = rentals.filter(rental => 
          rental.status === 'active'
        );
        setActiveRentals(active.length);

        // Calculate available cars
        const rentedCarIds = active.map(rental => rental.vehicleId || '');
        const availableVehicles = vehicles.filter(vehicle => vehicle.id && !rentedCarIds.includes(vehicle.id));
        setAvailableCars({
          total: availableVehicles.length,
          details: availableVehicles.map(v => `${v.brand} ${v.model}`)
        });

        // Calculate remaining to collect
        const unpaidRentals = rentals.filter(rental => 
          rental.status === 'active' && rental.paymentStatus !== 'paid'
        );
        const remainingAmount = unpaidRentals.reduce((sum, rental) => 
          sum + (rental.totalCost - (rental.paidAmount || 0)), 0
        );
        setRemainingToCollect({
          total: remainingAmount,
          details: await Promise.all(unpaidRentals.map(async rental => {
            const client = clients.find((c) => c.id === rental.customerId);
            return {
              client: client ? `${client.firstName} ${client.lastName}` : 'Client inconnu',
              amount: rental.totalCost - (rental.paidAmount || 0)
            };
          }))
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
    };

    fetchData();
  }, [currentUser]);

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
                {remainingToCollect.details.map((detail, index) => (
                  <Typography key={index} variant="body2" sx={{ pl: 2 }}>
                    • {detail.client}: {detail.amount} DA
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
    </Container>
  );
};

export default Dashboard;
