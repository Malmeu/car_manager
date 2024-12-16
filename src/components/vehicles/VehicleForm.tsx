import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Vehicle } from '../../types';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: () => void;
}

const initialState: Vehicle = {
  userId: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  registration: '',
  status: 'available',
  dailyRate: 0,
  baseMileage: 0,
  fuelType: '',
  imageUrl: ''
};

const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Vehicle>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    } else {
      setFormData(initialState);
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand) newErrors.brand = 'La marque est requise';
    if (!formData.model) newErrors.model = 'Le modèle est requis';
    if (!formData.registration) newErrors.registration = "Le numéro de série est requis";
    if (formData.dailyRate <= 0) newErrors.dailyRate = 'Le prix journalier doit être supérieur à 0';
    if (formData.baseMileage < 0) newErrors.baseMileage = 'Le kilométrage de base ne peut pas être négatif';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (vehicle?.id) {
        const vehicleData = {
          ...formData,
          lastMaintenance: formData.lastMaintenance || null,
          imageUrl: formData.imageUrl || '',
        };
        await updateDoc(doc(db, 'vehicles', vehicle.id), vehicleData);
      } else {
        await addDoc(collection(db, 'vehicles'), formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'dailyRate' || name === 'baseMileage'
        ? Number(value)
        : value,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle>
        {vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Marque"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              error={!!errors.brand}
              helperText={errors.brand}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Modèle"
              name="model"
              value={formData.model}
              onChange={handleChange}
              error={!!errors.model}
              helperText={errors.model}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Année"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              error={!!errors.year}
              helperText={errors.year}
              InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Immatriculation"
              name="registration"
              value={formData.registration}
              onChange={handleChange}
              error={!!errors.registration}
              helperText={errors.registration}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tarif journalier (DZD)"
              name="dailyRate"
              type="number"
              value={formData.dailyRate}
              onChange={handleChange}
              error={!!errors.dailyRate}
              helperText={errors.dailyRate}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Type de carburant"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
            >
              <MenuItem value="essence">Essence</MenuItem>
              <MenuItem value="diesel">Diesel</MenuItem>
              <MenuItem value="hybride">Hybride</MenuItem>
              <MenuItem value="electrique">Électrique</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Kilométrage de base"
              name="baseMileage"
              type="number"
              value={formData.baseMileage}
              onChange={handleChange}
              error={!!errors.baseMileage}
              helperText={errors.baseMileage}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="contained" color="primary">
          {vehicle ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default VehicleForm;
