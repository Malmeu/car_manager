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
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Connexion réussie:', userCredential.user.uid);
      navigate('/dashboard');
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

  const createTestAccount = async () => {
    const testEmail = 'test@carma.com';
    const testPassword = 'Test123!';
    
    try {
      setError('');
      setSuccess('');
      
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
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
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Se connecter
                </Button>

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
