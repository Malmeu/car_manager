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
  IconButton,
  Typography,
  MenuItem,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getAllRentals, updateRental, addRental, deleteRental } from '../../services/rentalService';
import { getAllVehicles, getAvailableVehicles } from '../../services/vehicleService';
import { getAllCustomers } from '../../services/customerService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createContract } from '../../services/contractService';
import { Contract, Customer, Vehicle, Rental } from '../../types';
import { ContractFormData } from '../../types/contract';

interface FormData {
  id?: string;
  vehicleId: string;
  customerId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalCost: number;
  status: 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  wilaya: string;
  contractId: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
}

const RentalList: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    vehicleId: '',
    customerId: '',
    startDate: Timestamp.now(),
    endDate: Timestamp.now(),
    totalCost: 0,
    status: 'active',
    paymentStatus: 'pending',
    paidAmount: 0,
    wilaya: '',
    contractId: '',
    paymentMethod: 'cash'
  });

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVehicle && formData.startDate && formData.endDate) {
      const startDate = formData.startDate.toDate();
      const endDate = formData.endDate.toDate();
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0 && selectedVehicle.dailyRate) {
        const totalCost = days * selectedVehicle.dailyRate;
        setFormData(prev => ({
          ...prev,
          totalCost
        }));
      }
    }
  }, [selectedVehicle, formData.startDate, formData.endDate]);

  const loadData = async () => {
    try {
      const [rentalsData, vehiclesData, customersData] = await Promise.all([
        getAllRentals(),
        getAllVehicles(),
        getAllCustomers()
      ]);

      // Convert rental data to proper format
      const formattedRentals = rentalsData.map(rental => ({
        ...rental,
        startDate: rental.startDate instanceof Timestamp ? rental.startDate : Timestamp.fromDate(rental.startDate),
        endDate: rental.endDate instanceof Timestamp ? rental.endDate : Timestamp.fromDate(rental.endDate)
      }));
      setRentals(formattedRentals);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleOpen = (rental?: Rental) => {
    if (rental) {
      setEditingRental(rental);
      setFormData({
        ...rental,
        startDate: rental.startDate,
        endDate: rental.endDate,
      });
      const vehicle = vehicles.find(v => v.id === rental.vehicleId);
      setSelectedVehicle(vehicle || null);
      const customer = customers.find(c => c.id === rental.customerId);
      setSelectedCustomer(customer || null);
    } else {
      setEditingRental(null);
      setFormData({
        vehicleId: '',
        customerId: '',
        startDate: Timestamp.now(),
        endDate: Timestamp.now(),
        totalCost: 0,
        status: 'active',
        paymentStatus: 'pending',
        paidAmount: 0,
        wilaya: '',
        contractId: '',
        paymentMethod: 'cash'
      });
      setSelectedVehicle(null);
      setSelectedCustomer(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRental(null);
    setSelectedVehicle(null);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalCost' || name === 'paidAmount' ? Number(value) : value,
    }));

    if (name === 'vehicleId') {
      const vehicle = vehicles.find(v => v.id === value);
      setSelectedVehicle(vehicle || null);
    }

    if (name === 'customerId') {
      const customer = customers.find(c => c.id === value);
      setSelectedCustomer(customer || null);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value; // Format: YYYY-MM-DD
    if (dateStr) {
      // Create a date at noon to avoid timezone issues
      const date = new Date(dateStr + 'T12:00:00');
      setFormData(prev => ({
        ...prev,
        [field]: Timestamp.fromDate(date),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedCustomer) return;

    try {
      const rentalData = {
        ...formData,
      };

      let rentalId;
      if (editingRental) {
        await updateRental(editingRental.id!, rentalData);
        rentalId = editingRental.id;
      } else {
        rentalId = await addRental(rentalData);
      }

      // Create contract for new rentals
      if (!editingRental && rentalId) {
        const contractData: ContractFormData = {
          rentalId: rentalId,
          lessor: {
            name: "Auto Location",
            address: "123 Rue Principal",
            phone: "0123456789"
          },
          tenant: {
            name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
            address: selectedCustomer.address,
            phone: selectedCustomer.phone,
            drivingLicense: selectedCustomer.drivingLicense
          },
          vehicle: {
            brand: selectedVehicle.brand,
            model: selectedVehicle.model,
            year: selectedVehicle.year,
            registration: selectedVehicle.registration
          },
          rental: {
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalCost: formData.totalCost,
            deposit: formData.totalCost * 0.2,
            paymentMethod: formData.paymentMethod
          },
          terms: [
            "Le locataire s'engage à utiliser le véhicule en bon père de famille",
            "Le locataire s'engage à restituer le véhicule dans l'état où il l'a reçu",
            "Le locataire s'engage à payer les frais de location et la caution"
          ],
          wilaya: formData.wilaya
        };

        const contract = await createContract(contractData);
        await updateRental(rentalId, { contractId: contract.id });

        // Open contract in new tab
        window.open(`/contracts/${contract.id}`, '_blank');
      }

      loadData();
      handleClose();
    } catch (error) {
      console.error('Error submitting rental:', error);
    }
  };

  const getVehicleDetails = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration})` : 'Véhicule inconnu';
  };

  const getCustomerDetails = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Client inconnu';
  };

  const formatDate = (date: Timestamp) => {
    return format(date.toDate(), 'dd/MM/yyyy');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette location ?')) {
      try {
        await deleteRental(id);
        await loadData(); // Recharger les données après la suppression
      } catch (error) {
        console.error('Error deleting rental:', error);
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Locations</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nouvelle location
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Véhicule</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Coût total</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Paiement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals.map((rental) => {
              const vehicle = vehicles.find(v => v.id === rental.vehicleId);
              const customer = customers.find(c => c.id === rental.customerId);
              return (
                <TableRow key={rental.id}>
                  <TableCell>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}</TableCell>
                  <TableCell>{customer ? `${customer.firstName} ${customer.lastName}` : 'N/A'}</TableCell>
                  <TableCell>{formatDate(rental.startDate)}</TableCell>
                  <TableCell>{formatDate(rental.endDate)}</TableCell>
                  <TableCell>{rental.totalCost} DA</TableCell>
                  <TableCell>{rental.status}</TableCell>
                  <TableCell>
                    <Typography>
                      Status: {rental.paymentStatus}
                      <br />
                      Méthode: {rental.paymentMethod}
                      <br />
                      Payé: {rental.paidAmount} DA
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(rental)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(rental.id!)} 
                      color="error"
                      disabled={rental.status === 'completed'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingRental ? 'Éditer la location' : 'Nouvelle location'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Véhicule"
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  required
                >
                  {vehicles
                    .filter(v => v.status === 'available' || v.id === formData.vehicleId)
                    .map(vehicle => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {`${vehicle.brand} ${vehicle.model} (${vehicle.registration})`}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Client"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  required
                >
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {`${customer.firstName} ${customer.lastName}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de début"
                  name="startDate"
                  value={format(formData.startDate.toDate(), 'yyyy-MM-dd')}
                  onChange={handleDateChange('startDate')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de fin"
                  name="endDate"
                  value={format(formData.endDate.toDate(), 'yyyy-MM-dd')}
                  onChange={handleDateChange('endDate')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Coût total (DZD)"
                  name="totalCost"
                  value={formData.totalCost}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Statut"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Terminée</MenuItem>
                  <MenuItem value="cancelled">Annulée</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Méthode de paiement"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="cash">Espèces</MenuItem>
                  <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Statut du paiement"
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="partial">Partiel</MenuItem>
                  <MenuItem value="paid">Payé</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Montant payé"
                  name="paidAmount"
                  type="number"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Wilaya"
                  name="wilaya"
                  value={formData.wilaya}
                  onChange={handleInputChange}
                  required
                >
                  {wilayas.map((wilaya) => (
                    <MenuItem key={wilaya} value={wilaya}>
                      {wilaya}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingRental ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RentalList;
