import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f7a8c',
      light: '#2d93a7',
      dark: '#1a6574',
    },
    secondary: {
      main: '#bfdbf7',
      light: '#e1e5f2',
      dark: '#022b3a',
    },
    background: {
      default: '#ffffff',
      paper: '#e1e5f2',
    },
    text: {
      primary: '#022b3a',
      secondary: '#1f7a8c',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#e1e5f2',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(2, 43, 58, 0.1)',
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
            backgroundColor: '#2d93a7',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#e1e5f2',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(2, 43, 58, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#e1e5f2',
          color: '#022b3a',
          boxShadow: '0 1px 2px rgba(2, 43, 58, 0.05)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#e1e5f2',
          '& .MuiTableCell-head': {
            color: '#022b3a',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(191, 219, 247, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(2, 43, 58, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: '#1f7a8c',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1f7a8c',
            },
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: '#022b3a',
      fontWeight: 600,
    },
    h2: {
      color: '#022b3a',
      fontWeight: 600,
    },
    h3: {
      color: '#022b3a',
      fontWeight: 600,
    },
    h4: {
      color: '#022b3a',
      fontWeight: 600,
    },
    h5: {
      color: '#022b3a',
      fontWeight: 600,
    },
    h6: {
      color: '#022b3a',
      fontWeight: 600,
    },
    body1: {
      color: '#022b3a',
    },
    body2: {
      color: '#1f7a8c',
    },
  },
});
