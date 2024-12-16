import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Box, Typography, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface SubscriptionStatus {
  status: 'pending' | 'active' | 'cancelled';
  plan: string;
}

// HOC pour vérifier l'état de l'abonnement
export const withSubscriptionCheck = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithSubscriptionCheckComponent(props: P) {
    const { currentUser } = useAuth();
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      const checkSubscription = async () => {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.data();
          
          if (userData?.subscription) {
            setSubscriptionStatus(userData.subscription);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'abonnement:', error);
        }
        
        setLoading(false);
      };

      checkSubscription();
    }, [currentUser]);

    if (loading) {
      return <Box sx={{ p: 3 }}>Chargement...</Box>;
    }

    if (!subscriptionStatus || subscriptionStatus.status === 'pending') {
      return (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 800,
            mx: 'auto',
            mt: 4
          }}
        >
          <Typography variant="h5" gutterBottom>
            Compte en attente d'activation
          </Typography>

          <Box sx={{ my: 4, textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} />
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Votre compte est actuellement en attente d'activation. Un administrateur doit approuver votre abonnement avant que vous puissiez accéder à toutes les fonctionnalités.
          </Alert>

          {subscriptionStatus && (
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
                    {subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)}
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
          </Box>
        </Box>
      );
    }

    if (subscriptionStatus.status === 'cancelled') {
      return (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            mt: 4
          }}
        >
          <Typography variant="h5" gutterBottom>
            Abonnement expiré
          </Typography>
          <Typography color="text.secondary" paragraph>
            Votre abonnement a expiré. Pour continuer à utiliser nos services, veuillez renouveler votre abonnement.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/subscription-plans')}
            sx={{ mt: 2 }}
          >
            Renouveler l'abonnement
          </Button>
        </Box>
      );
    }

    // Si l'abonnement est actif, afficher le composant normalement
    return <WrappedComponent {...props} />;
  };
};
