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
  SpeedDial,
  SpeedDialIcon,
  Tooltip,
  Button,
  Link,
  CircularProgress,
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

const drawerWidth = 240;

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(true);
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(localStorage.getItem('companyLogo'));
  const [companyName, setCompanyName] = useState<string>(localStorage.getItem('companyName') || 'Car Manager Pro');
  const [primaryColor, setPrimaryColor] = useState<string>(localStorage.getItem('primaryColor') || '#1a237e');
  const location = useLocation();
  const navigate = useNavigate();

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
        backgroundColor: primaryColor,
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems: any[] = [
    {
      text: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    ...(isAdmin ? [
      {
        text: 'Gestion des utilisateurs',
        icon: <PeopleIcon />,
        path: '/admin/users'
      },
      {
        text: 'Gestion des abonnements',
        icon: <CreditCardIcon />,
        path: '/admin/subscriptions'
      }
    ] : []),
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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        open={open}
        sx={{
          backgroundColor: primaryColor,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{ mr: 2 }}
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
                  height: 40,
                  width: 40,
                  marginRight: 2,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <Typography variant="h6" noWrap component="div">
              {companyName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/profile-customization')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <PersonIcon />
            </IconButton>
            <NotificationCenter />
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              startIcon={<LogoutIcon />}
            >
              Déconnexion
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => navigate(item.path || '#')}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {currentUser && <SubscriptionStatus />}
        {children || <Outlet />}
      </Main>
    </Box>
  );
};

export default Layout;
