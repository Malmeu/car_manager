import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { addRental } from '../../services/rentalService';
import { addCustomer, getAllCustomers } from '../../services/customerService';
import { getAllVehicles } from '../../services/vehicleService';
import { Timestamp } from 'firebase/firestore';
import { Customer } from '../../types';
import { Vehicle as VehicleModel } from '../../models/Vehicle';

interface Resource {
  id: string;
  title: string;
}

interface Vehicle extends Omit<VehicleModel, 'id'> {
  id: string;
}

interface NewRentalModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedEndDate: Date | null;
  selectedResource: Resource | null;
  onSuccess: () => void;
}

interface FormData {
  vehicleId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'active' | 'reservation';
  paymentStatus: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  wilaya: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  additionalFees: {
    description: string;
    amount: number;
  };
  contractId: string;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  wilaya: string;
  idNumber: string;
  drivingLicense: string;
}

const NewRentalModal: React.FC<NewRentalModalProps> = ({
  open,
  onClose,
  selectedDate,
  selectedEndDate,
  selectedResource,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    vehicleId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    totalCost: 0,
    status: 'active',
    paymentStatus: 'pending',
    paidAmount: 0,
    wilaya: '',
    paymentMethod: 'cash',
    additionalFees: {
      description: '',
      amount: 0
    },
    contractId: ''
  });

  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    wilaya: '',
    idNumber: '',
    drivingLicense: ''
  });

  useEffect(() => {
    if (currentUser && open) {
      loadData();
    }
  }, [currentUser, open]);

  useEffect(() => {
    if (selectedDate) {
      // Ajuster la date pour le fuseau horaire local
      const localStartDate = new Date(selectedDate);
      localStartDate.setMinutes(localStartDate.getMinutes() - localStartDate.getTimezoneOffset());
      const formattedStartDate = localStartDate.toISOString().split('T')[0];
      
      let formattedEndDate = formattedStartDate;
      if (selectedEndDate) {
        const localEndDate = new Date(selectedEndDate);
        localEndDate.setMinutes(localEndDate.getMinutes() - localEndDate.getTimezoneOffset());
        formattedEndDate = localEndDate.toISOString().split('T')[0];
      }
      
      setFormData(prev => ({
        ...prev,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }));
    }
  }, [selectedDate, selectedEndDate]);

  useEffect(() => {
    if (selectedVehicle && formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Si les dates sont les mêmes ou consécutives, c'est une journée de location
      const days = startDate.getDate() === endDate.getDate() ? 1 :
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const newTotalCost = days * (selectedVehicle.dailyRate || 0);
      
      setTotalCost(newTotalCost);
      setFormData(prev => ({
        ...prev,
        totalCost: newTotalCost
      }));
    }
  }, [selectedVehicle, formData.startDate, formData.endDate]);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [customersData, vehiclesData] = await Promise.all([
        getAllCustomers(currentUser.uid),
        getAllVehicles(currentUser.uid)
      ]);
      setCustomers(customersData);
      
      // Filtrer les véhicules qui ont un ID défini
      const validVehicles = vehiclesData.filter((v): v is Vehicle => 
        typeof v.id === 'string' && v.id !== undefined
      );
      setVehicles(validVehicles);

      // Si on a une ressource sélectionnée, on cherche le véhicule correspondant
      if (selectedResource && selectedResource.id) {
        const vehicle = validVehicles.find(v => v.id === selectedResource.id);
        if (vehicle) {
          setSelectedVehicle(vehicle);
          setFormData(prev => ({
            ...prev,
            vehicleId: vehicle.id
          }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    try {
      let finalCustomerId = formData.customerId;

      // If we're on the new customer tab, create the customer first
      if (tabValue === 1) {
        const newCustomerId = await addCustomer({
          ...customerFormData,
          userId: currentUser.uid,
          rentalsHistory: [],
          drivingLicense: customerFormData.drivingLicense
        });
        if (newCustomerId) {
          finalCustomerId = newCustomerId;
        }
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Si les dates sont les mêmes ou consécutives, c'est une journée de location
      const days = startDate.getDate() === endDate.getDate() ? 1 :
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = days * (selectedVehicle?.dailyRate || 0);

      await addRental({
        ...formData,
        customerId: finalCustomerId,
        userId: currentUser.uid,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        totalCost,
        contractId: ''
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating rental:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nouvelle Location</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Client Existant" />
            <Tab label="Nouveau Client" />
          </Tabs>
        </Box>

        {selectedVehicle && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Détails du Véhicule
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Véhicule:</strong> {selectedVehicle.brand} {selectedVehicle.model}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Immatriculation:</strong> {selectedVehicle.licensePlate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Tarif journalier:</strong> {selectedVehicle.dailyRate} DA
                </Typography>
              </Grid>
              {totalCost > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Coût total estimé:</strong> {totalCost} DA
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 0 ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(customer) => `${customer.firstName} ${customer.lastName}`}
                value={selectedCustomer}
                onChange={(_event, newValue) => {
                  setSelectedCustomer(newValue);
                  setFormData(prev => ({
                    ...prev,
                    customerId: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Client" fullWidth />
                )}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Prénom"
                fullWidth
                value={customerFormData.firstName}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Nom"
                fullWidth
                value={customerFormData.lastName}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                fullWidth
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Téléphone"
                fullWidth
                value={customerFormData.phone}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adresse"
                fullWidth
                value={customerFormData.address}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Wilaya</InputLabel>
                <Select
                  value={customerFormData.wilaya}
                  label="Wilaya"
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, wilaya: e.target.value }))}
                >
                  {wilayas.map((wilaya) => (
                    <MenuItem key={wilaya} value={wilaya}>{wilaya}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Numéro d'identité"
                fullWidth
                value={customerFormData.idNumber}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, idNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Numéro de permis"
                fullWidth
                value={customerFormData.drivingLicense}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, drivingLicense: e.target.value }))}
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Date de début"
              type="date"
              fullWidth
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Date de fin"
              type="date"
              fullWidth
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.status}
                label="Statut"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'reservation' }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="reservation">Réservation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Statut de paiement</InputLabel>
              <Select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paymentStatus: e.target.value as 'pending' | 'paid' | 'partial'
                }))}
              >
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="partial">Partiel</MenuItem>
                <MenuItem value="paid">Payé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Méthode de paiement</InputLabel>
              <Select
                value={formData.paymentMethod}
                label="Méthode de paiement"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paymentMethod: e.target.value as 'cash' | 'bank_transfer' | 'other'
                }))}
              >
                <MenuItem value="cash">Espèces</MenuItem>
                <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Montant payé"
              type="number"
              fullWidth
              value={formData.paidAmount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paidAmount: parseFloat(e.target.value) || 0
              }))}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Wilaya de location</InputLabel>
              <Select
                value={formData.wilaya}
                label="Wilaya de location"
                onChange={(e) => setFormData(prev => ({ ...prev, wilaya: e.target.value }))}
              >
                {wilayas.map((wilaya) => (
                  <MenuItem key={wilaya} value={wilaya}>{wilaya}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Description des frais additionnels"
              fullWidth
              value={formData.additionalFees.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                additionalFees: { ...prev.additionalFees, description: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Montant des frais additionnels"
              type="number"
              fullWidth
              value={formData.additionalFees.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                additionalFees: { ...prev.additionalFees, amount: parseFloat(e.target.value) || 0 }
              }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const wilayas = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane'
];

export default NewRentalModal;
