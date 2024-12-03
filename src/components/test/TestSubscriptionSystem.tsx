import React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { createTestSubscription, createExpiredSubscription } from '../../utils/testSubscription';

const TestSubscriptionSystem: React.FC = () => {
  const { currentUser } = useAuth();

  const handleCreateTestSubscription = async () => {
    if (!currentUser) return;
    try {
      await createTestSubscription(currentUser.uid);
      alert('Abonnement de test créé avec succès (expire dans 6 jours)');
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de l\'abonnement de test');
    }
  };

  const handleCreateExpiredSubscription = async () => {
    if (!currentUser) return;
    try {
      await createExpiredSubscription(currentUser.uid);
      alert('Abonnement expiré créé avec succès');
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de l\'abonnement expiré');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Test du Système d'Abonnement
      </Typography>
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTestSubscription}
        >
          Créer un abonnement qui expire bientôt
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleCreateExpiredSubscription}
        >
          Créer un abonnement expiré
        </Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="textSecondary">
          Instructions de test :
        </Typography>
        <ul>
          <li>Cliquez sur les boutons pour créer différents types d'abonnements</li>
          <li>Vérifiez les notifications dans l'icône de notification</li>
          <li>Vérifiez le statut de l'abonnement en haut de la page</li>
          <li>Testez le processus de renouvellement</li>
        </ul>
      </Box>
    </Paper>
  );
};

export default TestSubscriptionSystem;
