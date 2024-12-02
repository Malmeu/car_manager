import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
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
  Card,
  CardContent,
  Typography,
  useTheme,
  Stack,
  Paper,
  Toolbar,
  Drawer,
  useMediaQuery,
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
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
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

  const pricingPlans = [
    {
      title: 'Gratuit',
      price: '0 DZD',
      description: 'Pour les particuliers',
      features: [
        'Jusqu\'à 3 véhicules',
        'Suivi kilométrage',
        'Rappels maintenance',
        'Support email',
      ],
    },
    {
      title: 'Pro',
      price: '4,999 DZD/mois',
      description: 'Pour les petites entreprises',
      features: [
        'Jusqu\'à 15 véhicules',
        'Suivi des coûts',
        'Rapports mensuels',
        'Support prioritaire',
        'API Access',
      ],
      popular: true,
    },
    {
      title: 'Entreprise',
      price: '19,999 DZD/mois',
      description: 'Pour les grandes flottes',
      features: [
        'Véhicules illimités',
        'Analyses avancées',
        'Support dédié 24/7',
        'Personnalisation complète',
        'Formation incluse',
      ],
    },
  ];

  const testimonials = [
    {
      name: 'Karim Benzarti',
      role: 'Directeur de flotte, Logistique Express',
      content: 'Car Manager a révolutionné notre gestion de flotte. Nous avons réduit nos coûts de maintenance de 30% en seulement 6 mois.',
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
      question: 'Comment commencer avec Car Manager ?',
      answer: 'C\'est très simple ! Inscrivez-vous gratuitement, ajoutez vos véhicules et commencez à suivre votre flotte. Notre guide de démarrage vous accompagnera pas à pas.',
    },
    {
      question: 'Puis-je essayer Car Manager avant de m\'abonner ?',
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
                À propos de Car Manager
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
                  <ListItemText primary="contact@carmanager.com" />
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
            {new Date().getFullYear()} Car Manager. Tous droits réservés.
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
          {pricingPlans.map((plan, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  ...(plan.popular && {
                    border: `2px solid ${theme.palette.primary.main}`,
                    transform: 'scale(1.05)',
                  }),
                }}
              >
                {plan.popular && (
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
                      {plan.description}
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
                    variant={plan.popular ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    {plan.title === 'Entreprise' ? 'Contactez-nous' : 'Commencer'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Témoignages */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 'bold' }}
          >
            Ils nous font confiance
          </Typography>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ mb: 3, fontStyle: 'italic' }}
                  >
                    "{testimonial.content}"
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
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
                      contact@carmanager.com
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@carmanager.com
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
                Essayez Car Manager gratuitement pendant 14 jours
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
