import React, { useEffect, useState } from 'react';
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
  Chip,
} from '@mui/material';
import { getAllRentals, Rental } from '../../services/rentalService';
import { getAllVehicles, Vehicle } from '../../services/vehicleService';
import { getAllCustomers, Customer } from '../../services/customerService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Define the shape of the data from Firebase
interface DisplayRental extends Omit<Rental, 'id'> {
  id: string;  // Make id required for display
}

const LocationHistory: React.FC = () => {
  const [locations, setLocations] = useState<DisplayRental[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        // Load all data in parallel
        const [rentalsData, vehiclesData, customersData] = await Promise.all([
          getAllRentals(currentUser.uid),
          getAllVehicles(currentUser.uid),
          getAllCustomers(currentUser.uid),
        ]);

        // Create lookup maps for vehicles and customers
        const vehiclesMap = vehiclesData.reduce((acc, vehicle) => {
          if (vehicle.id) {
            acc[vehicle.id] = vehicle;
          }
          return acc;
        }, {} as Record<string, Vehicle>);

        const customersMap = customersData.reduce((acc, customer) => {
          if (customer.id) {
            acc[customer.id] = customer;
          }
          return acc;
        }, {} as Record<string, Customer>);

        setVehicles(vehiclesMap);
        setCustomers(customersMap);
        
        // Filter out rentals with missing required fields and ensure id is present
        const validRentals = rentalsData
          .filter((rental): rental is Rental & { id: string } => {
            return Boolean(
              rental.id &&
              rental.vehicleId &&
              rental.customerId &&
              rental.startDate &&
              rental.endDate &&
              rental.status &&
              typeof rental.totalCost === 'number'
            );
          })
          .map(rental => ({
            ...rental,
            id: rental.id // TypeScript now knows id exists
          }));
        
        setLocations(validRentals);
      } catch (error) {
        console.error('Error loading location history:', error);
      }
    };

    loadData(); 
  }, [currentUser]);

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles[vehicleId];
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule inconnu';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers[customerId];
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Client inconnu';
  };

  const getStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

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
                <TableCell>{getVehicleName(location.vehicleId)}</TableCell>
                <TableCell>{getCustomerName(location.customerId)}</TableCell>
                <TableCell>{formatDate(location.startDate)}</TableCell>
                <TableCell>{formatDate(location.endDate)}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(location.status)}
                    color={getStatusColor(location.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{location.totalCost.toLocaleString('fr-FR')} DA</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LocationHistory;
