import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { subscriptionService } from '../services/subscriptionService';
import { sessionService } from '../services/sessionService';
import { doc, setDoc } from 'firebase/firestore';

interface LocationState {
  returnUrl?: string;
  selectedPlan?: 'starter' | 'pro' | 'enterprise';
  billingPeriod?: 'monthly' | 'annual';
  isTrial?: boolean;
}

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { returnUrl, selectedPlan, billingPeriod, isTrial } = (location.state as LocationState) || {};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword || !companyName || !displayName || !phoneNumber) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      // Créer le compte utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        companyName,
        displayName,
        phoneNumber,
        createdAt: new Date(),
        isAdmin: false
      });

      // Créer l'abonnement avec le plan choisi
      const planToUse = selectedPlan || 'trial';
      await subscriptionService.createSubscription(
        user.uid,
        planToUse as 'trial' | 'basic' | 'pro' | 'enterprise',
        billingPeriod || 'monthly',
        isTrial !== undefined ? isTrial : true // Par défaut en mode essai si non spécifié
      );

      // Initialiser une nouvelle session vierge
      await sessionService.initializeNewSession(user.uid);

      // Rediriger vers le tableau de bord
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Cette adresse email est déjà utilisée');
          break;
        case 'auth/invalid-email':
          setError('Adresse email invalide');
          break;
        default:
          setError('Une erreur est survenue lors de l\'inscription');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ bgcolor: 'background.default', boxShadow: 1 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 70 }}>
            <Box
              onClick={() => navigate('/')}
              sx={{
                flexGrow: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <img 
                src="/logocarma.png" 
                alt="Carma Logo" 
                style={{ 
                  height: '32px',
                  marginRight: '8px'
                }}
              />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container 
        maxWidth="sm" 
        sx={{ 
          pt: 15,
          pb: 8,
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Créer un compte
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          {isTrial 
            ? 'Commencez votre période d\'essai gratuit de 7 jours'
            : 'Rejoignez Carma pour gérer votre flotte de véhicules'
          }
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            component="form"
            onSubmit={handleRegister}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom complet"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom de l'entreprise"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Numéro de téléphone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  type="tel"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
            >
              {isTrial ? 'Commencer l\'essai gratuit' : 'Créer un compte'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Vous avez déjà un compte ?{' '}
                <Button
                  color="primary"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  Connectez-vous
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
