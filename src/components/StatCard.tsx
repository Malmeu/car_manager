import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  return (
    <Card sx={{ 
      height: '100%',
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-2px)',
        transition: 'all 0.3s ease-in-out'
      }
    }}>
      <CardContent>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
            color: color
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h4" 
          sx={{ 
            mt: 2, 
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontWeight: 'bold'
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
