import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  Toolbar,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  setDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PLANS, PlanType } from '../models/subscription';
import { subscriptionService } from '../services/subscriptionService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserData {
  email?: string;
  displayName?: string;
  companyName?: string;
  phoneNumber?: string;
  fullName?: string;
}

interface FirestoreSubscription {
  userId: string;
  planId: PlanType;
  status: 'trial' | 'pending' | 'active' | 'expired' | 'suspended';
  startDate: Timestamp;
  endDate: Timestamp;
  nextBillingDate: Timestamp;
  maxVehicles: number;
  maxExpenses: number;
  features: string[];
  price: number;
  billingPeriod: 'monthly' | 'annual';
}

interface Subscription {
  id?: string;
  userId: string;
  planId: PlanType;
  status: 'trial' | 'pending' | 'active' | 'expired' | 'suspended';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  maxVehicles: number;
  maxExpenses: number;
  features: string[];
  price: number;
  billingPeriod: 'monthly' | 'annual';
}

interface NewSubscription extends Subscription {
  userName?: string;
  companyName?: string;
  phoneNumber?: string;
  email?: string;
}

interface SubscriptionWithUser extends Subscription {
  userName: string;
  userData?: UserData;
}

const AdminSubscriptionPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newSubscription, setNewSubscription] = useState<NewSubscription>({
    userId: '',
    planId: 'basic',
    status: 'pending',
    billingPeriod: 'monthly',
    startDate: new Date(),
    endDate: new Date(),
    nextBillingDate: new Date(),
    maxVehicles: 0,
    maxExpenses: 0,
    features: [],
    price: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchTermLower = searchTerm.toLowerCase();
    const userName = (sub.userName || '').toLowerCase();
    const userId = (sub.userId || '').toLowerCase();
    const planId = (sub.planId || '').toLowerCase();
    const status = (sub.status || '').toLowerCase();

    return userName.includes(searchTermLower) ||
           userId.includes(searchTermLower) ||
           planId.includes(searchTermLower) ||
           status.includes(searchTermLower);
  });

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      try {
        await deleteDoc(doc(db, 'subscriptions', subscriptionId));
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression de l\'abonnement');
      }
    }
  };

  const handleAddSubscription = async () => {
    try {
      const userRef = doc(db, 'users', newSubscription.userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: newSubscription.email,
          displayName: newSubscription.userName,
          companyName: newSubscription.companyName,
          phoneNumber: newSubscription.phoneNumber,
        } as UserData);
      }

      const firestoreData: FirestoreSubscription = {
        userId: newSubscription.userId,
        planId: newSubscription.planId,
        status: newSubscription.status,
        billingPeriod: newSubscription.billingPeriod,
        startDate: Timestamp.fromDate(newSubscription.startDate),
        endDate: Timestamp.fromDate(newSubscription.endDate),
        nextBillingDate: Timestamp.fromDate(newSubscription.nextBillingDate),
        maxVehicles: newSubscription.maxVehicles,
        maxExpenses: newSubscription.maxExpenses,
        features: newSubscription.features,
        price: newSubscription.price,
      };

      if (isEditing && selectedSubscription?.id) {
        await updateDoc(doc(db, 'subscriptions', selectedSubscription.id), firestoreData as { [key: string]: any });
      } else {
        await addDoc(collection(db, 'subscriptions'), firestoreData);
      }

      setOpenNewDialog(false);
      setIsEditing(false);
      fetchSubscriptions();
    } catch (err) {
      console.error('Erreur lors de l\'opération:', err);
      setError('Erreur lors de l\'opération sur l\'abonnement');
    }
  };

  const handleEditSubscription = (subscription: SubscriptionWithUser) => {
    setIsEditing(true);
    setNewSubscription({
      ...subscription,
      userName: subscription.userName,
      email: subscription.userData?.email,
      companyName: subscription.userData?.companyName,
      phoneNumber: subscription.userData?.phoneNumber,
      maxExpenses: subscription.maxExpenses || 0,
    });
    setOpenNewDialog(true);
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const querySnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptionsData: SubscriptionWithUser[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        try {
          const data = docSnapshot.data();
          
          // Vérifier si l'userId existe
          if (!data.userId) {
            console.warn('Document sans userId trouvé:', docSnapshot.id);
            continue;
          }

          const userRef = doc(db, 'users', data.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data() as UserData | undefined;
          
          // Conversion sécurisée des dates
          const now = new Date();
          const startDate = data.startDate?.toDate?.() || now;
          const endDate = data.endDate?.toDate?.() || now;
          const nextBillingDate = data.nextBillingDate?.toDate?.() || now;
          
          // S'assurer que toutes les propriétés requises sont définies
          const subscription: SubscriptionWithUser = {
            id: docSnapshot.id,
            userId: data.userId,
            planId: data.planId || 'basic',
            status: data.status || 'pending',
            startDate,
            endDate,
            nextBillingDate,
            maxVehicles: typeof data.maxVehicles === 'number' ? data.maxVehicles : 0,
            maxExpenses: typeof data.maxExpenses === 'number' ? data.maxExpenses : 0,
            features: Array.isArray(data.features) ? data.features : [],
            price: typeof data.price === 'number' ? data.price : 0,
            billingPeriod: data.billingPeriod || 'monthly',
            userName: userData?.displayName || 'Utilisateur ' + data.userId.substring(0, 4),
            userData: {
              email: userData?.email,
              displayName: userData?.displayName,
              companyName: userData?.companyName,
              phoneNumber: userData?.phoneNumber,
            }
          };

          subscriptionsData.push(subscription);
        } catch (docError) {
          console.error('Erreur lors du traitement d\'un abonnement:', docError, 'Document ID:', docSnapshot.id);
          // Continue avec le prochain document au lieu d'arrêter complètement
          continue;
        }
      }

      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Erreur lors de la récupération des abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (subscription: SubscriptionWithUser) => {
    try {
      const userRef = doc(db, 'users', subscription.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as UserData;
      
      setSelectedSubscription({
        ...subscription,
        userData: userData || {
          email: undefined,
          displayName: undefined,
          companyName: undefined,
          phoneNumber: undefined,
        },
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Erreur lors de la récupération des détails utilisateur');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Abonnements
      </Typography>

      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
        <TextField
          variant="outlined"
          placeholder="Rechercher..."
          size="small"
          sx={{ mr: 2, minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={handleSearchChange}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewDialog(true)}
        >
          Nouvel Abonnement
        </Button>
      </Toolbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UTILISATEUR</TableCell>
              <TableCell>PLAN</TableCell>
              <TableCell>STATUT</TableCell>
              <TableCell>DATE DE DÉBUT</TableCell>
              <TableCell>JOURS RESTANTS</TableCell>
              <TableCell>PRIX</TableCell>
              <TableCell>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun abonnement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.userName}</TableCell>
                  <TableCell>{subscription.planId}</TableCell>
                  <TableCell>
                    <Chip
                      label={subscription.status}
                      color={
                        subscription.status === 'active' ? 'success' :
                        subscription.status === 'trial' ? 'info' :
                        subscription.status === 'pending' ? 'warning' :
                        'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(subscription.startDate, 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                  </TableCell>
                  <TableCell>{subscription.price} DZD</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(subscription)}
                      title="Voir les détails"
                    >
                      <InfoIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditSubscription(subscription)}
                      title="Modifier"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubscription(subscription.id!)}
                      title="Supprimer"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog des détails */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de l'Abonnement</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Nom complet:</strong> {selectedSubscription.userData?.fullName || selectedSubscription.userData?.displayName || 'Non spécifié'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Email:</strong> {selectedSubscription.userData?.email || 'Non spécifié'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Entreprise:</strong> {selectedSubscription.userData?.companyName || 'Non spécifié'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Téléphone:</strong> {selectedSubscription.userData?.phoneNumber || 'Non spécifié'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Plan:</strong> {selectedSubscription.planId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Statut:</strong> {selectedSubscription.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Prix:</strong> {selectedSubscription.price} DZD
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Période de facturation:</strong> {selectedSubscription.billingPeriod === 'monthly' ? 'Mensuelle' : 'Annuelle'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date de début:</strong> {format(selectedSubscription.startDate, 'dd MMMM yyyy', { locale: fr })}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date de fin:</strong> {format(selectedSubscription.endDate, 'dd MMMM yyyy', { locale: fr })}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Prochaine facturation:</strong> {format(selectedSubscription.nextBillingDate, 'dd MMMM yyyy', { locale: fr })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'ajout/modification d'abonnement */}
      <Dialog open={openNewDialog} onClose={() => {
        setOpenNewDialog(false);
        setIsEditing(false);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Modifier l\'abonnement' : 'Nouvel Abonnement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Informations Utilisateur
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID Utilisateur"
                  value={newSubscription.userId}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, userId: e.target.value }))}
                  margin="normal"
                  disabled={isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom complet"
                  value={newSubscription.userName || ''}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, userName: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={newSubscription.email || ''}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, email: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={newSubscription.phoneNumber || ''}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom de l'entreprise"
                  value={newSubscription.companyName || ''}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, companyName: e.target.value }))}
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Détails de l'Abonnement
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Plan"
                  value={newSubscription.planId}
                  onChange={(e) => {
                    const selectedPlan = PLANS.find(p => p.id === e.target.value);
                    setNewSubscription(prev => ({
                      ...prev,
                      planId: e.target.value as PlanType,
                      maxVehicles: selectedPlan?.maxVehicles || 0,
                      features: selectedPlan?.features || [],
                      price: selectedPlan?.monthlyPrice || 0,
                    }));
                  }}
                  margin="normal"
                >
                  {PLANS.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Statut"
                  value={newSubscription.status}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, status: e.target.value as 'trial' | 'pending' | 'active' | 'expired' | 'suspended' }))}
                  margin="normal"
                >
                  <MenuItem value="trial">Essai</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="expired">Expiré</MenuItem>
                  <MenuItem value="suspended">Suspendu</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Période de facturation"
                  value={newSubscription.billingPeriod}
                  onChange={(e) => {
                    const period = e.target.value as 'monthly' | 'annual';
                    const selectedPlan = PLANS.find(p => p.id === newSubscription.planId);
                    setNewSubscription(prev => ({
                      ...prev,
                      billingPeriod: period,
                      price: period === 'monthly' ? selectedPlan?.monthlyPrice || 0 : selectedPlan?.annualPrice || 0,
                    }));
                  }}
                  margin="normal"
                >
                  <MenuItem value="monthly">Mensuelle</MenuItem>
                  <MenuItem value="annual">Annuelle</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prix"
                  value={newSubscription.price}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, price: Number(e.target.value) }))}
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">DZD</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Nombre max de véhicules"
                  value={newSubscription.maxVehicles}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, maxVehicles: Number(e.target.value) }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Nombre max de dépenses"
                  value={newSubscription.maxExpenses}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, maxExpenses: Number(e.target.value) }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de début"
                  value={format(newSubscription.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de fin"
                  value={format(newSubscription.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenNewDialog(false);
            setIsEditing(false);
          }}>
            Annuler
          </Button>
          <Button onClick={handleAddSubscription} variant="contained" color="primary">
            {isEditing ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdminSubscriptionPage;
