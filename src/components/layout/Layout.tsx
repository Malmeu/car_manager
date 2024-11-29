import React from 'react';
import { styled } from '@mui/material/styles';
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
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  background: '#bfdbf7',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(191, 219, 247, 0.3)',
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
      background: '#bfdbf7',
      backdropFilter: 'blur(10px)',
      border: 'none',
      color: '#1a237e',
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
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
        margin: '8px 0',
        borderRadius: '0 25px 25px 0',
        '&:hover': {
          background: 'rgba(26, 35, 126, 0.1)',
        },
        '&.active': {
          background: 'rgba(26, 35, 126, 0.2)',
          '&:hover': {
            background: 'rgba(26, 35, 126, 0.2)',
          },
        },
      },
    },
  }),
);

const MainContent = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.primary.dark} 100%)`,
  backgroundAttachment: 'fixed',
  overflowX: 'hidden',
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = React.useState(true);
  const location = useLocation();

  const toggleDrawer = () => {
    setOpen(!open);
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
        <Toolbar sx={{
          pr: '24px',
          background: '#bfdbf7',
          backdropFilter: 'blur(10px)',
        }}>
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
            sx={{ flexGrow: 1 }}
          >
            Car Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer} sx={{ color: '#1a237e' }}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(26, 35, 126, 0.1)' }} />
        <List component="nav">
          {menuItems.map((item) => (
            <ListItem
              component={Link}
              to={item.path}
              key={item.text}
              className={location.pathname === item.path ? 'active' : ''}
              sx={{
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateX(5px)',
                },
                color: '#1a237e',
                textDecoration: 'none',
                '&.active': {
                  backgroundColor: 'rgba(26, 35, 126, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a237e', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: '#1a237e'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <MainContent>
        <Toolbar />
        {children}
      </MainContent>
    </Box>
  );
};

export default Layout;
