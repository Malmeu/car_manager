import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  Tooltip,
  Paper,
  CircularProgress,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import PaidIcon from '@mui/icons-material/Paid';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';
import { getAllVehicles } from '../services/vehicleService';
import { getAllRentals, Rental } from '../services/rentalService';
import { Customer, Vehicle } from '../types';
import { getAllCustomers } from '../services/customerService';
import { Person as PersonIcon, DirectionsCar as CarIcon, CalendarMonth as CalendarIcon, Add as AddIcon, Key as KeyIcon, Description as ContractIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CalendarModal } from './Calendar';
import { isSameMonth } from 'date-fns';

// Définition des couleurs pastel
const pastelColors = {
  blue: '#E3F2FD',
  green: '#E8F5E9',
  purple: '#F3E5F5',
  orange: '#FFF3E0',
  pink: '#FCE4EC',
  yellow: '#FFFDE7',
  cyan: '#E0F7FA',
  lime: '#F9FBE7'
};

interface InfoCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  tooltip?: string;
}

// Composant pour les cartes d'information
const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon: Icon, color, tooltip }) => {
  return (
    <Card 
      sx={{ 
        minHeight: 160, 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: color,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              {title}
              {tooltip && (
                <Tooltip title={tooltip}>
                  <InfoIcon sx={{ ml: 1, fontSize: 16 }} />
                </Tooltip>
              )}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

interface DashboardStats {
  activeRentalsAmount: number;  // Montant total des locations en cours
  partialPayments: number;      // Total des paiements partiels versés
  remainingToCollect: number;   // Reste à encaisser
  totalCashflow: number;        // Total historique de la caisse
  currentRevenue: number;       // Revenus encaissés des locations actives/réservations
}

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

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [availableCars, setAvailableCars] = useState<AvailableCars>({ total: 0, details: [] });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeRentalsAmount: 0,
    partialPayments: 0,
    remainingToCollect: 0,
    totalCashflow: 0,
    currentRevenue: 0
  });
  const [showRemainingDetails, setShowRemainingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companyName = localStorage.getItem('companyName') || 'Votre Entreprise';
  const [openNewCustomerDialog, setOpenNewCustomerDialog] = useState(false);
  const [openNewVehicleDialog, setOpenNewVehicleDialog] = useState(false);
  const [openNewRentalDialog, setOpenNewRentalDialog] = useState(false);
  const [openNewContractDialog, setOpenNewContractDialog] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser || loading) return;

      try {
        setError(null);
        // Récupérer les locations
        const rentalsRef = collection(db, 'rentals');
        const rentalsQuery = query(
          rentalsRef,
          where('userId', '==', currentUser.uid)
        );
        const rentalsSnapshot = await getDocs(rentalsQuery);

        let activeRentalsList: any[] = [];
        let activeRentalsAmount = 0;
        let partialPayments = 0;
        let remainingToCollect = 0;
        let totalCashflow = 0;
        let currentRevenue = 0;

        rentalsSnapshot.forEach((doc) => {
          const rental = doc.data();
          const totalAmount = (rental.totalCost || 0) + (rental.additionalFees?.amount || 0);
          const paidAmount = rental.paymentStatus === 'paid' ? totalAmount : (rental.paidAmount || 0);

          // Calculer le total de la caisse (somme de tous les paiements reçus)
          totalCashflow += paidAmount;

          if (rental.status === 'active') {
            activeRentalsList.push(rental);
            activeRentalsAmount += totalAmount;
            
            if (rental.paymentStatus === 'partial') {
              partialPayments += paidAmount;
              remainingToCollect += (totalAmount - paidAmount);
            } else if (rental.paymentStatus === 'pending') {
              remainingToCollect += totalAmount;
            }
          }

          // Calculer les revenus du mois en cours
          const rentalDate = rental.startDate.toDate();
          if (isSameMonth(rentalDate, new Date()) && rental.paymentStatus === 'paid') {
            currentRevenue += totalAmount;
          }
        });

        setDashboardStats({
          activeRentalsAmount,
          partialPayments,
          remainingToCollect,
          totalCashflow,
          currentRevenue
        });

        setActiveRentals(activeRentalsList.length);

        // Récupérer les véhicules et clients
        const [vehicles, customers] = await Promise.all([
          getAllVehicles(currentUser.uid),
          getAllCustomers(currentUser.uid)
        ]);

        setTotalVehicles(vehicles.length);
        setTotalClients(customers.length);

        // Calculer les véhicules disponibles
        const availableCarsDetails = vehicles
          .filter(vehicle => !activeRentalsList.some(rental => 
            rental.vehicleId === vehicle.id
          ))
          .map(vehicle => `${vehicle.brand} ${vehicle.model}`);

        setAvailableCars({
          total: availableCarsDetails.length,
          details: availableCarsDetails
        });

      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setError('Erreur lors de la récupération des données');
      }
    };

    fetchDashboardData();
  }, [currentUser, loading]);

  useEffect(() => {
    const rentalsRef = collection(db, 'rentals');
    
    // Écouter les changements dans la collection rentals
    const unsubscribe = onSnapshot(rentalsRef, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const rental = doc.data();
        if (rental.paymentStatus === 'paid') {
          total += rental.totalAmount || 0;
        }
      });
      setDashboardStats(prevState => ({ ...prevState, totalCashflow: total }));
    });

    // Nettoyer l'écouteur
    return () => unsubscribe();
  }, []); // S'exécute une fois au montage

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
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
    <Container maxWidth="xl">
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <SpeedDial
          ariaLabel="Accès rapide"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<PersonIcon />}
            tooltipTitle="Nouveau client"
            onClick={() => navigate('/customers', { state: { openNewCustomer: true } })}
          />
          <SpeedDialAction
            icon={<CarIcon />}
            tooltipTitle="Nouveau véhicule"
            onClick={() => navigate('/vehicles', { state: { openNewVehicle: true } })}
          />
          <SpeedDialAction
            icon={<KeyIcon />}
            tooltipTitle="Nouvelle location"
            onClick={() => navigate('/rentals', { state: { openNewRental: true } })}
          />
          <SpeedDialAction
            icon={<ContractIcon />}
            tooltipTitle="Nouveau contrat"
            onClick={() => navigate('/contracts', { state: { openNewContract: true } })}
          />
        </SpeedDial>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Tooltip title="Calendrier des locations">
            <IconButton 
              color="primary" 
              onClick={() => setOpenCalendar(true)}
              sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <CalendarIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <CalendarModal 
          open={openCalendar}
          onClose={() => setOpenCalendar(false)}
        />

        {/* Première ligne */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Total Véhicules"
              value={totalVehicles}
              icon={DirectionsCarIcon}
              color={pastelColors.blue}
              tooltip="Nombre total de véhicules dans la flotte"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Total Clients"
              value={totalClients}
              icon={PeopleIcon}
              color={pastelColors.green}
              tooltip="Nombre total de clients enregistrés"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Véhicules Disponibles"
              value={availableCars.total}
              icon={EventAvailableIcon}
              color={pastelColors.purple}
              tooltip="Véhicules actuellement disponibles à la location"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Réservations"
              value={activeRentals}
              icon={BookOnlineIcon}
              color={pastelColors.orange}
              tooltip="Nombre de réservations en cours"
            />
          </Grid>
        </Grid>

        {/* Deuxième ligne */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Revenus Encaissés"
              value={`${dashboardStats.currentRevenue.toLocaleString()} DA`}
              icon={PaidIcon}
              color={pastelColors.pink}
              tooltip="Montant total encaissé des locations et réservations en cours"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Paiements Partiels"
              value={`${dashboardStats.partialPayments.toLocaleString()} DA`}
              icon={AccountBalanceWalletIcon}
              color={pastelColors.yellow}
              tooltip="Total des paiements partiels versés pour les locations en cours"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Reste à Encaisser"
              value={`${dashboardStats.remainingToCollect.toLocaleString()} DA`}
              icon={ReceiptLongIcon}
              color={pastelColors.cyan}
              tooltip="Montant restant à percevoir sur les locations en cours"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoCard
              title="Total Caisse"
              value={`${dashboardStats.totalCashflow.toLocaleString()} DA`}
              icon={LocalAtmIcon}
              color={pastelColors.lime}
              tooltip="Montant total historique de la caisse (toutes les locations)"
            />
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
              {/* TODO: Afficher les détails des paiements en attente */}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRemainingDetails(false)} color="primary">
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Exporter le composant sans la vérification d'abonnement
export default Dashboard;
