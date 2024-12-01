import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudDone as CloudIcon,
  MonetizationOn as PricingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <CarIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Gestion de Flotte Intelligente',
      description: 'Gérez votre flotte de véhicules en temps réel. Suivez la disponibilité, la maintenance et l\'historique de chaque véhicule.'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Gestion Client Simplifiée',
      description: 'Base de données clients centralisée avec historique complet des locations et préférences personnalisées.'
    },
    {
      icon: <ReportIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Analyses & Rapports',
      description: 'Tableaux de bord détaillés et rapports personnalisables pour optimiser votre activité.'
    }
  ];

  const benefits = [
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: 'Performance Optimale',
      description: 'Interface rapide et intuitive pour une gestion efficace au quotidien.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: 'Sécurité Maximale',
      description: 'Protection des données et conformité RGPD garanties.'
    },
    {
      icon: <CloudIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: 'Solution Cloud',
      description: 'Accédez à vos données partout, à tout moment, sur tous vos appareils.'
    }
  ];

  const pricing = [
    {
      title: 'Starter',
      price: '49€',
      period: '/mois',
      features: [
        'Jusqu\'à 20 véhicules',
        'Gestion des clients',
        'Rapports basiques',
        'Support email'
      ]
    },
    {
      title: 'Professional',
      price: '99€',
      period: '/mois',
      features: [
        'Jusqu\'à 50 véhicules',
        'Gestion avancée des clients',
        'Rapports détaillés',
        'Support prioritaire',
        'API Access'
      ],
      recommended: true
    },
    {
      title: 'Enterprise',
      price: 'Sur mesure',
      period: '',
      features: [
        'Flotte illimitée',
        'Solutions personnalisées',
        'Support dédié 24/7',
        'Formation sur site',
        'API illimitée'
      ]
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f5f5f5' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 12,
          pb: 8,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                component="h1"
                variant="h2"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Car Manager
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                paragraph
                sx={{ mb: 4 }}
              >
                La solution SaaS complète pour la gestion de votre entreprise de location de véhicules
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Commencer maintenant
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Voir la démo
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/dashboard-preview.png"
                alt="Dashboard Preview"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{ fontWeight: 700, mb: 8 }}
        >
          Fonctionnalités Principales
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.3s ease-in-out',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            variant="h3"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{ fontWeight: 700, mb: 8 }}
          >
            Pourquoi Choisir Car Manager ?
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item key={index} xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    {benefit.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{ fontWeight: 700, mb: 8 }}
        >
          Tarifs Transparents
        </Typography>
        <Grid container spacing={4} alignItems="stretch">
          {pricing.map((plan, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  ...(plan.recommended && {
                    border: `2px solid ${theme.palette.primary.main}`,
                    transform: 'scale(1.05)',
                  }),
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    Recommandé
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    {plan.title}
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  {plan.features.map((feature, idx) => (
                    <Typography
                      key={idx}
                      component="li"
                      sx={{
                        listStyle: 'none',
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        '&:before': {
                          content: '"✓"',
                          marginRight: 1,
                          color: 'primary.main',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      {feature}
                    </Typography>
                  ))}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={plan.recommended ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    {plan.title === 'Enterprise' ? 'Contactez-nous' : 'Commencer'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
            Prêt à optimiser votre gestion de flotte ?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Rejoignez les entreprises qui font confiance à Car Manager
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            Essai gratuit de 14 jours
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
