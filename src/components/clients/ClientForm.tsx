import React, { useState, ChangeEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid
} from '@mui/material';
import { addCustomer } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';

interface FormData {
  userId: string;
  type: 'particular' | 'business';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  companyName?: string;
}

interface ClientFormProps {
  onSuccess?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    userId: currentUser?.uid || '',
    type: 'particular',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    drivingLicense: ''
  });

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      type: e.target.value as 'particular' | 'business',
      companyName: e.target.value === 'particular' ? undefined : prev.companyName
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
        onSuccess?.();
      } else {
        console.error('Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <FormControl component="fieldset" fullWidth margin="normal" required>
        <FormLabel component="legend">Type de client</FormLabel>
        <RadioGroup
          row
          name="type"
          value={formData.type}
          onChange={handleTypeChange}
          sx={{ mb: 2 }}
        >
          <FormControlLabel 
            value="particular" 
            control={<Radio />} 
            label="Particulier" 
          />
          <FormControlLabel 
            value="business" 
            control={<Radio />} 
            label="Entreprise" 
          />
        </RadioGroup>
      </FormControl>

      {formData.type === 'business' && (
        <TextField
          fullWidth
          label="Nom de l'entreprise"
          name="companyName"
          value={formData.companyName || ''}
          onChange={handleTextChange}
          required
          margin="normal"
        />
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Prénom"
            name="firstName"
            value={formData.firstName}
            onChange={handleTextChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nom"
            name="lastName"
            value={formData.lastName}
            onChange={handleTextChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleTextChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Téléphone"
            name="phone"
            value={formData.phone}
            onChange={handleTextChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Adresse"
            name="address"
            value={formData.address}
            onChange={handleTextChange}
            required
            margin="normal"
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Numéro de permis"
            name="drivingLicense"
            value={formData.drivingLicense}
            onChange={handleTextChange}
            required
            margin="normal"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
        >
          Ajouter
        </Button>
      </Box>
    </Box>
  );
};

export default ClientForm;
