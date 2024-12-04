import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Warning as WarningIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { Subscription, PLANS } from '../../models/subscription';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const UserSubscriptionStatus: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<{
    isValid: boolean;
    daysRemaining: number;
    status: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!currentUser) return;

      try {
        const [currentSubscription, subscriptionStatus] = await Promise.all([
          subscriptionService.getCurrentSubscription(currentUser.uid),
          subscriptionService.checkSubscriptionStatus(currentUser.uid),
        ]);

        setSubscription(currentSubscription);
        setStatus(subscriptionStatus);
      } catch (err) {
        console.error('Error loading subscription status:', err);
        setError('Erreur lors du chargement des informations d\'abonnement');
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, [currentUser]);

  const getPlan = () => {
    if (!subscription) return null;
    return PLANS.find(p => p.id === subscription.planId);
  };

  const getStatusColor = () => {
    if (!status) return 'default';
    if (!status.isValid) return 'error';
    if (status.daysRemaining <= 2) return 'warning';
    return 'success';
  };

  const getProgressValue = () => {
    if (!subscription || !status?.daysRemaining) return 0;
    const plan = getPlan();
    if (!plan) return 0;
    
    const totalDays = plan.duration;
    const elapsed = totalDays - status.daysRemaining;
    return (elapsed / totalDays) * 100;
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Chargement de votre abonnement...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!subscription || !status) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Aucun abonnement actif
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/subscription/plans')}
          sx={{ mt: 2 }}
        >
          Voir les plans disponibles
        </Button>
      </Box>
    );
  }

  const plan = getPlan();

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">
                  Votre Abonnement
                </Typography>
                <Chip
                  label={status.message || status.status}
                  color={getStatusColor()}
                  sx={{ fontWeight: 500 }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Plan {plan?.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {subscription.price === -1 
                        ? 'Prix sur devis'
                        : subscription.price === 0 
                          ? 'Gratuit'
                          : `${subscription.price.toLocaleString()} DZD/mois`
                      }
                    </Typography>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CarIcon color="action" />
                      Limite de véhicules: {
                        subscription.maxVehicles === -1 
                          ? 'Illimité'
                          : subscription.maxVehicles
                      }
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon color="action" />
                      Expire le: {format(subscription.endDate, 'dd MMMM yyyy', { locale: fr })}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon color="action" />
                      Statut: {
                        subscription.status === 'pending' 
                          ? 'En attente d\'approbation'
                          : subscription.status === 'trial'
                            ? 'Période d\'essai'
                            : 'Actif'
                      }
                    </Typography>
                  </Box>

                  {status.daysRemaining > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progression de la période
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressValue()}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Fonctionnalités incluses
                  </Typography>
                  <List dense>
                    {subscription.features.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>

              {(status.daysRemaining <= 7 || !status.isValid) && (
                <Alert
                  severity={status.isValid ? 'warning' : 'error'}
                  icon={<WarningIcon />}
                  sx={{ mt: 3 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => navigate('/subscription/plans')}
                    >
                      Mettre à niveau
                    </Button>
                  }
                >
                  {status.message || 'Votre abonnement va bientôt expirer. Pensez à le renouveler.'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserSubscriptionStatus;
