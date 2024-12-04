import React, { useState, useEffect } from 'react';
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
  Collapse,
  Link,
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
  ExpandLess,
  ExpandMore,
  ChevronRight as ChevronRightIcon,
  Euro as EuroIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../notifications/NotificationCenter';
import SubscriptionStatus from '../subscription/SubscriptionStatus';

const drawerWidth = 240;

const openedMixin = (theme: any) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#ffffff',
  color: '#1a237e',
  boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  '& .MuiListItemIcon-root': {
    color: '#1a237e',
    minWidth: 40,
  },
  '& .MuiListItem-root': {
    margin: '8px 8px',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: 'rgba(26, 35, 126, 0.08)',
    },
    '&.active': {
      backgroundColor: 'rgba(26, 35, 126, 0.12)',
      '&:hover': {
        backgroundColor: 'rgba(26, 35, 126, 0.16)',
      },
    },
  },
});

const closedMixin = (theme: any) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#ffffff',
  color: '#1a237e',
  boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
  '& .MuiListItemIcon-root': {
    color: '#1a237e',
    minWidth: 40,
  },
  '& .MuiListItem-root': {
    margin: '8px 8px',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: 'rgba(26, 35, 126, 0.08)',
    },
    '&.active': {
      backgroundColor: 'rgba(26, 35, 126, 0.12)',
      '&:hover': {
        backgroundColor: 'rgba(26, 35, 126, 0.16)',
      },
    },
  },
});

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
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
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
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
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean } & MuiDrawerProps>(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [], // Add this line to resolve the type error
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
  })
);

// Add type definition for menu items
type MenuItem = {
  text: string;
  icon: React.ReactElement;
  path?: string;
  items?: MenuItem[];
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(true);
  const [expandedItems, setExpandedItems] = React.useState<{ [key: string]: boolean }>({});
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems: MenuItem[] = [
    ...(isAdmin ? [
      {
        text: 'Administration',
        icon: <AdminIcon />,
        items: [
          {
            text: 'Gestion Utilisateurs',
            icon: <PeopleIcon />,
            path: '/admin/users'
          },
          {
            text: 'Gestion Abonnements',
            icon: <CreditCardIcon />,
            path: '/admin/subscriptions'
          }
        ]
      }
    ] : []),
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
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
      text: 'Mon Abonnement',
      icon: <CreditCardIcon />,
      path: '/subscription'
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Car Manager Pro
          </Typography>
          <NotificationCenter />
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Déconnexion
          </Button>
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
            item.items ? (
              <React.Fragment key={item.text}>
                <ListItem
                  button
                  onClick={() => setExpandedItems(prev => ({
                    ...prev,
                    [item.text]: !prev[item.text]
                  }))}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {expandedItems[item.text] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedItems[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.items.map((subItem) => (
                      <ListItem
                        key={subItem.text}
                        button
                        onClick={() => navigate(subItem.path || '#')}
                        sx={{
                          pl: 4,
                          backgroundColor: location.pathname === subItem.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
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
            )
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
