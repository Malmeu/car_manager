import React, { useState, useEffect, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { theme } from '../../theme';
import {
  Box,
  Drawer as MuiDrawer,
  DrawerProps as MuiDrawerProps,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useMediaQuery,
  useTheme,
  Collapse,
  Button,
  Link,
  CircularProgress,
  SwipeableDrawer,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Description as ContractIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  CreditCard as CreditCardIcon,
  AdminPanelSettings as AdminIcon,
  ChevronRight as ChevronRightIcon,
  Euro as EuroIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import NotificationCenter from '../notifications/NotificationCenter';
import SubscriptionStatus from '../subscription/SubscriptionStatus';
import { globalStyles } from '../../styles/globalStyles';
import MenuListItem from './MenuListItem';

const drawerWidth = 240;

const Layout = ({ children }: { children?: React.ReactNode }) => {
  // Tous les hooks d'état au début du composant
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(localStorage.getItem('companyLogo'));
  const [companyName, setCompanyName] = useState<string>(localStorage.getItem('companyName') || 'Car Manager Pro');
  const [primaryColor, setPrimaryColor] = useState<string>(localStorage.getItem('primaryColor') || '#1a237e');

  // Autres hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Gestionnaires d'événements
  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Items du menu
  const menuItems = [
    {
      text: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Véhicules',
      icon: <CarIcon />,
      path: '/vehicles'
    },
    {
      text: 'Contrats',
      icon: <DescriptionIcon />,
      path: '/contracts'
    },
    {
      text: 'Clients',
      icon: <PeopleIcon />,
      path: '/customers'
    },
    {
      text: 'Locations',
      icon: <ContractIcon />,
      path: '/rentals'
    },
    {
      text: 'Frais',
      icon: <EuroIcon />,
      path: '/expenses',
    },
    {
      text: 'Caisse',
      icon: <AccountBalanceIcon />,
      path: '/cash-journal',
    },
    {
      text: 'Rapports',
      icon: <ReportIcon />,
      path: '/reports'
    },
    {
      text: 'Utilitaires',
      icon: <BuildIcon />,
      path: '/utilities'
    },
    {
      text: 'Mon Abonnement',
      icon: <CreditCardIcon />,
      path: '/subscription'
    }
  ];

  // Fermer automatiquement le drawer sur mobile lors d'un changement de route
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Ajuster l'état ouvert/fermé en fonction de la taille de l'écran
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const openedMixin = useMemo(
    () => (theme: any) => ({
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
      backgroundColor: '#ffffff',
      color: primaryColor,
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      '& .MuiListItemIcon-root': {
        color: primaryColor,
        minWidth: 40,
      },
      '& .MuiListItem-root': {
        margin: '8px 8px',
        borderRadius: '8px',
        '&:hover': {
          backgroundColor: `${primaryColor}15`,
        },
        '&.active': {
          backgroundColor: `${primaryColor}22`,
          '&:hover': {
            backgroundColor: `${primaryColor}30`,
          },
        },
      },
    }),
    [primaryColor]
  );

  const closedMixin = useMemo(
    () => (theme: any) => ({
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      backgroundColor: '#ffffff',
      color: primaryColor,
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      width: `calc(${theme.spacing(7)} + 1px)`,
      [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
      },
      '& .MuiListItemIcon-root': {
        color: primaryColor,
        minWidth: 40,
      },
      '& .MuiListItem-root': {
        margin: '8px 8px',
        borderRadius: '8px',
        '&:hover': {
          backgroundColor: `${primaryColor}15`,
        },
        '&.active': {
          backgroundColor: `${primaryColor}22`,
          '&:hover': {
            backgroundColor: `${primaryColor}30`,
          },
        },
      },
    }),
    [primaryColor]
  );

  const Drawer = useMemo(
    () =>
      styled(MuiDrawer, {
        shouldForwardProp: (prop) => prop !== 'open',
      })<{ open?: boolean } & MuiDrawerProps>(({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        variants: [],
        ...(open && {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': closedMixin(theme),
        }),
        [theme.breakpoints.down('sm')]: {
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            position: 'fixed',
            height: '100%',
            zIndex: theme.zIndex.drawer,
          },
        },
      })),
    [openedMixin, closedMixin]
  );

  const AppBar = useMemo(
    () =>
      styled(MuiAppBar, {
        shouldForwardProp: (prop) => prop !== 'open',
      })<{
        open?: boolean;
      }>(({ theme, open }) => ({
        backgroundColor: 'transparent',
        boxShadow: 'none',
        backdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        color: primaryColor,
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
          width: `calc(100% - ${drawerWidth}px)`,
          marginLeft: `${drawerWidth}px`,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }),
        [theme.breakpoints.down('sm')]: {
          width: '100% !important',
          marginLeft: '0 !important',
        },
      })),
    [primaryColor]
  );

  const Main = useMemo(
    () =>
      styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
        open?: boolean;
      }>(({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: 0,
        }),
        [theme.breakpoints.down('sm')]: {
          marginLeft: 0,
          padding: theme.spacing(2),
          width: '100%',
          marginTop: '64px',
        },
      })),
    []
  );

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  }));

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const subscriptionStatus = await subscriptionService.checkSubscriptionStatus(currentUser.uid);
        const isValid = subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trial';
        setHasValidSubscription(isValid);

        // Liste des routes autorisées même sans abonnement actif
        const allowedRoutes = [
          '/subscription-plans',
          '/subscription-pending',
          '/profile',
          '/login',
          '/signup'
        ];

        // Si l'utilisateur n'a pas d'abonnement valide et n'est pas sur une route autorisée
        if (!isValid && !allowedRoutes.some(route => location.pathname.startsWith(route))) {
          navigate('/subscription-pending');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'abonnement:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [currentUser, location.pathname]);

  useEffect(() => {
    const handleStorageChange = () => {
      setCompanyLogo(localStorage.getItem('companyLogo'));
      setCompanyName(localStorage.getItem('companyName') || 'Car Manager Pro');
      setPrimaryColor(localStorage.getItem('primaryColor') || '#1a237e');
    };

    const handleThemeChange = (event: CustomEvent<{ primaryColor: string }>) => {
      setPrimaryColor(event.detail.primaryColor);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        open={open}
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          color: primaryColor,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              marginRight: 2,
              ...(open && !isMobile && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {companyLogo && (
              <Box
                component="img"
                src={companyLogo}
                alt="Logo"
                sx={{
                  height: { xs: 32, sm: 40 },
                  width: { xs: 32, sm: 40 },
                  marginRight: 2,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                display: { xs: !open ? 'block' : 'none', sm: 'block' }
              }}
            >
              {companyName}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }
          }}>
            <IconButton
              color="inherit"
              onClick={handleMenu}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <PersonIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mon Profil
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={() => navigate('/admin/dashboard')}>
                  <ListItemIcon>
                    <AdminIcon fontSize="small" />
                  </ListItemIcon>
                  Administration
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
            <NotificationCenter />
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              startIcon={<LogoutIcon />}
              sx={{
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              Déconnexion
            </Button>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none',
            },
          }}
        >
          <DrawerHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 2 }}>
              {companyLogo && (
                <Box
                  component="img"
                  src={companyLogo}
                  alt="Logo"
                  sx={{
                    height: 32,
                    width: 32,
                    marginRight: 2,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              )}
              <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1 }}>
                {companyName}
              </Typography>
              <IconButton onClick={() => setMobileOpen(false)}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          </DrawerHeader>
          <Divider />
          <List sx={{ pt: 0 }}>
            {menuItems.map((item) => (
              <MenuListItem
                key={item.text}
                item={item}
                onClick={() => navigate(item.path || '#')}
                primaryColor={primaryColor}
              />
            ))}
          </List>
        </SwipeableDrawer>
      ) : (
        <Drawer variant="permanent" open={open}>
          <DrawerHeader>
            <IconButton onClick={() => setOpen(!open)}>
              {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List sx={{ pt: 0 }}>
            {menuItems.map((item) => (
              <MenuListItem
                key={item.text}
                item={item}
                onClick={() => navigate(item.path || '#')}
                primaryColor={primaryColor}
              />
            ))}
          </List>
        </Drawer>
      )}

      <Main open={open && !isMobile}>
        <DrawerHeader />
        <Box 
          sx={{
           // ...globalStyles.gradientBackground,
            p: { xs: 2, sm: 3 },
            borderRadius: '20px',
            margin: '16px',
            minHeight: 'calc(100vh - 100px)',
          }}
        >
          {currentUser && <SubscriptionStatus />}
          <Box sx={{ mt: 3 }}>
            {children || <Outlet />}
          </Box>
        </Box>
      </Main>
    </Box>
  );
};

export default Layout;
