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
  CircularProgress
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
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';
import { CalendarButton } from './Calendar';
import { getAllVehicles } from '../services/vehicleService';
import { getAllRentals, Rental } from '../services/rentalService';
import { Customer, Vehicle } from '../types';
import { getAllCustomers } from '../services/customerService';

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
    <Paper sx={{ height: '100%', bgcolor: color, p: 2 }}>
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
    </Paper>
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (loading) return;
      
      if (!currentUser) {
        setError('Utilisateur non connecté');
        return;
      }

      try {
        setError(null);
        // Récupérer toutes les locations
        const rentals = await getAllRentals(currentUser.uid);
        
        // Calculer les statistiques
        const currentDate = new Date();
        let activeRentalsAmount = 0;      // Montant total des locations actives
        let partialPayments = 0;          // Paiements partiels
        let remainingToCollect = 0;       // Reste à encaisser
        let totalCashflow = 0;            // Total historique de la caisse
        let currentRevenue = 0;           // Revenus encaissés des locations actives/réservations
        
        // Filtrer les locations actives et calculer les montants
        const activeRentalsList = rentals.filter(rental => {
          const endDate = rental.endDate.toDate();
          const startDate = rental.startDate.toDate();
          return endDate >= currentDate && rental.status === 'reservation';
        });

        // Liste des locations en cours
        const currentRentalsList = rentals.filter(rental => {
          return rental.status === 'active';
        });

        // Calculer les montants pour les réservations et locations actives
        [...activeRentalsList, ...currentRentalsList].forEach(rental => {
          const rentalAmount = rental.totalCost + (rental.additionalFees?.amount || 0);
          const paidAmount = rental.paidAmount || 0;
          
          // Ajouter au montant total des locations actives
          activeRentalsAmount += rentalAmount;
          
          // Calculer le reste à encaisser seulement pour les locations non payées
          if ((rental.status === 'active' || rental.status === 'reservation') && 
              rental.paymentStatus !== 'paid' && 
              paidAmount < rentalAmount) {
            remainingToCollect += rentalAmount - paidAmount;
          }
          
          // Calculer les paiements partiels
          if (paidAmount > 0 && paidAmount < rentalAmount && rental.paymentStatus === 'partial') {
            partialPayments += paidAmount;
          }

          // Ajouter aux revenus encaissés si un paiement a été reçu
          if (paidAmount > 0) {
            currentRevenue += paidAmount;
          }
        });

        // Calculer le total historique de la caisse (toutes les locations)
        rentals.forEach(rental => {
          const paidAmount = rental.paidAmount || 0;
          if (paidAmount > 0) {
            totalCashflow += paidAmount;
          }
        });

        // Mettre à jour les stats
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <CalendarButton />
        </Box>
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
