import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, query, where, getDocs, orderBy, Timestamp, onSnapshot, doc as firestoreDoc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subscription } from '../models/subscription';

interface UserSubscriptionRequest {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  phoneNumber: string;
  subscriptionRequest: {
    planId: string;
    planName: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
  };
  createdAt: Timestamp;
}

interface UserData {
  email: string;
  companyName: string;
}

interface SubscriptionWithUserDetails extends Subscription {
  userEmail?: string;
  companyName?: string;
  createdAt?: Date;
}

interface FirestoreSubscriptionData {
  userId: string;
  planId: 'starter' | 'pro' | 'enterprise';
  status: 'trial' | 'pending' | 'active' | 'canceled' | 'expired';
  billingPeriod: 'monthly' | 'annual';
  startDate: any;
  endDate: any;
  lastBillingDate: any;
  nextBillingDate: any;
  maxVehicles: number;
  features: string[];
  price: number;
  createdAt: any;
}

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

const safeDate = (dateField: any): Date => {
  if (!dateField) return new Date();
  if (dateField instanceof Date) return dateField;
  if (dateField.toDate && typeof dateField.toDate === 'function') return dateField.toDate();
  if (typeof dateField === 'string' || typeof dateField === 'number') return new Date(dateField);
  return new Date();
};

