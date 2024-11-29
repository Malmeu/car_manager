import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Vehicle, addVehicle, getAllVehicles, updateVehicle, deleteVehicle } from '../../services/vehicleService';

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    registration: '',
    status: 'available',
    dailyRate: 0,
    mileage: 0,
    kilometers: 0,
    fuelType: 'essence'
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleOpen = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        registration: vehicle.registration,
        status: vehicle.status,
        dailyRate: vehicle.dailyRate,
        mileage: vehicle.mileage,
        kilometers: vehicle.kilometers,
        fuelType: vehicle.fuelType
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        registration: '',
        status: 'available',
        dailyRate: 0,
        mileage: 0,
        kilometers: 0,
        fuelType: 'essence'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVehicle(null);
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
      if (editingVehicle?.id) {
        await updateVehicle(editingVehicle.id, formData);
      } else {
        await addVehicle(formData);
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

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'primary';
      case 'unavailable':
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
        return 'En location';
      case 'unavailable':
        return 'Non disponible';
      default:
        return status;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vehicles</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Vehicle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Marque</TableCell>
              <TableCell>Modèle</TableCell>
              <TableCell>Année</TableCell>
              <TableCell>Immatriculation</TableCell>
              <TableCell>État</TableCell>
              <TableCell>Tarif journalier (DZD)</TableCell>
              <TableCell>Kilométrage</TableCell>
              <TableCell>Type de carburant</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.brand}</TableCell>
                <TableCell>{vehicle.model}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.registration}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={vehicle.status === 'available'}
                        onChange={async () => {
                          try {
                            const newStatus = vehicle.status === 'available' ? 'unavailable' : 'available';
                            await updateVehicle(vehicle.id!, { status: newStatus });
                            setVehicles(vehicles.map(v => 
                              v.id === vehicle.id 
                                ? { ...v, status: newStatus }
                                : v
                            ));
                          } catch (error) {
                            console.error('Error updating vehicle status:', error);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label={vehicle.status === 'available' ? 'Disponible' : 'Non disponible'}
                  />
                </TableCell>
                <TableCell>{vehicle.dailyRate} DZD</TableCell>
                <TableCell>{vehicle.mileage}</TableCell>
                <TableCell>{vehicle.kilometers}</TableCell>
                <TableCell>{vehicle.fuelType}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(vehicle)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => vehicle.id && handleDelete(vehicle.id)} 
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};

export default VehicleList;
