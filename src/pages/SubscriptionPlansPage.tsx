import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { Plan, BillingPeriod, PLANS } from '../models/subscription';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { useNavigate } from 'react-router-dom';

const SubscriptionPlansPage: React.FC = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [error, setError] = useState('');

  const handleSubscribe = async (planId: Plan['id']) => {
    try {
      if (!currentUser) {
        navigate('/signup', { 
          state: { 
            selectedPlan: planId,
            billingPeriod 
          } 
        });
        return;
      }

      // Créer l'abonnement
      await subscriptionService.createSubscription(
        currentUser.uid,
        planId,
        billingPeriod,
        planId === 'trial'
      );

      // Rediriger vers la page d'attente
      navigate('/subscription-pending');
    } catch (error) {
      console.error('Erreur lors de la souscription:', error);
      setError("Une erreur est survenue lors de la souscription. Veuillez réessayer.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={8}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choisissez votre plan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Des solutions adaptées à vos besoins
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {PLANS.map((plan) => (
          <Grid item key={plan.id} xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                ...(plan.id === 'pro' && {
                  border: `2px solid ${theme.palette.primary.main}`,
                }),
              }}
            >
              {plan.id === 'pro' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderBottomLeftRadius: 8,
                  }}
                >
                  Populaire
                </Box>
              )}

              <CardHeader
                title={plan.name}
                titleTypographyProps={{ align: 'center', variant: 'h5' }}
                sx={{
                  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
                }}
              />

              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    mb: 2,
                  }}
                >
                  {plan.monthlyPrice === -1 ? (
                    <Typography variant="h4" color="text.primary">
                      Sur devis
                    </Typography>
                  ) : plan.monthlyPrice === 0 ? (
                    <Typography variant="h4" color="text.primary">
                      Gratuit
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="h4" color="text.primary">
                        {plan.monthlyPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        &nbsp;DZD/mois
                      </Typography>
                    </>
                  )}
                </Box>

                <List dense>
                  {plan.features.map((feature) => (
                    <ListItem key={feature}>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button
                  fullWidth
                  variant={plan.id === 'pro' ? 'contained' : 'outlined'}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.id === 'trial' ? 'Commencer l\'essai gratuit' : 'Choisir ce plan'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SubscriptionPlansPage;
