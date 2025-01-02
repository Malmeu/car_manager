import { Theme } from '@mui/material/styles';

export const globalStyles = {
  menuItemAnimation: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateX(5px)',
    },
  },
  cardHoverEffect: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
  },
  buttonHoverEffect: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  gradientText: {
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};
