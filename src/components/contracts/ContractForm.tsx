import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Vehicle } from '../../models/Vehicle';
import ContractPreview from './ContractPreview';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export interface ContractFormData {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  driverLicense: string;
  vehicleId: string;
  startDate: Date | null;
  endDate: Date | null;
  withDriver: boolean;
  driverPrice: number;
  discount: number;
  deposit: number;
  additionalNotes: string;
}

const initialFormData: ContractFormData = {
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  driverLicense: '',
  vehicleId: '',
  startDate: null,
  endDate: null,
  withDriver: false,
  driverPrice: 0,
  discount: 0,
  deposit: 0,
  additionalNotes: ''
};

const steps = ['Informations client', 'Détails de location', 'Aperçu du contrat'];

const ContractForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      try {
        const vehiclesCollection = collection(db, 'vehicles');
        const q = query(vehiclesCollection, where('userId', '==', currentUser.uid));
        const vehiclesSnapshot = await getDocs(q);
        const vehiclesList = vehiclesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vehicle[];
        setVehicles(vehiclesList);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [currentUser]);

  const handleInputChange = (prop: keyof ContractFormData) => 
    (event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string> | React.SyntheticEvent) => {
      const value = 
        event.target instanceof HTMLInputElement 
          ? event.target.value 
          : (event.target as { value: string }).value;
      
      setFormData(prevData => ({
        ...prevData,
        [prop]: prop === 'withDriver' 
          ? (event.target as HTMLInputElement).checked 
          : value
      }));

      if (prop === 'vehicleId') {
        const vehicle = vehicles.find(v => v.id === value);
        setSelectedVehicle(vehicle || null);
      }
    };

  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }
    
    try {
      const contractsRef = collection(db, 'contracts');
      const docRef = await addDoc(contractsRef, {
        ...formData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      // Rediriger vers la page de prévisualisation avec option d'impression
      navigate(`/contract-preview/${docRef.id}?print=true`);
      
      // Rediriger vers la liste des contrats après un court délai
      setTimeout(() => {
        navigate('/contracts');
      }, 500);
    } catch (error) {
      console.error('Error creating contract:', error);
      // Gérer l'erreur ici
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    navigate('/contracts');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom complet du client"
                value={formData.clientName}
                onChange={handleInputChange('clientName')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de téléphone"
                value={formData.clientPhone}
                onChange={handleInputChange('clientPhone')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.clientEmail}
                onChange={handleInputChange('clientEmail')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de permis"
                value={formData.driverLicense}
                onChange={handleInputChange('driverLicense')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={formData.clientAddress}
                onChange={handleInputChange('clientAddress')}
                multiline
                rows={2}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Véhicule</InputLabel>
                <Select
                  value={formData.vehicleId}
                  onChange={handleInputChange('vehicleId')}
                  label="Véhicule"
                  required
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.withDriver}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        withDriver: newValue,
                        driverPrice: newValue ? prev.driverPrice : 0
                      }));
                    }}
                  />
                }
                label="Avec chauffeur"
              />
            </Grid>
            {formData.withDriver && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prix du chauffeur (DA/jour)"
                  type="number"
                  value={formData.driverPrice}
                  onChange={handleInputChange('driverPrice')}
                  InputProps={{ inputProps: { min: 0 } }}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DateTimePicker
                  label="Date de début"
                  value={formData.startDate}
                  onChange={handleDateChange('startDate')}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DateTimePicker
                  label="Date de fin"
                  value={formData.endDate}
                  onChange={handleDateChange('endDate')}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Remise (%)"
                type="number"
                value={formData.discount}
                onChange={handleInputChange('discount')}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Caution (DA)"
                type="number"
                value={formData.deposit}
                onChange={handleInputChange('deposit')}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes additionnelles"
                value={formData.additionalNotes}
                onChange={handleInputChange('additionalNotes')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return <ContractPreview formData={formData} vehicle={selectedVehicle} />;

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Nouveau Contrat de Location
        </Typography>

        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleCancel} variant="outlined" color="error">
            Annuler
          </Button>
          <Box>
            <Button
              onClick={handleBack}
              sx={{ mr: 1 }}
              disabled={activeStep === 0}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            >
              {activeStep === steps.length - 1 ? 'Créer le contrat' : 'Suivant'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContractForm;
