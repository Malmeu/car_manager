import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: PlanFeature[];
  description: string;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basique',
    price: 29.99,
    description: 'Parfait pour démarrer',
    features: [
      { text: 'Jusqu\'à 10 véhicules', included: true },
      { text: 'Gestion des locations', included: true },
      { text: 'Support par email', included: true },
      { text: 'Rapports basiques', included: true },
      { text: 'Fonctionnalités avancées', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Professionnel',
    price: 59.99,
    description: 'Pour les entreprises en croissance',
    features: [
      { text: 'Véhicules illimités', included: true },
      { text: 'Gestion des locations avancée', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Rapports détaillés', included: true },
      { text: 'API d\'intégration', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 99.99,
    description: 'Solution complète pour grandes flottes',
    features: [
      { text: 'Toutes les fonctionnalités Pro', included: true },
      { text: 'Support dédié 24/7', included: true },
      { text: 'Personnalisation avancée', included: true },
      { text: 'Formation personnalisée', included: true },
      { text: 'SLA garanti', included: true },
    ],
  },
];

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSelectPlan = async (plan: Plan) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Update user document with subscription request
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        subscriptionRequest: {
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          status: 'pending',
          requestDate: new Date().toISOString(),
        },
      });

      // Show success message and redirect
      navigate('/subscription-pending');
    } catch (error) {
      console.error('Error requesting subscription:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Choisissez votre abonnement
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" paragraph>
        Sélectionnez le plan qui correspond le mieux à vos besoins
      </Typography>
      <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
        {plans.map((plan) => (
          <Grid item key={plan.id} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: '0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h4" component="h2" align="center">
                  {plan.name}
                </Typography>
                <Typography
                  variant="h3"
                  align="center"
                  color="primary"
                  sx={{ my: 2 }}
                >
                  {plan.price}€
                  <Typography component="span" variant="subtitle1">
                    /mois
                  </Typography>
                </Typography>
                <Typography
                  variant="subtitle1"
                  align="center"
                  color="text.secondary"
                  paragraph
                >
                  {plan.description}
                </Typography>
                <List>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon
                          color={feature.included ? 'primary' : 'disabled'}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.text}
                        sx={{
                          color: feature.included
                            ? 'text.primary'
                            : 'text.disabled',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleSelectPlan(plan)}
                    sx={{ minWidth: 200 }}
                  >
                    Choisir ce plan
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SubscriptionPlansPage;
