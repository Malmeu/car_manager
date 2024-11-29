import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Vehicle } from '../../types';

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicle }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'primary';
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'rented':
        return 'Loué';
      case 'maintenance':
        return 'En maintenance';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" gutterBottom>
                Informations générales
              </Typography>
              <Typography variant="body1">
                <strong>Immatriculation:</strong> {vehicle.registration}
              </Typography>
              <Typography variant="body1">
                <strong>Statut:</strong>{' '}
                <Chip
                  label={getStatusLabel(vehicle.status)}
                  color={getStatusColor(vehicle.status) as any}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body1">
                <strong>Type de carburant:</strong>{' '}
                {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" gutterBottom>
                Informations de location
              </Typography>
              <Typography variant="body1">
                <strong>Prix journalier:</strong> {vehicle.dailyRate} €
              </Typography>
              <Typography variant="body1">
                <strong>Kilométrage:</strong> {vehicle.mileage.toLocaleString()} km
              </Typography>
              {vehicle.lastMaintenance && (
                <Typography variant="body1">
                  <strong>Dernière maintenance:</strong>{' '}
                  {new Date(vehicle.lastMaintenance).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {vehicle.imageUrl && (
          <Box sx={{ mt: 2 }}>
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                borderRadius: '4px',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleDetails;
