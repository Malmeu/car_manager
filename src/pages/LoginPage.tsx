import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  Alert,
  AppBar,
  Toolbar,
  Link,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { PlanType } from '../models/subscription';

interface LocationState {
  returnUrl?: string;
  selectedPlan?: PlanType;
  billingPeriod?: 'monthly' | 'annual';
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { returnUrl, selectedPlan, billingPeriod } = (location.state as LocationState) || {};
  const theme = useTheme();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await login(email, password);
      console.log('Connexion réussie');
      
      if (selectedPlan) {
        navigate('/subscription', { 
          state: { 
            selectedPlan,
            billingPeriod 
          }
        });
      } else {
        navigate(returnUrl || '/dashboard');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Adresse email invalide');
          break;
        case 'auth/user-disabled':
          setError('Ce compte a été désactivé');
          break;
        case 'auth/user-not-found':
          setError('Aucun compte ne correspond à cet email');
          break;
        case 'auth/wrong-password':
          setError('Mot de passe incorrect');
          break;
        default:
          setError('Une erreur est survenue lors de la connexion');
      }
    }
  };

  const handleLoginSuccess = async (user: any) => {
    try {
      // Si un plan a été sélectionné, créer l'abonnement
      if (selectedPlan && billingPeriod) {
        await subscriptionService.createSubscription(user.uid, selectedPlan, billingPeriod);
        navigate('/dashboard');
      } else {
        // Sinon, rediriger vers la page demandée ou le tableau de bord par défaut
        navigate(returnUrl || '/dashboard');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      // Gérer l'erreur
    }
  };

  const createTestAccount = async () => {
    const testEmail = 'test@carma.com';
    const testPassword = 'Test123!';
    
    try {
      setError('');
      setSuccess('');
      
      // await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      setSuccess(`Compte de test créé avec succès! Email: ${testEmail}, Mot de passe: ${testPassword}`);
      setEmail(testEmail);
      setPassword(testPassword);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setSuccess(`Le compte de test existe déjà. Utilisez: Email: ${testEmail}, Mot de passe: ${testPassword}`);
        setEmail(testEmail);
        setPassword(testPassword);
      } else {
        console.error('Erreur création compte test:', error);
        setError('Erreur lors de la création du compte de test');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
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

      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          pt: 15,
          pb: 8,
          display: 'flex',
          minHeight: '100vh'
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Login form */}
          <Grid item xs={12} md={6}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              Connexion
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Accédez à votre espace de gestion de flotte
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
                onSubmit={handleLogin}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
                
                <TextField
                  fullWidth
                  label="Mot de passe"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Se connecter
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link component={RouterLink} to="/signup" variant="body2">
                    Pas encore de compte ? Inscrivez-vous
                  </Link>
                </Box>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={createTestAccount}
                  sx={{ mt: 1 }}
                >
                  Créer un compte de test
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right side - Features */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {[
                {
                  icon: <CarIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
                  title: 'Gestion de Flotte',
                  description: 'Suivez et gérez votre flotte de véhicules en temps réel'
                },
                {
                  icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
                  title: 'Gestion Clients',
                  description: 'Gérez vos clients et leurs locations efficacement'
                },
                {
                  icon: <ReportIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
                  title: 'Analyses Détaillées',
                  description: 'Accédez à des rapports et statistiques complets'
                }
              ].map((feature, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {feature.icon}
                        <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage;