const AdminSubscriptionPage: React.FC = () => {
  const [subscriptionRequests, setSubscriptionRequests] = useState<UserSubscriptionRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserSubscriptionRequest | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUserDetails[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubscriptionRequests = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('subscriptionRequest.status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const requests: UserSubscriptionRequest[] = [];
          snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as UserSubscriptionRequest);
          });
          setSubscriptionRequests(requests);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching subscription requests:', error);
        setError('Erreur lors du chargement des demandes d\'abonnement');
        setLoading(false);
      }
    };

    fetchSubscriptionRequests();

    loadSubscriptions();
    // Écouter les nouvelles notifications
    const unsubscribe = onSnapshot(
      query(collection(db, 'notifications'), where('status', '==', 'unread')),
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(newNotifications);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors

      const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
      const q = query(
        subscriptionsRef,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const subscriptionsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data() as FirestoreSubscriptionData;
          
          // Create base subscription object with type safety
          const subscription: SubscriptionWithUserDetails = {
            id: doc.id,
            userId: data.userId,
            planId: data.planId,
            status: data.status,
            billingPeriod: data.billingPeriod,
            startDate: safeDate(data.startDate),
            endDate: safeDate(data.endDate),
            lastBillingDate: safeDate(data.lastBillingDate),
            nextBillingDate: safeDate(data.nextBillingDate),
            maxVehicles: data.maxVehicles ?? 10,
            features: Array.isArray(data.features) ? data.features : [],
            price: typeof data.price === 'number' ? data.price : 0,
            createdAt: safeDate(data.createdAt)
          };

          try {
            if (!data.userId) {
              console.warn('Subscription document missing userId:', doc.id);
              return subscription;
            }

            // Fetch user details
            const userDocRef = firestoreDoc(db, 'users', data.userId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserData;
              if (userData && userData.email && userData.companyName) {
                subscription.userEmail = userData.email;
                subscription.companyName = userData.companyName;
              } else {
                console.warn(`User document missing required fields for userId: ${data.userId}`);
              }
            } else {
              console.warn(`User document not found for userId: ${data.userId}`);
            }
          } catch (error) {
            console.error(`Error fetching user details for subscription ${doc.id}:`, error);
          }

          return subscription;
        })
      );

      setSubscriptions(subscriptionsData);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Error loading subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: UserSubscriptionRequest) => {
    try {
      const userRef = firestoreDoc(db, 'users', request.id);
      const subscriptionRef = firestoreDoc(collection(db, SUBSCRIPTIONS_COLLECTION));
      
      const now = serverTimestamp();
      
      // Create subscription document
      await setDoc(subscriptionRef, {
        userId: request.id,
        planId: request.subscriptionRequest.planId,
        planName: request.subscriptionRequest.planName,
        price: request.subscriptionRequest.price,
        startDate: now,
        endDate: now, // Sera mis à jour par une fonction Cloud
        lastBillingDate: now,
        nextBillingDate: now, // Sera mis à jour par une fonction Cloud
        status: 'active',
        billingPeriod: 'monthly',
        maxVehicles: 10,
        features: [],
        createdAt: now
      });

      // Update user document
      await updateDoc(userRef, {
        'subscriptionRequest.status': 'approved',
        'subscription': {
          planId: request.subscriptionRequest.planId,
          planName: request.subscriptionRequest.planName,
          price: request.subscriptionRequest.price,
          startDate: now,
          status: 'active',
          billingPeriod: 'monthly',
          maxVehicles: 10,
          features: []
        },
        'isActive': true
      });

      // Reload subscriptions
      await loadSubscriptions();
    } catch (error) {
      console.error('Error approving subscription:', error);
      setError('Erreur lors de l\'approbation de l\'abonnement');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const userRef = firestoreDoc(db, 'users', selectedRequest.id);
      await updateDoc(userRef, {
        'subscriptionRequest.status': 'rejected',
        'subscriptionRequest.rejectionReason': rejectionReason,
      });
      setIsDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      // You might want to send an email notification here
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      setError('Erreur lors du rejet de l\'abonnement');
    }
  };

  const handleViewDetails = async (subscription: SubscriptionWithUserDetails) => {
    setSelectedSubscription(subscription);
    try {
      const userInvoices = await getDocs(
        query(collection(db, 'invoices'), where('userId', '==', subscription.userId))
      );
      const invoicesData = userInvoices.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);
      setOpenDialog(true);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
    }
  };

  const handleValidatePayment = async (invoiceId: string) => {
    try {
      const invoiceRef = firestoreDoc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: 'paid'
      });
      // Recharger les factures
      if (selectedSubscription) {
        const updatedInvoices = await getDocs(
          query(collection(db, 'invoices'), where('userId', '==', selectedSubscription.userId))
        );
        const invoicesData = updatedInvoices.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvoices(invoicesData);
      }
    } catch (err) {
      console.error('Erreur lors de la validation du paiement:', err);
    }
  };

  const handleApproveSubscription = async (subscriptionId: string) => {
    try {
      const subscriptionRef = firestoreDoc(db, 'subscriptions', subscriptionId);
      await updateDoc(subscriptionRef, {
        status: 'active'
      });
      // Mettre à jour le statut de la notification
      const notif = notifications.find(n => n.subscriptionId === subscriptionId);
      if (notif) {
        await updateDoc(firestoreDoc(db, 'notifications', notif.id), {
          status: 'read'
        });
      }
      loadSubscriptions();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      setError('Erreur lors de l\'approbation de l\'abonnement');
    }
  };

  const handleRejectSubscription = async (subscriptionId: string) => {
    try {
      const subscriptionRef = firestoreDoc(db, 'subscriptions', subscriptionId);
      await updateDoc(subscriptionRef, {
        status: 'canceled'
      });
      // Mettre à jour le statut de la notification
      const notif = notifications.find(n => n.subscriptionId === subscriptionId);
      if (notif) {
        await updateDoc(firestoreDoc(db, 'notifications', notif.id), {
          status: 'read'
        });
      }
      loadSubscriptions();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      setError('Erreur lors du rejet de l\'abonnement');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Demandes d'abonnement
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Entreprise</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Date de demande</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptionRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.companyName}</TableCell>
                <TableCell>
                  <Typography variant="body2">{request.fullName}</Typography>
                  <Typography variant="body2" color="textSecondary">{request.email}</Typography>
                  <Typography variant="body2" color="textSecondary">{request.phoneNumber}</Typography>
                </TableCell>
                <TableCell>{request.subscriptionRequest.planName}</TableCell>
                <TableCell>{request.subscriptionRequest.price}€/mois</TableCell>
                <TableCell>
                  {format(new Date(request.subscriptionRequest.requestDate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Tooltip title="Approuver">
                    <IconButton
                      color="primary"
                      onClick={() => handleApprove(request)}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rejeter">
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {subscriptionRequests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune demande d'abonnement en attente
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Abonnements
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Entreprise</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.companyName}</TableCell>
                  <TableCell>{subscription.userEmail}</TableCell>
                  <TableCell>{subscription.planId}</TableCell>
                  <TableCell>
                    {subscription.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subscription.status}
                      color={
                        subscription.status === 'active' ? 'success' :
                        subscription.status === 'pending' ? 'warning' :
                        subscription.status === 'trial' ? 'info' :
                        'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {subscription.createdAt && format(subscription.createdAt, 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {subscription.status === 'pending' && (
                      <>
                        <Tooltip title="Approuver">
                          <IconButton
                            color="success"
                            onClick={() => handleApproveSubscription(subscription.id!)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter">
                          <IconButton
                            color="error"
                            onClick={() => handleRejectSubscription(subscription.id!)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {subscription.status === 'active' && (
                      <Tooltip title="Voir les détails">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetails(subscription)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Rejeter la demande d'abonnement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Motif du rejet"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleReject} color="error">
            Confirmer le rejet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails de l'abonnement
          {selectedSubscription?.companyName && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedSubscription.companyName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informations de l'abonnement
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Email:
                </Typography>
                <Typography variant="body1">
                  {selectedSubscription?.userEmail}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Plan:
                </Typography>
                <Typography variant="body1">
                  {selectedSubscription?.planId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Statut:
                </Typography>
                <Chip
                  label={selectedSubscription?.status}
                  size="small"
                  color={getStatusColor(selectedSubscription?.status || '')}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Période de facturation:
                </Typography>
                <Typography variant="body1">
                  {selectedSubscription?.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" gutterBottom>
            Factures
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Numéro</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.number}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{invoice.amount}€</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size="small"
                        color={invoice.status === 'paid' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'pending' && (
                        <Tooltip title="Valider le paiement">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => invoice.id && handleValidatePayment(invoice.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminSubscriptionPage;
