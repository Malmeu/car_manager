import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { addCustomer } from '../../services/customerService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface FormData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
}

const ClientForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    userId: currentUser?.uid || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    drivingLicense: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerId = await addCustomer({
        ...formData,
        rentalsHistory: []
      });
      if (customerId) {
        console.log('Customer added successfully');
        navigate('/clients');
      } else {
        console.error('Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ajouter un Client
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Prénom"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Nom"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Téléphone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Adresse"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Permis de conduire"
            name="drivingLicense"
            value={formData.drivingLicense}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Ajouter le Client
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ClientForm;
