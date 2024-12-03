import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { subscriptionService } from '../services/subscriptionService';
import { invoiceService } from '../services/invoiceService';
import { Subscription } from '../models/subscription';
import { Invoice } from '../models/invoice';
import { auth } from '../config/firebase';
import { PLANS } from '../models/subscription';

const SubscriptionManagementPage: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      const [currentSubscription, userInvoices] = await Promise.all([
        subscriptionService.getCurrentSubscription(user.uid),
        invoiceService.getUserInvoices(user.uid)
      ]);

      setSubscription(currentSubscription);
      setInvoices(userInvoices);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlanId: 'starter' | 'pro' | 'enterprise') => {
    try {
      if (!subscription?.id) return;
      await subscriptionService.upgradePlan(subscription.id, newPlanId);
      await loadData();
      setOpenUpgradeDialog(false);
    } catch (err) {
      setError('Erreur lors de la mise à niveau');
      console.error(err);
    }
  };

  const handleSelectPlan = async (planId: 'starter' | 'pro' | 'enterprise', billingPeriod: 'monthly' | 'annual') => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      await subscriptionService.createSubscription(user.uid, planId, billingPeriod);
      await loadData();
    } catch (err) {
      setError('Erreur lors de la création de l\'abonnement');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'canceled':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Section Abonnement Actuel */}
      {subscription ? (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Votre Abonnement
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Plan actuel
                </Typography>
                <Typography variant="h6">
                  {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
                </Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle1" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  label={subscription.status}
                  color={getStatusColor(subscription.status)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Période de facturation
                </Typography>
                <Typography variant="h6">
                  {subscription.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                </Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle1" color="text.secondary">
                  Prochaine facturation
                </Typography>
                <Typography variant="h6">
                  {format(subscription.nextBillingDate, 'dd MMMM yyyy', { locale: fr })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenUpgradeDialog(true)}
                sx={{ mt: 2 }}
              >
                Changer de plan
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Choisissez votre plan
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Sélectionnez le plan qui correspond le mieux à vos besoins
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {PLANS.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" component="div" gutterBottom>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(plan.monthlyPrice)}
                    <Typography variant="caption" display="block">
                      par mois
                    </Typography>
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    {plan.features.map((feature, index) => (
                      <Typography key={index} sx={{ py: 0.5 }}>
                        • {feature}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => handleSelectPlan(plan.id, 'monthly')}
                      sx={{ mb: 1 }}
                    >
                      Choisir ce plan (Mensuel)
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      onClick={() => handleSelectPlan(plan.id, 'annual')}
                    >
                      Choisir ce plan (Annuel)
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Section Factures */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Historique des factures
        </Typography>
        <TableContainer>
          <Table>
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
                    {format(invoice.issueDate, 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{invoice.amount} DZD</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={invoice.status === 'paid' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small">
                      Télécharger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog de changement de plan */}
      <Dialog
        open={openUpgradeDialog}
        onClose={() => setOpenUpgradeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Changer de plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {PLANS.map((plan) => (
              <Grid item xs={12} md={4} key={plan.id}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    ...(subscription?.planId === plan.id && {
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }),
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {subscription?.billingPeriod === 'monthly'
                      ? `${plan.monthlyPrice} DZD`
                      : `${plan.annualPrice} DZD`}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    {plan.features.map((feature, index) => (
                      <Typography key={index} variant="body2" sx={{ my: 1 }}>
                        {feature}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    variant={subscription?.planId === plan.id ? 'outlined' : 'contained'}
                    color="primary"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={subscription?.planId === plan.id}
                    sx={{ mt: 2 }}
                  >
                    {subscription?.planId === plan.id
                      ? 'Plan actuel'
                      : 'Sélectionner'}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpgradeDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionManagementPage;
