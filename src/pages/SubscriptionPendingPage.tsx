import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { Subscription } from '../models/subscription';

const SubscriptionPendingPage: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const sub = await subscriptionService.getCurrentSubscription(currentUser.uid);
        setSubscription(sub);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'abonnement:', err);
        setError('Une erreur est survenue lors de la récupération de votre abonnement');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
    
    // Vérifier le statut toutes les 30 secondes
    const interval = setInterval(fetchSubscription, 30000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!subscription) {
    return (
      <Container maxWidth="sm">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Aucun abonnement en attente trouvé
        </Alert>
      </Container>
    );
  }

  if (subscription.status === 'active') {
    navigate('/dashboard');
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Demande d'abonnement en cours
        </Typography>

        <Box sx={{ textAlign: 'center', my: 4 }}>
          <CircularProgress size={60} thickness={4} />
        </Box>

        <Typography variant="h6" gutterBottom align="center">
          Votre demande est en cours d'examen
        </Typography>

        <Typography color="text.secondary" align="center" paragraph>
          Nous examinons actuellement votre demande d'abonnement {subscription.planId.toUpperCase()}. 
          Vous recevrez une notification dès que votre demande sera traitée.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/subscription-plans')}
          >
            Modifier mon choix
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubscriptionPendingPage;
