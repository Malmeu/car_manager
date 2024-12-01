import React from 'react';
import { styled } from '@mui/material/styles';
import { theme } from '../../theme';
import {
  Box,
  Drawer as MuiDrawer,
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
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  backgroundColor: '#ffffff',
  color: '#1a237e',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderBottom: '1px solid rgba(26, 35, 126, 0.1)',
  position: 'fixed',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      backgroundColor: '#ffffff',
      color: '#1a237e',
      position: 'fixed',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      height: '100vh',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
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
    },
  }),
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNewRental = () => {
    navigate('/rentals', { state: { openNewRental: true } });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login'; // Redirection forcée vers la page de connexion
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
    { text: 'Véhicules', icon: <CarIcon />, path: '/vehicles' },
    { text: 'Clients', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Locations', icon: <ContractIcon />, path: '/rentals' },
    { text: 'Historique', icon: <ContractIcon />, path: '/location-history' },
    { text: 'Rapports', icon: <ReportIcon />, path: '/reports' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
            minHeight: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ 
                fontWeight: 600,
                fontSize: '1.25rem',
                letterSpacing: '0.5px'
              }}
            >
              Car Manager
            </Typography>
          </Box>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(26, 35, 126, 0.04)',
              }
            }}
          >
            Déconnexion
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: '64px',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(26, 35, 126, 0.12)' }} />
        <List component="nav" sx={{ p: 1 }}>
          {menuItems.map((item) => (
            <ListItem
              component={Link}
              to={item.path}
              key={item.text}
              className={location.pathname === item.path ? 'active' : ''}
              sx={{
                mb: 0.5,
                transition: 'all 0.2s ease-in-out',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                '&:hover': {
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit',
                  minWidth: 40,
                  mr: 1
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          backgroundColor: '#f5f7fa',
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          pt: '64px',
          pl: open ? `${drawerWidth}px` : `${theme.spacing(7)}px`,
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
        <Tooltip title="Nouvelle Location" placement="left">
          <SpeedDial
            ariaLabel="Nouvelle Location"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            icon={<SpeedDialIcon openIcon={<AddIcon />} />}
            onClick={handleNewRental}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Layout;
