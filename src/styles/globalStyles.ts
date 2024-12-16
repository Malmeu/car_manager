import { Theme } from '@mui/material/styles';

export const globalStyles = {
  gradientBackground: {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    minHeight: '100vh',
  },

  // Effet de glassmorphism pour les cartes
  glassEffect: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  },

  // Animation pour les éléments du menu
  menuItemAnimation: {
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'all 0.5s ease',
    },
    '&:hover::before': {
      left: '100%',
    },
  },

  // Effet de hover pour les cartes
  cardHoverEffect: {
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    },
  },
};
