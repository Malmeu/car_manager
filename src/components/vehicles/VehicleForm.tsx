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

const initialState: Omit<Vehicle, 'id'> = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  registration: '',
  licensePlate: '',
  dailyRate: 0,
  mileage: 0,
  fuelType: '',
  kilometers: 0,
  status: 'available',
  userId: '',
};

const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      const { id, ...vehicleData } = vehicle;
      setFormData(vehicleData);
    } else {
      setFormData(initialState);
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand) newErrors.brand = 'La marque est requise';
    if (!formData.model) newErrors.model = 'Le modèle est requis';
    if (!formData.registration) newErrors.registration = "L'immatriculation est requise";
    if (formData.dailyRate <= 0) newErrors.dailyRate = 'Le prix journalier doit être supérieur à 0';
    if (formData.mileage < 0) newErrors.mileage = 'Le kilométrage ne peut pas être négatif';
    if (formData.kilometers < 0) newErrors.kilometers = 'Le kilométrage ne peut pas être négatif';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (vehicle?.id) {
        await updateDoc(doc(db, 'vehicles', vehicle.id), formData);
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
      [name]: name === 'year' || name === 'dailyRate' || name === 'mileage' || name === 'kilometers'
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
              <MenuItem value="hybrid">Hybride</MenuItem>
              <MenuItem value="electric">Électrique</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Kilométrage"
              name="kilometers"
              type="number"
              value={formData.kilometers}
              onChange={handleChange}
              error={!!errors.kilometers}
              helperText={errors.kilometers}
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
