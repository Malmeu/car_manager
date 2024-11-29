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
        
        // Fetch vehicles and customers
        const [vehicles, customers] = await Promise.all([
          getAllVehicles(),
          getAllCustomers(),
        ]);

        // Fetch all contracts from Firestore
        const contractsRef = collection(db, 'contracts');
        const contractsSnapshot = await getDocs(contractsRef);
        console.log('Raw contracts from Firestore:', contractsSnapshot.size);
        
        const contracts: Contract[] = [];
        contractsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('Contract data from Firestore:', doc.id, JSON.stringify(data, null, 2));
          if (data.rental?.endDate) {
            contracts.push({
              ...data,
              id: doc.id
            } as Contract);
          } else {
            console.warn('Skipping contract with missing rental data:', doc.id);
          }
        });
        
        console.log('Processed contracts:', contracts.length);

        // Calculate available vehicles and active rentals
        const now = new Date();
        console.log('Current date for comparison:', now.toISOString());
        
        // Filter active contracts (end date is in the future)
        const activeContracts = contracts.filter((contract: Contract) => {
          if (!contract.rental?.endDate) {
            console.log('Contract missing end date:', contract.id);
            return false;
          }
          
          if (!contract.vehicle?.registration) {
            console.log('Contract missing vehicle registration:', contract.id);
            return false;
          }
          
          let endDate: Date;
          let startDate: Date;
          try {
            endDate = contract.rental.endDate.toDate();
            startDate = contract.rental.startDate.toDate();
          } catch (error) {
            console.error('Error parsing dates for contract:', contract.id, error);
            return false;
          }
          
          const isActive = startDate <= now && endDate >= now;
          
          console.log('Contract date check:', JSON.stringify({
            id: contract.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            now: now.toISOString(),
            isStarted: startDate <= now,
            isNotEnded: endDate >= now,
            isActive
          }, null, 2));
          
          if (isActive) {
            console.log('Active contract details:', JSON.stringify({
              id: contract.id,
              vehicle: contract.vehicle?.registration,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              tenant: contract.tenant?.name,
              totalCost: contract.rental.totalCost
            }, null, 2));
          }
          return isActive;
        });

        // Get unique active rentals by vehicle
        const uniqueActiveRentals = activeContracts.reduce((acc, contract) => {
          const vehicleReg = contract.vehicle?.registration;
          if (!vehicleReg) return acc;
          
          // If we already have a rental for this vehicle, keep the one with the latest start date
          if (acc[vehicleReg]) {
            const existingStartDate = acc[vehicleReg].rental.startDate.toDate();
            const newStartDate = contract.rental.startDate.toDate();
            if (newStartDate > existingStartDate) {
              acc[vehicleReg] = contract;
            }
          } else {
            acc[vehicleReg] = contract;
          }
          
          return acc;
        }, {} as Record<string, Contract>);

        const uniqueActiveContractsList = Object.values(uniqueActiveRentals);
        console.log('Unique active rentals:', uniqueActiveContractsList.map(c => ({
          vehicle: c.vehicle?.registration,
          startDate: c.rental.startDate.toDate().toISOString(),
          endDate: c.rental.endDate.toDate().toISOString()
        })));

        // Get currently rented vehicle registrations (unique)
        const rentedVehicleRegistrations = new Set(
          uniqueActiveContractsList
            .filter(c => c.vehicle?.registration)
            .map(c => c.vehicle.registration)
        );

        console.log('Active rentals:', uniqueActiveContractsList.length);
        console.log('Rented registrations:', JSON.stringify(Array.from(rentedVehicleRegistrations), null, 2));
        console.log('All vehicles:', JSON.stringify(vehicles, null, 2));
        
        // Calculate available vehicles (counting unique registrations)
        const uniqueVehicleRegs = new Set(vehicles.map(v => v.registration));
        const availableVehicles = Array.from(uniqueVehicleRegs).filter(reg => {
          const isAvailable = !rentedVehicleRegistrations.has(reg);
          console.log(`Vehicle ${reg} status:`, JSON.stringify({
            registration: reg,
            isRented: rentedVehicleRegistrations.has(reg),
            isAvailable,
            rentedTo: uniqueActiveContractsList.find(c => c.vehicle?.registration === reg)?.tenant?.name
          }, null, 2));
          return isAvailable;
        }).length;

        // Calculate monthly revenue
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        const currentYear = currentDate.getFullYear();

        console.log('Calculating revenue for:', {
          month: currentMonth + 1,
          year: currentYear
        });

        // Get unique contracts by vehicle for revenue calculation
        const monthlyContractsMap = contracts.reduce((acc, contract) => {
          if (!contract.rental?.startDate || !contract.rental?.totalCost) {
            console.log('Contract missing revenue data:', contract.id);
            return acc;
          }

          const vehicleReg = contract.vehicle?.registration;
          if (!vehicleReg) {
            console.log('Contract missing vehicle:', contract.id);
            return acc;
          }
          
          let startDate: Date;
          try {
            startDate = contract.rental.startDate.toDate();
          } catch (error) {
            console.error('Error parsing start date for revenue:', contract.id, error);
            return acc;
          }
          
          const isThisMonth = startDate.getMonth() === currentMonth && 
                            startDate.getFullYear() === currentYear;
          
          if (isThisMonth) {
            // If we already have a contract for this vehicle this month,
            // keep the one with the highest total cost
            if (acc[vehicleReg]) {
              if (contract.rental.totalCost > acc[vehicleReg].rental.totalCost) {
                acc[vehicleReg] = contract;
              }
            } else {
              acc[vehicleReg] = contract;
            }
          }
          
          return acc;
        }, {} as Record<string, Contract>);

        const monthlyContracts = Object.values(monthlyContractsMap);
        
        monthlyContracts.forEach(contract => {
          console.log('Contract counted for revenue:', JSON.stringify({
            id: contract.id,
            vehicle: contract.vehicle?.registration,
            startDate: contract.rental.startDate.toDate().toISOString(),
            totalCost: contract.rental.totalCost,
            tenant: contract.tenant?.name
          }, null, 2));
        });

        const monthlyRevenue = monthlyContracts.reduce((total, contract) => {
          return total + (contract.rental?.totalCost || 0);
        }, 0);

        console.log('Monthly revenue calculation:', {
          numberOfContracts: monthlyContracts.length,
          totalRevenue: monthlyRevenue,
          contracts: monthlyContracts.map(c => ({
            id: c.id,
            vehicle: c.vehicle?.registration,
            cost: c.rental?.totalCost
          }))
        });

        setStats({
          availableVehicles,
          activeRentals: uniqueActiveContractsList.length,
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
