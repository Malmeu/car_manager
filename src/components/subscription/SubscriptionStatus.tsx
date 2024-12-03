import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionStatus {
  isValid: boolean;
  daysRemaining: number;
  status: string;
  message?: string;
}

const SubscriptionStatus: React.FC = () => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual'>('monthly');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const checkStatus = async () => {
    if (!currentUser) return;
    
    try {
      const subscriptionStatus = await subscriptionService.checkSubscriptionStatus(currentUser.uid);
      setStatus(subscriptionStatus);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Vérifier le statut toutes les heures
    const interval = setInterval(checkStatus, 3600000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleRenew = async () => {
    if (!currentUser || !status) return;
    
    try {
      const subscription = await subscriptionService.getCurrentSubscription(currentUser.uid);
      if (subscription?.id) {
        await subscriptionService.renewSubscription(subscription.id, selectedPeriod);
        setRenewDialogOpen(false);
        navigate('/subscription-plans');
      }
    } catch (error) {
      console.error('Erreur lors du renouvellement:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (!status.isValid) return 'error';
    if (status.daysRemaining <= 7) return 'warning';
    return 'success';
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Alert severity={getStatusColor()}>
          <Typography variant="body1">
            {status.message || (status.isValid 
              ? `Abonnement valide - ${status.daysRemaining} jours restants` 
              : 'Abonnement expiré')}
          </Typography>
        </Alert>

        {(!status.isValid || status.daysRemaining <= 7) && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setRenewDialogOpen(true)}
            >
              Renouveler l'abonnement
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={renewDialogOpen} onClose={() => setRenewDialogOpen(false)}>
        <DialogTitle>Renouveler votre abonnement</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'monthly' | 'annual')}
          >
            <FormControlLabel
              value="monthly"
              control={<Radio />}
              label="Mensuel (29.99€/mois)"
            />
            <FormControlLabel
              value="annual"
              control={<Radio />}
              label="Annuel (299.99€/an - 2 mois gratuits)"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleRenew} variant="contained" color="primary">
            Renouveler
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubscriptionStatus;
