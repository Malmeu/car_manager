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

  const getPaymentStatusChip = (rental: DisplayRental) => {
    const paidAmount = rental.paidAmount || 0;
    const totalAmount = rental.totalCost + (rental.additionalFees?.amount || 0);
    
    if (paidAmount === 0) {
      return (
        <Chip
          label="En attente"
          color="warning"
          size="small"
          sx={{ minWidth: '120px' }}
        />
      );
    } else if (paidAmount < totalAmount) {
      return (
        <Chip
          label={`Partiel: ${paidAmount} DA`}
          color="info"
          size="small"
          sx={{ minWidth: '120px' }}
        />
      );
    } else {
      return (
        <Chip
          label={`Payé: ${paidAmount} DA`}
          color="success"
          size="small"
          sx={{ minWidth: '120px' }}
        />
      );
    }
  };

  const getRentalStatusChip = (status: string) => {
    let color: "warning" | "success" | "error" | "info" = "info";
    let label = status;

    switch (status.toLowerCase()) {
      case 'active':
        color = "success";
        label = "En cours";
        break;
      case 'reservation':
        color = "warning";
        label = "Réservation";
        break;
      case 'completed':
        color = "info";
        label = "Terminée";
        break;
      case 'cancelled':
        color = "error";
        label = "Annulée";
        break;
    }

    return (
      <Chip
        label={label}
        color={color}
        size="small"
        sx={{ minWidth: '100px' }}
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
          '.MuiTableCell-root': {
            borderColor: 'rgba(224, 224, 224, 0.4)'
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                DATE DE DÉBUT
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                DATE DE FIN
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                CLIENT
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                VÉHICULE
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                COÛT TOTAL
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                STATUT
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                PAIEMENT
              </TableCell>
              <TableCell 
                align="right"
                sx={{ 
                  fontWeight: 600,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  borderBottom: '2px solid rgba(224, 224, 224, 0.4)',
                  py: 2
                }}
              >
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => {
              const vehicle = vehicles[location.vehicleId];
              const customer = customers[location.customerId];
              const totalAmount = location.totalCost + (location.additionalFees?.amount || 0);

              return (
                <TableRow 
                  key={location.id} 
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transition: 'background-color 0.2s ease'
                    },
                    '& td': {
                      py: 2.5,
                      px: 2
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(location.startDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(location.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {customer ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {customer.firstName[0]}{customer.lastName[0]}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {customer.firstName} {customer.lastName}
                        </Typography>
                      </Box>
                    ) : 'Client inconnu'}
                  </TableCell>
                  <TableCell>
                    {vehicle ? (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                    ) : 'Véhicule inconnu'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {totalAmount.toLocaleString()} DA
                    </Typography>
                  </TableCell>
                  <TableCell>{getRentalStatusChip(location.status)}</TableCell>
                  <TableCell>{getPaymentStatusChip(location)}</TableCell>
                  <TableCell align="right">
                    {/* Vos actions existantes */}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LocationHistory;
