import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
  Stack,
  Paper,
  Toolbar,
  Drawer,
  useMediaQuery,
  Rating,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  TextField,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu mobile
  const mobileMenu = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: 280,
          bgcolor: 'background.default',
          boxShadow: 1,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={() => setMobileMenuOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setMobileMenuOpen(false);
            const element = document.getElementById('features');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <ListItemText primary="Fonctionnalités" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setMobileMenuOpen(false);
            const element = document.getElementById('pricing');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <ListItemText primary="Tarifs" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setMobileMenuOpen(false);
            const element = document.getElementById('faq');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <ListItemText primary="FAQ" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setMobileMenuOpen(false);
            navigate('/login');
          }}>
            <ListItemText primary="Se connecter" />
          </ListItemButton>
        </ListItem>
        <ListItem sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/register');
            }}
          >
            S'inscrire
          </Button>
        </ListItem>
      </List>
    </Drawer>
  );

  // Menu desktop
  const desktopMenu = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        color="inherit"
        onClick={() => {
          const element = document.getElementById('features');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        Fonctionnalités
      </Button>
      <Button
        color="inherit"
        onClick={() => {
          const element = document.getElementById('pricing');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        Tarifs
      </Button>
      <Button
        color="inherit"
        onClick={() => {
          const element = document.getElementById('faq');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        FAQ
      </Button>
      <Button
        color="inherit"
        onClick={() => navigate('/login')}
      >
        Se connecter
      </Button>
      <Button
        variant="contained"
        onClick={() => navigate('/register')}
      >
        S'inscrire
      </Button>
    </Stack>
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

  const tiers = [
    {
      title: 'Gratuit',
      price: '0 DZD',
      description: [
        'Jusqu\'à 3 véhicules',
        'Suivi kilométrage',
        'Rappels maintenance',
        'Support email',
      ],
      buttonText: 'Commencer',
    },
    {
      title: 'Pro',
      price: '4,999 DZD/mois',
      description: [
        'Jusqu\'à 15 véhicules',
        'Suivi des coûts',
        'Rapports mensuels',
        'Support prioritaire',
        'API Access',
      ],
      buttonText: 'Commencer',
    },
    {
      title: 'Entreprise',
      price: '19,999 DZD/mois',
      description: [
        'Véhicules illimités',
        'Analyses avancées',
        'Support dédié 24/7',
        'Personnalisation complète',
        'Formation incluse',
      ],
      buttonText: 'Contactez-nous',
    },
  ];

  const testimonials = [
    {
      name: 'Karim Benzarti',
      role: 'Directeur de flotte, Logistique Express',
      content: 'Carma a révolutionné notre gestion de flotte. Nous avons réduit nos coûts de maintenance de 30% en seulement 6 mois.',
      avatar: 'KB',
    },
    {
      name: 'Sarah Mansouri',
      role: 'Propriétaire, Auto-École Excellence',
      content: 'Un outil indispensable pour notre auto-école. Le suivi des véhicules est devenu un jeu d\'enfant.',
      avatar: 'SM',
    },
    {
      name: 'Ahmed Benali',
      role: 'Gérant, Transport Benali',
      content: 'La meilleure décision que nous ayons prise. Le support client est exceptionnel et les fonctionnalités répondent parfaitement à nos besoins.',
      avatar: 'AB',
    },
  ];

  const faqs = [
    {
      question: 'Comment commencer avec Carma ?',
      answer: 'C\'est très simple ! Inscrivez-vous gratuitement, ajoutez vos véhicules et commencez à suivre votre flotte. Notre guide de démarrage vous accompagnera pas à pas.',
    },
    {
      question: 'Puis-je essayer Carma avant de m\'abonner ?',
      answer: 'Oui, vous pouvez utiliser notre version gratuite sans limite de temps. Elle inclut toutes les fonctionnalités de base pour gérer jusqu\'à 3 véhicules.',
    },
    {
      question: 'Les mises à jour sont-elles incluses ?',
      answer: 'Absolument ! Tous nos plans incluent les mises à jour régulières et l\'accès aux nouvelles fonctionnalités correspondant à votre niveau d\'abonnement.',
    },
    {
      question: 'Comment fonctionne le support client ?',
      answer: 'Nous offrons un support par email pour tous les utilisateurs. Les plans Pro et Entreprise bénéficient d\'un support prioritaire avec des temps de réponse garantis.',
    },
    {
      question: 'Puis-je changer de forfait à tout moment ?',
      answer: 'Oui, vous pouvez upgrader ou downgrader votre forfait à tout moment. La différence de prix sera calculée au prorata de votre utilisation.',
    },
  ];

  const Footer = () => {
    return (
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          py: 4,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* À propos */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                À propos de Carma
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Solution innovante de gestion de flotte automobile.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" color="inherit">
                  <FacebookIcon />
                </IconButton>
                <IconButton size="small" color="inherit">
                  <TwitterIcon />
                </IconButton>
                <IconButton size="small" color="inherit">
                  <InstagramIcon />
                </IconButton>
                <IconButton size="small" color="inherit">
                  <LinkedInIcon />
                </IconButton>
              </Stack>
            </Grid>

            {/* Liens rapides */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Liens rapides
              </Typography>
              <List dense disablePadding>
                {['Accueil', 'Fonctionnalités', 'Tarifs', 'FAQ'].map((text) => (
                  <ListItem key={text} disablePadding>
                    <ListItemButton sx={{ px: 0, py: 0.5 }}>
                      <ListItemText primary={text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Contact */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contact
              </Typography>
              <List dense disablePadding>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="contact@carma.com" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <PhoneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="+213 123 456 789" />
                </ListItem>
              </List>
            </Grid>

            {/* Newsletter */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Newsletter
              </Typography>
              <Box component="form" noValidate>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Votre email"
                  sx={{ mb: 1 }}
                />
                <Button variant="contained" fullWidth size="small">
                  S'inscrire
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Copyright */}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}
          >
            {new Date().getFullYear()} Carma. Tous droits réservés.
          </Typography>
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
      <AppBar position="fixed" sx={{ bgcolor: 'background.default', boxShadow: 1 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 70 }}>
            {/* Logo */}
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

            {/* Menu desktop */}
            {!isMobile && desktopMenu}

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
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 12 },
          overflow: 'hidden',
        }}
      >
        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: 'absolute',
            width: '40%',
            height: '40%',
            background: `radial-gradient(circle, ${theme.palette.primary.light}22 0%, transparent 70%)`,
            top: -100,
            right: -100,
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '30%',
            height: '30%',
            background: `radial-gradient(circle, ${theme.palette.secondary.light}22 0%, transparent 70%)`,
            bottom: -50,
            left: -50,
            borderRadius: '50%',
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ maxWidth: 580 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Gérez votre flotte automobile en toute simplicité
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{ mb: 4, lineHeight: 1.6 }}
                >
                  La solution tout-en-un qui simplifie la gestion de vos véhicules, optimise vos coûts et améliore votre productivité.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mb: 4 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: '30px',
                      boxShadow: `0 8px 20px -3px ${theme.palette.primary.main}66`,
                    }}
                  >
                    Commencer gratuitement
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      borderRadius: '30px',
                    }}
                  >
                    Voir la démo
                  </Button>
                </Stack>

                {/* Statistiques */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {[
                    { number: '1000+', label: 'Clients satisfaits' },
                    { number: '50K+', label: 'Véhicules gérés' },
                    { number: '30%', label: 'Économies réalisées' },
                  ].map((stat, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            mb: 0.5,
                          }}
                        >
                          {stat.number}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{
                position: 'relative',
                display: { xs: 'none', md: 'block' },
              }}
            >
              {/* Image principale */}
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    right: '-10%',
                    bottom: '-10%',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
                    borderRadius: '20px',
                    transform: 'rotate(-3deg)',
                  },
                }}
              >
                <Box
                  component="img"
                  src="/location.png"
                  alt="Carma Dashboard"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: 600,
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    transform: 'rotate(3deg)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'rotate(3deg) scale(1.02)',
                    },
                  }}
                />
              </Box>

              {/* Badge flottant */}
              <Card
                sx={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '-5%',
                  maxWidth: 200,
                  p: 2,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '16px',
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': {
                      transform: 'translateY(0)',
                    },
                    '50%': {
                      transform: 'translateY(-10px)',
                    },
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <SpeedIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Interface intuitive
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Prise en main rapide
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section Fonctionnalités */}
      <Box
        id="features"
        sx={{
          py: 10,
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: 'absolute',
            width: '40%',
            height: '40%',
            background: `radial-gradient(circle, ${theme.palette.primary.light}11 0%, transparent 70%)`,
            top: -100,
            left: -100,
            borderRadius: '50%',
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Fonctionnalités principales
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Des outils puissants pour une gestion efficace de votre flotte
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      bgcolor: `${theme.palette.primary.main}11`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    {React.cloneElement(feature.icon, {
                      sx: { fontSize: 32, color: theme.palette.primary.main },
                    })}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Section Tarifs */}
      <Box
        id="pricing"
        sx={{
          py: 10,
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            background: `radial-gradient(circle, ${theme.palette.primary.light}11 0%, transparent 70%)`,
            top: -200,
            right: -200,
            borderRadius: '50%',
            transform: 'rotate(45deg)',
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Nos tarifs
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Des forfaits adaptés à vos besoins
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            {tiers.map((tier) => (
              <Grid
                item
                key={tier.title}
                xs={12}
                md={4}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 4,
                    borderRadius: 4,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    ...(tier.title === 'Pro' && {
                      bgcolor: `${theme.palette.primary.main}05`,
                      border: `2px solid ${theme.palette.primary.main}22`,
                    }),
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  {tier.title === 'Pro' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 4,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      Populaire
                    </Box>
                  )}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                      {tier.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {tier.price}
                      <Typography component="span" variant="h6" color="text.secondary">
                        
                      </Typography>
                    </Typography>
                  </Box>
                  <List sx={{ mb: 4, flex: 1 }}>
                    {tier.description.map((line) => (
                      <ListItem key={line} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                        </ListItemIcon>
                        <ListItemText primary={line} />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant={tier.title === 'Pro' ? 'contained' : 'outlined'}
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      ...(tier.title === 'Pro' && {
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      }),
                    }}
                  >
                    {tier.buttonText}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Section Avantages */}
      <Box
        sx={{
          py: 10,
          bgcolor: 'grey.50',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercle décoratif */}
        <Box
          sx={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            background: `radial-gradient(circle, ${theme.palette.secondary.light}11 0%, transparent 70%)`,
            bottom: -200,
            right: -200,
            borderRadius: '50%',
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Pourquoi nous choisir ?
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Découvrez les avantages qui font la différence
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item key={index} xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    borderRadius: 4,
                    background: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${theme.palette.secondary.main}22`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      bgcolor: `${theme.palette.secondary.main}11`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    {React.cloneElement(benefit.icon, {
                      sx: { fontSize: 32, color: theme.palette.secondary.main },
                    })}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Section Témoignages */}
      <Box
        sx={{
          py: 10,
          bgcolor: 'grey.50',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercle décoratif */}
        <Box
          sx={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            background: `radial-gradient(circle, ${theme.palette.secondary.light}11 0%, transparent 70%)`,
            top: -100,
            left: -100,
            borderRadius: '50%',
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Ce que disent nos clients
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Découvrez les expériences de ceux qui nous font confiance
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item key={index} xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    borderRadius: 4,
                    background: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${theme.palette.secondary.main}22`,
                    },
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Rating value={5} readOnly />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      fontStyle: 'italic',
                      color: 'text.secondary',
                      flex: 1,
                    }}
                  >
                    "{testimonial.content}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={testimonial.avatar}
                      sx={{
                        width: 48,
                        height: 48,
                        mr: 2,
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: 8, bgcolor: '#f5f5f5' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 'bold' }}
          >
            Questions fréquentes
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} md={8}>
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    mb: 2,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    bgcolor: 'white',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                  >
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <Divider />
                  <AccordionDetails>
                    <Typography color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section Contact */}
      <Box
        id="contact"
        sx={{
          py: 8,
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Informations de contact */}
            <Grid item xs={12} md={5}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contactez-nous
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
                Notre équipe est là pour vous aider
              </Typography>
              
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      mr: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <LocationIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Adresse
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      123 Rue des Oliviers, Alger, Algérie
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      mr: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <PhoneIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Téléphone
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      +213 123 456 789
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lun-Ven: 9h-18h
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      mr: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <EmailIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Email
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      contact@carma.com
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@carma.com
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            {/* Formulaire de contact */}
            <Grid item xs={12} md={7}>
              <Card
                elevation={0}
                sx={{
                  p: 4,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sujet"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      variant="outlined"
                      multiline
                      rows={4}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                      }}
                    >
                      Envoyer le message
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section d'essai gratuit */}
      <Box
        sx={{
          py: 8,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
                Prêt à commencer ?
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, color: 'white' }}>
                Essayez Carma gratuitement pendant 14 jours
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => navigate('/login')}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  Démarrer l'essai gratuit
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Voir la démo
                </Button>
              </Stack>
              <Typography variant="body1" sx={{ mt: 3, opacity: 0.9 }}>
                ✓ Aucune carte bancaire requise
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                ✓ Configuration en moins de 5 minutes
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src="/location.png"
                alt="Aperçu du dashboard"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  transform: 'perspective(1000px) rotateY(-10deg)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            top: -100,
            right: -100,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: -150,
            left: -150,
          }}
        />
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
