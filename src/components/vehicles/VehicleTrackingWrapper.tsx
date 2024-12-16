import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VehicleTracking from './VehicleTracking';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const VehicleTrackingWrapper: React.FC = () => {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!vehicleId) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          ID du véhicule non spécifié
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/vehicles')}
          startIcon={<ArrowBackIcon />}
        >
          Retour à la liste des véhicules
        </Button>
      </Box>
    );
  }

  return (
    <Suspense fallback={
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    }>
      <VehicleTracking />
    </Suspense>
  );
};

export default VehicleTrackingWrapper;
