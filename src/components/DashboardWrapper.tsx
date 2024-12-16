import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Dashboard from './Dashboard';

interface SubscriptionStatus {
  status: 'pending' | 'active' | 'cancelled';
  plan: string;
}

const DashboardWrapper: React.FC = () => {
  const { currentUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Afficher le dashboard avec une bannière d'avertissement si l'abonnement est en attente
  if (!subscriptionStatus || subscriptionStatus.status === 'pending') {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1">
            Votre compte est en attente d'activation. Certaines fonctionnalités peuvent être limitées jusqu'à l'approbation de votre abonnement.
          </Typography>
        </Alert>
        <Dashboard />
      </Box>
    );
  }

  // Si l'abonnement est annulé, afficher un message
  if (subscriptionStatus.status === 'cancelled') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Abonnement expiré
        </Typography>
        <Typography color="text.secondary">
          Votre abonnement a expiré. Pour continuer à utiliser nos services, veuillez renouveler votre abonnement.
        </Typography>
      </Box>
    );
  }

  // Si l'abonnement est actif, afficher le dashboard normalement
  return <Dashboard />;
};

export default DashboardWrapper;
