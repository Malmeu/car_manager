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
} from '@mui/icons-material';
import { Vehicle, addVehicle, getAllVehicles, updateVehicle, deleteVehicle } from '../../services/vehicleService';
import { getAllRentals } from '../../services/rentalService';
import { db } from '../../config/firebase';
import { onSnapshot, collection } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService'; // Import the subscriptionService
import VehicleDetailDialog from './VehicleDetailDialog'; // Import VehicleDetailDialog

const VehicleList: React.FC = () => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    registration: '',
    licensePlate: '',
    status: 'available',
    dailyRate: 0,
    mileage: 0,
    kilometers: 0,
    fuelType: 'essence',
    userId: currentUser?.uid || ''
  });
  const [activeRentals, setActiveRentals] = useState<string[]>([]);

  useEffect(() => {
    console.log('VehicleList - Component mounted');
    loadVehicles();

    // Écouter les changements de la collection vehicles
    const unsubscribe = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        console.log('Firestore - Vehicle collection update detected');
        console.log('Number of documents:', snapshot.size);
        snapshot.docChanges().forEach((change) => {
          console.log('Document change type:', change.type);
          console.log('Document data:', change.doc.data());
        });
        loadVehicles();
      },
      (error) => {
        console.error('Firestore - Error listening to vehicles:', error);
      }
    );

    return () => {
      console.log('VehicleList - Component unmounting');
      unsubscribe();
    };
  }, []); // Initial load

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

      console.log('Vehicles data received:', vehiclesData.length);
      console.log('Rentals data received:', rentalsData.length);

      // Récupérer les IDs des véhicules actuellement en location
      const rentedVehicleIds = rentalsData
        .filter(rental => rental.status === 'active')
        .map(rental => rental.vehicleId);
      
      console.log('Active rental vehicle IDs:', rentedVehicleIds);
      setActiveRentals(rentedVehicleIds);

      // Mettre à jour le statut des véhicules en fonction des locations actives
      const updatedVehicles = vehiclesData.map(vehicle => {
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
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        dailyRate: vehicle.dailyRate,
        mileage: vehicle.mileage,
        kilometers: vehicle.kilometers,
        fuelType: vehicle.fuelType,
        userId: vehicle.userId,
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        registration: '',
        licensePlate: '',
        status: 'available',
        dailyRate: 0,
        mileage: 0,
        kilometers: 0,
        fuelType: '',
        userId: currentUser?.uid || '',
      });
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
      [name]: name === 'year' || name === 'dailyRate' || name === 'mileage' || name === 'kilometers' ? Number(value) : value,
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

  return (
    <Box p={3}>
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
          <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => handleCardClick(vehicle)}
            >
              <Box
                sx={{
                  p: 2,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  color: 'white',
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {vehicle.brand} {vehicle.model}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    size="small"
                    label={activeRentals.includes(vehicle.id!) ? 'En location' :
                           vehicle.status === 'available' ? 'Disponible' : 'Indisponible'}
                    color={activeRentals.includes(vehicle.id!) ? 'warning' :
                           vehicle.status === 'available' ? 'success' : 'error'}
                    onClick={(e) => handleStatusToggle(e, vehicle)}
                    sx={{ 
                      cursor: activeRentals.includes(vehicle.id!) ? 'default' : 'pointer',
                      backgroundColor: activeRentals.includes(vehicle.id!) ? '#ed6c02' :
                                    vehicle.status === 'available' ? '#2e7d32' : '#d32f2f',
                      color: 'white',
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${vehicle.year}`}
                    icon={<DateIcon />}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                  />
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FuelIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {vehicle.fuelType}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.kilometers.toLocaleString()} km
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: '#f5f5f5',
                    p: 1,
                    borderRadius: 1
                  }}>
                    <span style={{ fontWeight: 500 }}>Immat:</span> {vehicle.registration}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ 
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e3f2fd',
                    p: 1,
                    borderRadius: 1
                  }}>
                    {vehicle.dailyRate.toLocaleString()} DZD/jour
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ 
                justifyContent: 'flex-end', 
                p: 1.5,
                borderTop: '1px solid #eee'
              }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleEditClick(e, vehicle)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteClick(e, vehicle)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
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
              name="licensePlate"
              label="Plaque d'immatriculation"
              type="text"
              fullWidth
              value={formData.licensePlate}
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
              name="kilometers"
              label="Kilométrage"
              type="number"
              fullWidth
              value={formData.kilometers}
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
