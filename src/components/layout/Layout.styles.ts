import { Theme } from '@mui/material/styles';

export const drawerWidth = 240;

export const getStyles = (theme: Theme, primaryColor: string) => ({
  appBar: {
    backgroundColor: primaryColor,
    boxShadow: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    background: `${primaryColor}ee`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  
  menuButton: {
    marginRight: 2,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },

  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
    },
  },

  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },

  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
  },

  menuItem: {
    borderRadius: '8px',
    margin: '4px 8px',
    '&:hover': {
      backgroundColor: `${primaryColor}15`,
    },
    '&.active': {
      backgroundColor: `${primaryColor}22`,
      '& .MuiListItemIcon-root': {
        color: primaryColor,
      },
      '& .MuiListItemText-primary': {
        fontWeight: 600,
        color: primaryColor,
      },
    },
  },

  menuIcon: {
    color: primaryColor,
    minWidth: 40,
  },

  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1),
    minHeight: { xs: 56, sm: 64 },
  },

  logo: {
    height: { xs: 32, sm: 40 },
    width: { xs: 32, sm: 40 },
    marginRight: 2,
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },

  title: {
    fontSize: { xs: '1rem', sm: '1.25rem' },
    fontWeight: 600,
    color: 'inherit',
    textDecoration: 'none',
  },

  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.5, sm: 1 },
  },

  actionButton: {
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
});
