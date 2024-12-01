import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error: any) {
      setError('Email ou mot de passe incorrect');
    }
  };

  const features = [
    {
      icon: <CarIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Gestion de Flotte',
      description: 'Gérez facilement votre parc automobile avec un suivi en temps réel des véhicules disponibles et loués.'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Gestion Clients',
      description: 'Suivez vos clients, leur historique de location et gérez leurs informations en toute simplicité.'
    },
    {
      icon: <ReportIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Rapports Détaillés',
      description: 'Accédez à des rapports détaillés sur les locations, les revenus et l\'utilisation des véhicules.'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Grid container spacing={4}>
          {/* Section de gauche - Présentation */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                Car Manager
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                }}
              >
                La solution complète pour la gestion de votre entreprise de location de véhicules
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {feature.icon}
                        <Typography
                          variant="h6"
                          sx={{
                            ml: 2,
                            fontWeight: 600,
                          }}
                        >
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

          {/* Section de droite - Formulaire de connexion */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                backgroundColor: 'white',
                borderRadius: 2,
              }}
            >
              <Box
                component="form"
                onSubmit={handleLogin}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Connexion
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Connectez-vous pour accéder à votre espace
                  </Typography>
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  error={!!error}
                />

                <TextField
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  error={!!error}
                  helperText={error}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Se connecter
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage;
