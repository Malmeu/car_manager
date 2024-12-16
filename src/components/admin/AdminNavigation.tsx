import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Subscriptions as SubscriptionsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminNavigation: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard'
    },
    {
      text: 'Utilisateurs',
      icon: <PeopleIcon />,
      path: '/admin/users'
    },
    {
      text: 'Abonnements',
      icon: <SubscriptionsIcon />,
      path: '/admin/subscriptions'
    },
    {
      text: 'Paiements',
      icon: <PaymentIcon />,
      path: '/admin/payments'
    },
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/admin/notifications'
    },
    {
      text: 'Paramètres',
      icon: <SettingsIcon />,
      path: '/admin/settings'
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <List component="nav">
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main + '30',
                    }
                  },
                  borderRadius: 1,
                  m: 0.5
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path
                      ? theme.palette.primary.main
                      : 'inherit'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      color: location.pathname === item.path
                        ? theme.palette.primary.main
                        : 'inherit'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
            {(item.text === 'Notifications' || item.text === 'Paiements') && (
              <Divider sx={{ my: 1 }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default AdminNavigation;
