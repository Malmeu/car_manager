import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assignment as RentalIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { getAllVehicles, Vehicle } from '../services/vehicleService';
import { getAllCustomers } from '../services/customerService';
import { getContract } from '../services/contractService';
import { Contract } from '../types/contract';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableVehicles: 0,
    activeRentals: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Début du chargement des données du tableau de bord');
        
        // Fetch vehicles and customers
        const [vehicles, customers] = await Promise.all([
          getAllVehicles(),
          getAllCustomers(),
        ]);

        console.log('Données récupérées:', {
          vehiclesCount: vehicles.length,
          customersCount: customers.length
        });

        // Fetch all contracts from Firestore
        const contractsRef = collection(db, 'contracts');
        const contractsSnapshot = await getDocs(contractsRef);
        console.log('Contrats trouvés dans Firestore:', contractsSnapshot.size);
        
        const contracts: Contract[] = [];
        contractsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.rental?.startDate && data.rental?.endDate && data.vehicle?.registration) {
            try {
              // Vérifier que les dates sont bien des Timestamps Firestore
              const startDate = data.rental.startDate.toDate();
              const endDate = data.rental.endDate.toDate();
              contracts.push({
                ...data,
                id: doc.id,
                rental: {
                  ...data.rental,
                  startDate: data.rental.startDate,
                  endDate: data.rental.endDate
                }
              } as Contract);
            } catch (error) {
              console.error('Erreur de conversion de date pour le contrat:', doc.id, error);
            }
          } else {
            console.warn('Contrat invalide ignoré:', doc.id, {
              hasStartDate: !!data.rental?.startDate,
              hasEndDate: !!data.rental?.endDate,
              hasVehicle: !!data.vehicle?.registration
            });
          }
        });
        
        console.log('Contrats valides traités:', contracts.length);

        // Calculate active rentals
        const now = new Date();
        const activeContracts = contracts.filter(contract => {
          const startDate = contract.rental.startDate.toDate();
          const endDate = contract.rental.endDate.toDate();
          return startDate <= now && endDate >= now;
        });

        console.log('Locations actives trouvées:', activeContracts.length);

        // Get rented vehicle registrations
        const rentedVehicleRegistrations = new Set(
          activeContracts.map(contract => contract.vehicle.registration)
        );

        // Calculate available vehicles
        const availableVehicles = vehicles.filter(vehicle => 
          !rentedVehicleRegistrations.has(vehicle.registration)
        ).length;

        console.log('Statut des véhicules:', {
          total: vehicles.length,
          rented: rentedVehicleRegistrations.size,
          available: availableVehicles
        });

        // Calculate monthly revenue
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const monthlyContracts = contracts.filter(contract => {
          const startDate = contract.rental.startDate.toDate();
          return startDate.getMonth() === currentMonth && 
                 startDate.getFullYear() === currentYear;
        });

        const monthlyRevenue = monthlyContracts.reduce((total, contract) => 
          total + (contract.rental.totalCost || 0), 0
        );

        console.log('Revenus du mois:', {
          month: currentMonth + 1,
          year: currentYear,
          contractCount: monthlyContracts.length,
          total: monthlyRevenue
        });

        setStats({
          availableVehicles,
          activeRentals: activeContracts.length,
          totalCustomers: customers.length,
          monthlyRevenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsConfig = [
    {
      title: 'Véhicules Disponibles',
      value: stats.availableVehicles.toString(),
      icon: <CarIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Locations Actives',
      value: stats.activeRentals.toString(),
      icon: <RentalIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Clients Total',
      value: stats.totalCustomers.toString(),
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Revenus du Mois',
      value: new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(stats.monthlyRevenue),
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord
      </Typography>
      <Grid container spacing={3}>
        {statsConfig.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={100} height={60} />
                    ) : (
                      <Typography variant="h4">{stat.value}</Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: `${stat.color}15`,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(stat.icon, { sx: { color: stat.color } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
