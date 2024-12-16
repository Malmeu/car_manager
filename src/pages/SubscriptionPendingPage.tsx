import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { Subscription } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SubscriptionPendingPage: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const sub = await subscriptionService.getCurrentSubscription(currentUser.uid);
        setSubscription(sub);

        // Si l'abonnement est actif, rediriger automatiquement vers le dashboard
        if (sub?.status === 'active') {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'abonnement:', err);
        setError('Une erreur est survenue lors de la vérification de votre abonnement');
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionStatus();
    // Vérifier le statut toutes les 30 secondes
    const interval = setInterval(checkSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  const handleProfileClick = () => {
    // Permettre d'aller au dashboard même si l'abonnement est en attente
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Compte en attente d'activation
        </Typography>

        <Box sx={{ my: 4, textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Votre compte est actuellement en attente d'activation. Un administrateur doit approuver votre abonnement avant que vous puissiez accéder à toutes les fonctionnalités.
        </Alert>

        {subscription && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Détails de votre abonnement
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Plan choisi
                </Typography>
                <Typography variant="body1">
                  {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date de début
                </Typography>
                <Typography variant="body1">
                  {format(subscription.startDate, 'dd MMMM yyyy', { locale: fr })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Typography variant="body1" color="warning.main">
                  En attente d'approbation
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/subscription-plans')}
          >
            Modifier mon abonnement
          </Button>
          <Button
            variant="contained"
            onClick={handleProfileClick}
          >
            Mon profil
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubscriptionPendingPage;
