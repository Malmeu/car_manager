import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';

interface Location {
  id: string;
  vehicule: string;
  client: string;
  dateDebut: string;
  dateFin: string;
  status: string;
  montant: number;
}

const LocationHistory: React.FC = () => {
  // Exemple de données (à remplacer par les vraies données de votre application)
  const locations: Location[] = [
    {
      id: '1',
      vehicule: 'Renault Clio',
      client: 'Jean Dupont',
      dateDebut: '2024-01-01',
      dateFin: '2024-01-07',
      status: 'Terminée',
      montant: 350,
    },
    // Ajoutez plus d'exemples ici
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Historique des Locations
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'secondary.main' }}>
              <TableCell>ID</TableCell>
              <TableCell>Véhicule</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Date de début</TableCell>
              <TableCell>Date de fin</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Montant (DA)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow 
                key={location.id}
                sx={{ '&:hover': { backgroundColor: 'background.paper' } }}
              >
                <TableCell>{location.id}</TableCell>
                <TableCell>{location.vehicule}</TableCell>
                <TableCell>{location.client}</TableCell>
                <TableCell>{location.dateDebut}</TableCell>
                <TableCell>{location.dateFin}</TableCell>
                <TableCell>{location.status}</TableCell>
                <TableCell>{location.montant} DA</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LocationHistory;
