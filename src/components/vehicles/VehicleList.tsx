import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  Speed as SpeedIcon,
  Event as DateIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Vehicle, addVehicle, getAllVehicles, updateVehicle, deleteVehicle } from '../../services/vehicleService';
import { getAllRentals } from '../../services/rentalService';
import { db } from '../../config/firebase';
import { onSnapshot, collection } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService'; // Import the subscriptionService
import VehicleDetailDialog from './VehicleDetailDialog'; // Import VehicleDetailDialog
import { useNavigate } from 'react-router-dom';
import { VehicleCard } from './VehicleCard';

const initialState: Omit<Vehicle, 'id'> = {
  userId: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  registration: '',
  status: 'available',
  dailyRate: 0,
  baseMileage: 0,
  fuelType: '',
  imageUrl: '',
};

const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [activeRentals, setActiveRentals] = useState<string[]>([]);

  useEffect(() => {
    console.log('VehicleList - Component mounted');
    let isSubscribed = true;

    const loadInitialVehicles = async () => {
      try {
        if (!currentUser?.uid || !isSubscribed) return;
        const vehiclesData = await getAllVehicles(currentUser.uid);
        if (isSubscribed) {
          setVehicles(vehiclesData);
        }
      } catch (error) {
        console.error('Error loading initial vehicles:', error);
      }
    };

    // Charger les véhicules initiaux
    loadInitialVehicles();

    // Configurer l'écouteur Firestore
    const unsubscribe = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        if (!isSubscribed) return;
        
        console.log('Firestore - Vehicle collection update detected');
        loadInitialVehicles();
      },
      (error) => {
        console.error('Firestore - Error listening to vehicles:', error);
      }
    );

    return () => {
      console.log('VehicleList - Component unmounting, cleaning up subscriptions');
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUser]); // Dépendance à currentUser

  useEffect(() => {
    console.log('Filtering vehicles:', {
      totalVehicles: vehicles.length,
      searchTerm,
    });
    
    const filtered = vehicles.filter(vehicle => 
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('Filtered vehicles:', filtered.length);
    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm]);

  const loadVehicles = async () => {
    if (!currentUser?.uid) return;  // Add guard clause
    
    try {
      console.log('Loading vehicles and rentals...');
      const [vehiclesData, rentalsData] = await Promise.all([
        getAllVehicles(currentUser.uid),
        getAllRentals(currentUser.uid)
      ]);

      // Vérifier que chaque véhicule a un ID
      const validVehicles = vehiclesData.filter(vehicle => {
        if (!vehicle.id) {
          console.error('Vehicle without ID:', vehicle);
          return false;
        }
        return true;
      });

      console.log('Vehicles data received:', validVehicles.length);
      console.log('Rentals data received:', rentalsData.length);

      // Récupérer les IDs des véhicules actuellement en location
      const rentedVehicleIds = rentalsData
        .filter(rental => rental.status === 'active')
        .map(rental => rental.vehicleId);
      
      console.log('Active rental vehicle IDs:', rentedVehicleIds);
      setActiveRentals(rentedVehicleIds);

      // Mettre à jour le statut des véhicules en fonction des locations actives
      const updatedVehicles = validVehicles.map(vehicle => {
        const isRented = rentedVehicleIds.includes(vehicle.id!);
        console.log(`Vehicle ${vehicle.id} (${vehicle.brand} ${vehicle.model}) - Rented: ${isRented}`);
        
        return {
          ...vehicle,
          status: isRented ? 'rented' as const : vehicle.status
        };
      });

      console.log('Setting updated vehicles:', updatedVehicles.length);
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleOpen = async (vehicle?: Vehicle) => {
    if (!vehicle) {
      // Vérifier si l'utilisateur peut ajouter un nouveau véhicule
      const canAdd = await subscriptionService.canAddVehicle(currentUser?.uid || '', vehicles.length);
      if (!canAdd) {
        alert('Vous avez atteint la limite de véhicules pour votre plan d\'abonnement. Veuillez mettre à niveau votre plan pour ajouter plus de véhicules.');
        return;
      }
    }

    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        registration: vehicle.registration,
        status: vehicle.status,
        dailyRate: vehicle.dailyRate,
        baseMileage: vehicle.baseMileage,
        fuelType: vehicle.fuelType,
        userId: vehicle.userId,
      });
    } else {
      setEditingVehicle(null);
      setFormData(initialState);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVehicle(null);
  };

  const handleCardClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' || name === 'baseMileage' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentUser?.uid) return;  // Add guard clause
      
      if (editingVehicle?.id) {
        // Si le véhicule est en cours de location, ne pas modifier son statut
        const isRented = activeRentals.includes(editingVehicle.id);
        const dataToUpdate = {
          ...formData,
          status: isRented ? 'rented' : formData.status
        };
        await updateVehicle(editingVehicle.id, dataToUpdate);
      } else {
        // Ajouter le userId aux données du véhicule
        await addVehicle({
          ...formData,
          userId: currentUser.uid
        });
      }
      handleClose();
      loadVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const handleStatusToggle = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation(); // Empêcher la propagation du clic
    const newStatus = vehicle.status === 'available' ? 'maintenance' : 'available';
    updateVehicle(vehicle.id!, { ...vehicle, status: newStatus });
  };

  const handleEditClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation(); // Empêcher la propagation du clic
    handleOpen(vehicle);
  };

  const handleDeleteClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation(); // Empêcher la propagation du clic
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      deleteVehicle(vehicle.id!);
    }
  };

  const handleTrackingClick = (vehicleId: string | undefined) => {
    if (!vehicleId) return;
    navigate(`/vehicles/${vehicleId}/tracking`);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    handleOpen(vehicle);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    handleDelete(vehicleId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Véhicules</Typography>
        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Rechercher un véhicule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Ajouter un véhicule
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredVehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <VehicleCard
              vehicle={vehicle}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="brand"
              label="Marque"
              type="text"
              fullWidth
              value={formData.brand}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="model"
              label="Modèle"
              type="text"
              fullWidth
              value={formData.model}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="year"
              label="Année"
              type="number"
              fullWidth
              value={formData.year}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="registration"
              label="Immatriculation"
              type="text"
              fullWidth
              value={formData.registration}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="baseMileage"
              label="Kilométrage initial"
              type="number"
              fullWidth
              value={formData.baseMileage}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="status"
              label="État"
              select
              fullWidth
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="available">Disponible</MenuItem>
              <MenuItem value="rented">En location</MenuItem>
              <MenuItem value="unavailable">Non disponible</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              name="dailyRate"
              label="Tarif journalier (DZD)"
              type="number"
              fullWidth
              value={formData.dailyRate}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="fuelType"
              label="Type de carburant"
              type="text"
              fullWidth
              value={formData.fuelType}
              onChange={handleInputChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingVehicle ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {selectedVehicle && (
        <VehicleDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          vehicle={selectedVehicle}
        />
      )}
    </Box>
  );
};

export default VehicleList;
