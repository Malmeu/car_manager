import React from 'react';
import { ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { globalStyles } from '../../styles/globalStyles';

interface MenuListItemProps {
  item: {
    text: string;
    icon: React.ReactNode;
    path: string;
  };
  onClick: () => void;
  primaryColor: string;
}

const MenuListItem: React.FC<MenuListItemProps> = ({ item, onClick, primaryColor }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <ListItem
      button
      onClick={onClick}
      sx={{
        ...globalStyles.menuItemAnimation,
        position: 'relative',
        borderRadius: '12px',
        mx: 1,
        my: 0.5,
        overflow: 'hidden',
        backgroundColor: isActive ? `${primaryColor}15` : 'transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: `${primaryColor}10`,
          transform: 'translateX(5px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: isActive 
            ? `linear-gradient(90deg, ${primaryColor}15, transparent)`
            : 'transparent',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.3s ease',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: isActive ? '4px' : '0',
          height: '60%',
          backgroundColor: primaryColor,
          borderRadius: '0 4px 4px 0',
          transition: 'width 0.3s ease',
        },
      }}
    >
      <ListItemIcon
        sx={{
          color: primaryColor,
          minWidth: 40,
          transition: 'transform 0.3s ease',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.text}
        sx={{
          '& .MuiListItemText-primary': {
            fontWeight: isActive ? 600 : 400,
            color: isActive ? primaryColor : 'inherit',
            transition: 'all 0.3s ease',
          },
        }}
      />
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: primaryColor,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.3)',
              },
              '70%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 6px rgba(0, 0, 0, 0)',
              },
              '100%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
              },
            },
          }}
        />
      )}
    </ListItem>
  );
};

export default MenuListItem;
