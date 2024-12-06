import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import WeatherWidget from '../components/utilities/WeatherWidget';
import TrafficWidget from '../components/utilities/TrafficWidget';
import { Handyman } from '@mui/icons-material';

const UtilitiesPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Handyman /> Utilitaires
      </Typography>
      
      <Grid container spacing={3}>
        {/* Météo Widget */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <WeatherWidget />
          </Paper>
        </Grid>

        {/* Traffic Widget */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <TrafficWidget />
          </Paper>
        </Grid>

        {/* Espace pour d'autres widgets à venir */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              backgroundColor: 'primary.light',
              color: 'primary.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Plus de fonctionnalités à venir !
            </Typography>
            <Typography variant="body1" align="center">
              Nous travaillons constamment à l'amélioration de nos services pour vous offrir plus d'outils utiles.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UtilitiesPage;
