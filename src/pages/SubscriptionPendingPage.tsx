import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SubscriptionPendingPage = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <CheckIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Demande d'abonnement envoyée !
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Votre demande d'abonnement a été bien prise en compte. Un administrateur
            va examiner votre demande et activer votre compte dans les plus brefs délais.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Vous recevrez une notification par email dès que votre compte sera activé.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ minWidth: 200 }}
            >
              Retour à la connexion
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SubscriptionPendingPage;
