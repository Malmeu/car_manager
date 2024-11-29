import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#78a6c8',     // Bleu clair principal
      light: '#9ccfe7',    // Bleu très clair
      dark: '#e9eef2',     // Bleu gris très clair
    },
    secondary: {
      main: '#e6f3f8',     // Bleu glacier très clair
      light: '#f5f9fc',    // Presque blanc avec une touche de bleu
      dark: '#4a6670',     // Bleu gris foncé pour le contraste
    },
    background: {
      default: '#ffffff',   // Blanc pur
      paper: '#f8fafc',    // Blanc légèrement bleuté
    },
    text: {
      primary: '#2c3e50',  // Bleu gris foncé pour le texte
      secondary: '#607d8b', // Bleu gris moyen pour le texte secondaire
    },
  },
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: '#e6f3f8',
          color: '#2c3e50',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#f8fafc',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(120, 166, 200, 0.1)',
          boxShadow: '0 2px 4px rgba(120, 166, 200, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#9ccfe7',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid rgba(120, 166, 200, 0.1)',
          boxShadow: '0 4px 6px rgba(120, 166, 200, 0.05)',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#e6f3f8',
          '& .MuiTableCell-root': {
            color: '#2c3e50',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f9fc',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
        filled: {
          backgroundColor: '#e6f3f8',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(44, 62, 80, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: '#78a6c8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#78a6c8',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          color: '#2c3e50',
          boxShadow: '0 1px 2px rgba(44, 62, 80, 0.05)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          h2: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          h3: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          h4: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          h5: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          h6: {
            color: '#2c3e50',
            fontWeight: 600,
          },
          body1: {
            color: '#2c3e50',
          },
          body2: {
            color: '#607d8b',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f8fafc',
          borderRight: '1px solid rgba(120, 166, 200, 0.1)',
          '& .MuiListItemButton-root': {
            '&:hover': {
              backgroundColor: '#e6f3f8',
            },
            '&.Mui-selected': {
              backgroundColor: '#e6f3f8',
              '&:hover': {
                backgroundColor: '#d1e8f3',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: '#78a6c8',
          },
          '& .MuiListItemText-root': {
            color: '#2c3e50',
          },
        },
      },
    },
  },
});
