import React, { useState } from 'react';
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
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  TextField,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudDone as CloudIcon,
  MonetizationOn as PricingIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Menu as MenuIconFooter,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Avantages', href: '#benefits' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleMenuClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Menu mobile
  const mobileMenu = (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: 240,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={() => setMobileMenuOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.label}
            button 
            onClick={() => handleMenuClick(item.href)}
            sx={{ py: 2 }}
          >
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                sx: { fontWeight: 500 }
              }}
            />
          </ListItem>
        ))}
        <ListItem>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Se connecter
          </Button>
        </ListItem>
      </List>
    </Drawer>
  );

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

  const Footer = () => {
    return (
      <Box
        component="footer"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 6,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* À propos */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" gutterBottom>
                À propos de Car Manager
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Solution innovante de gestion de flotte automobile pour les professionnels et particuliers.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton color="inherit" aria-label="Facebook">
                  <FacebookIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="Twitter">
                  <TwitterIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="Instagram">
                  <InstagramIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="LinkedIn">
                  <LinkedInIcon />
                </IconButton>
              </Stack>
            </Grid>

            {/* Liens rapides */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" gutterBottom>
                Liens rapides
              </Typography>
              <List dense sx={{ p: 0 }}>
                {['Accueil', 'Fonctionnalités', 'Tarifs', 'Blog', 'FAQ'].map((text) => (
                  <ListItem key={text} sx={{ px: 0 }}>
                    <ListItemButton sx={{ px: 0 }}>
                      <ListItemText primary={text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Contact */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <List dense sx={{ p: 0 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PhoneIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="+33 1 23 45 67 89" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EmailIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="contact@carmanager.com" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="123 Avenue des Champs-Élysées, 75008 Paris" />
                </ListItem>
              </List>
            </Grid>

            {/* Newsletter */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" gutterBottom>
                Newsletter
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Inscrivez-vous pour recevoir nos actualités
              </Typography>
              <Box component="form" noValidate>
                <TextField
                  fullWidth
                  placeholder="Votre email"
                  variant="outlined"
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 1,
                    bgcolor: 'secondary.main',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                    },
                  }}
                >
                  S'inscrire
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box
            sx={{
              borderTop: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              mt: 4,
              pt: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="inherit">
              {new Date().getFullYear()} Car Manager. Tous droits réservés.
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: '#f5f5f5' 
    }}>
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        color="inherit" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 70 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              Car Manager
            </Typography>

            {/* Menu desktop */}
            {!isMobile && (
              <Stack direction="row" spacing={4} alignItems="center">
                {menuItems.map((item) => (
                  <Typography
                    key={item.label}
                    component="a"
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMenuClick(item.href);
                    }}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {item.label}
                  </Typography>
                ))}
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                </Button>
              </Stack>
            )}

            {/* Menu mobile burger */}
            {isMobile && (
              <IconButton
                size="large"
                onClick={() => setMobileMenuOpen(true)}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      {mobileMenu}

      {/* Hero Section */}
      <Box
        id="hero"
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
      <Container id="features" sx={{ py: 8 }} maxWidth="lg">
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
      <Box id="benefits" sx={{ bgcolor: 'background.paper', py: 8 }}>
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
      <Container id="pricing" sx={{ py: 8 }} maxWidth="lg">
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
        id="contact"
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
      <Footer />
    </Box>
  );
};

export default LandingPage;
