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
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRentals, updateRental, addRental, deleteRental } from '../../services/rentalService';
import { getAllVehicles, getAvailableVehicles, updateVehicle } from '../../services/vehicleService';
import { getAllCustomers } from '../../services/customerService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createContract, getContract } from '../../services/contractService';
import { Contract, Customer, Vehicle, Rental } from '../../types';
import { ContractFormData } from '../../types/contract';
import { useLocation } from 'react-router-dom';

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
  userId: string;
  withDriver: boolean;
  driverCost: number;
}

interface RentalListProps {}

const RentalList: React.FC<RentalListProps> = () => {
  const { currentUser } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const location = useLocation();
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
    paymentMethod: 'cash',
    userId: '',
    withDriver: false,
    driverCost: 0
  });

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

  const [rentalStatus, setRentalStatus] = useState<'active' | 'completed'>('active');

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
    if (!currentUser?.uid) return;
    loadData();
    // Check if we should open the new rental dialog
    if (location.state?.openNewRental) {
      handleOpen();
      // Clear the state to prevent reopening on subsequent navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.openNewRental]);

  useEffect(() => {
    if (selectedVehicle && formData.startDate && formData.endDate) {
      const startDate = formData.startDate.toDate();
      const endDate = formData.endDate.toDate();
      
      // Reset hours to start of day for accurate day calculation
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Calculate days without including the start day
      const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days >= 0 && selectedVehicle.dailyRate) {
        const totalCost = days * selectedVehicle.dailyRate;
        setFormData(prev => ({
          ...prev,
          totalCost
        }));
      }
    }
  }, [selectedVehicle, formData.startDate, formData.endDate]);

  useEffect(() => {
    // Filtrer les locations en fonction du statut sélectionné
    const filtered = rentals.filter(rental => 
      rentalStatus === 'active' ? rental.status === 'active' : rental.status === 'completed'
    );
    setFilteredRentals(filtered);
  }, [rentals, rentalStatus]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      // Toujours charger toutes les locations et tous les clients
      const [rentalsData, vehiclesData, customersData] = await Promise.all([
        getAllRentals(currentUser.uid),
        getAllVehicles(currentUser.uid),
        getAllCustomers(currentUser.uid)
      ]);

      console.log('Toutes les locations:', rentalsData);
      console.log('Tous les véhicules:', vehiclesData);

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

  const handleOpen = async (rental?: Rental) => {
    if (!currentUser?.uid) return;
    
    try {
      if (rental) {
        setEditingRental(rental);
        setFormData({
          ...rental,
          startDate: rental.startDate,
          endDate: rental.endDate,
          userId: currentUser.uid,
          withDriver: rental.withDriver || false,
          driverCost: rental.driverCost || 0
        });
        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
        setSelectedVehicle(vehicle || null);
        const customer = customers.find(c => c.id === rental.customerId);
        setSelectedCustomer(customer || null);
      } else {
        setEditingRental(null);
        // Recharger uniquement les véhicules disponibles
        const availableVehicles = await getAvailableVehicles(currentUser.uid);
        console.log('Véhicules disponibles pour nouvelle location:', availableVehicles);
        setVehicles(availableVehicles); // Ne montrer que les véhicules disponibles dans le menu
        
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
          paymentMethod: 'cash',
          userId: currentUser.uid,
          withDriver: false,
          driverCost: 0
        });
        setSelectedVehicle(null);
        setSelectedCustomer(null);
      }
      setOpen(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du formulaire:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRental(null);
    setSelectedVehicle(null);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalCost' || name === 'paidAmount' || name === 'driverCost' ? Number(value) : value,
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
    e.preventDefault(); // Ajouter cette ligne pour empêcher le rechargement de la page
    if (!currentUser?.uid) return;
    
    try {
      // Vérifier que toutes les données requises sont présentes
      if (!formData.vehicleId || !formData.customerId || !formData.wilaya) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Vérifier que la date de fin est après la date de début
      if (formData.endDate.toDate() <= formData.startDate.toDate()) {
        alert('La date de fin doit être après la date de début');
        return;
      }

      const rentalData = {
        ...formData,
        userId: currentUser.uid,
        status: 'active' as const,
        paymentStatus: (formData.paidAmount >= formData.totalCost 
          ? 'paid' 
          : formData.paidAmount > 0 
            ? 'partial' 
            : 'pending') as 'paid' | 'partial' | 'pending'
      };

      console.log('Données de location à soumettre:', rentalData);

      let rentalId: string | null = null;
      if (editingRental) {
        // Mise à jour d'une location existante
        await updateRental(editingRental.id!, rentalData);
        rentalId = editingRental.id!;
        console.log('Location mise à jour avec succès');
      } else {
        // Création d'une nouvelle location
        rentalId = await addRental(rentalData);
        console.log('Nouvelle location créée avec ID:', rentalId);
        
        if (!rentalId) {
          throw new Error('Échec de la création de la location');
        }
      }

      // Créer le contrat pour les nouvelles locations
      if (!editingRental && rentalId && selectedCustomer && selectedVehicle) {
        console.log('Création du contrat pour la location:', rentalId);
        
        const contractData: ContractFormData = {
          rentalId,
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

        try {
          console.log('Création du contrat avec les données:', contractData);
          const contract = await createContract(contractData);
          console.log('Contrat créé avec succès:', contract);
          
          await updateRental(rentalId, { contractId: contract.id });
          console.log('ID du contrat ajouté à la location');

          setSelectedContract(contract);
          setContractDialogOpen(true);
        } catch (error) {
          console.error('Erreur lors de la création du contrat:', error);
        }
      }

      // Mettre à jour le statut du véhicule
      if (selectedVehicle && selectedVehicle.id) {
        try {
          await updateVehicle(selectedVehicle.id, {
            status: 'rented',
            isAvailable: false
          });
          console.log('Statut du véhicule mis à jour');
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut du véhicule:', error);
        }
      }

      // Recharger les données
      await loadData();
      handleClose();
      
    } catch (error) {
      console.error('Erreur lors de la soumission de la location:', error);
      alert('Une erreur est survenue lors de la création de la location. Veuillez réessayer.');
    }
  };

  const handleContractClose = () => {
    setContractDialogOpen(false);
    setSelectedContract(null);
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

  const handleStatusChange = async (rental: Rental, newStatus: 'active' | 'completed') => {
    try {
      if (newStatus === 'completed') {
        // 1. Mettre à jour le véhicule avec une nouvelle tentative si nécessaire
        console.log(`Mise à jour du statut du véhicule ${rental.vehicleId} à "available"...`);
        
        // Première tentative de mise à jour
        await updateVehicle(rental.vehicleId, { 
          status: 'available',
          editingRental: false,
          isAvailable: true
        });
        
        // Vérifier la mise à jour
        if (!currentUser) {
          throw new Error('Utilisateur non connecté');
        }
        let updatedVehicles = await getAllVehicles(currentUser.uid);
        let updatedVehicle = updatedVehicles.find(v => v.id === rental.vehicleId);
        console.log('État du véhicule après première mise à jour:', updatedVehicle);
        
        // Si le véhicule n'est toujours pas disponible, faire une deuxième tentative
        if (!updatedVehicle || updatedVehicle.status !== 'available') {
          console.log('Première tentative échouée, nouvelle tentative...');
          await updateVehicle(rental.vehicleId, { 
            status: 'available',
            editingRental: false,
            isAvailable: true
          });
          
          // Vérifier à nouveau
          if (!currentUser) {
            throw new Error('Utilisateur non connecté');
          }
          updatedVehicles = await getAllVehicles(currentUser.uid);
          updatedVehicle = updatedVehicles.find(v => v.id === rental.vehicleId);
          console.log('État du véhicule après seconde mise à jour:', updatedVehicle);
        }
        
        if (!updatedVehicle || updatedVehicle.status !== 'available') {
          throw new Error('Impossible de mettre à jour le statut du véhicule à "available"');
        }
        
        console.log('Statut du véhicule mis à jour avec succès à "available"');
      }
      
      // 2. Mettre à jour la location
      console.log(`Mise à jour du statut de la location ${rental.id} à "${newStatus}"...`);
      await updateRental(rental.id!, { 
        status: newStatus,
        endDate: newStatus === 'completed' ? Timestamp.now() : rental.endDate
      });
      
      // 3. Recharger toutes les données
      await loadData();
      
      // 4. Forcer un rechargement des véhicules disponibles
      if (!currentUser) {
        console.warn('No current user found');
        return;
      }
      const availableVehicles = await getAvailableVehicles(currentUser.uid);
      console.log('Liste mise à jour des véhicules disponibles:', availableVehicles);
      setVehicles(availableVehicles);
      
      console.log('Mise à jour terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      // En cas d'erreur, recharger les données pour s'assurer que l'interface est à jour
      await loadData();
      throw error;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Locations</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={rentalStatus}
            exclusive
            onChange={(event: React.MouseEvent<HTMLElement>, newStatus: 'active' | 'completed' | null) => {
              if (newStatus !== null) {
                setRentalStatus(newStatus);
              }
            }}
            aria-label="rental status"
            size="small"
          >
            <ToggleButton value="active" aria-label="active rentals">
              Actives
            </ToggleButton>
            <ToggleButton value="completed" aria-label="completed rentals">
              Terminées
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nouvelle location
          </Button>
        </Box>
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
              <TableCell>Chauffeur</TableCell>
              <TableCell>Coût du chauffeur</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Paiement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRentals.map((rental) => {
              const vehicle = vehicles.find(v => v.id === rental.vehicleId);
              const customer = customers.find(c => c.id === rental.customerId);
              return (
                <TableRow key={rental.id}>
                  <TableCell>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}</TableCell>
                  <TableCell>{customer ? `${customer.firstName} ${customer.lastName}` : 'N/A'}</TableCell>
                  <TableCell>{formatDate(rental.startDate)}</TableCell>
                  <TableCell>{formatDate(rental.endDate)}</TableCell>
                  <TableCell>{rental.totalCost} DA</TableCell>
                  <TableCell>
                    <Chip 
                      label={rental.withDriver ? "Avec chauffeur" : "Sans chauffeur"}
                      color={rental.withDriver ? "primary" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rental.withDriver ? `${rental.driverCost} DA/jour` : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={rental.status === 'active' ? 'Active' : 'Terminée'}
                      color={rental.status === 'active' ? 'primary' : 'default'}
                      onClick={() => rental.status === 'active' && handleStatusChange(rental, 'completed')}
                      sx={{ cursor: rental.status === 'active' ? 'pointer' : 'default' }}
                    />
                  </TableCell>
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

      {/* Boîte de dialogue pour afficher le contrat */}
      <Dialog
        open={contractDialogOpen}
        onClose={handleContractClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Contrat de Location</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Informations du Contrat
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Locataire</Typography>
                  <Typography>Nom: {selectedContract.tenant.name}</Typography>
                  <Typography>Téléphone: {selectedContract.tenant.phone}</Typography>
                  <Typography>Adresse: {selectedContract.tenant.address}</Typography>
                  <Typography>Permis: {selectedContract.tenant.drivingLicense}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Véhicule</Typography>
                  <Typography>
                    {selectedContract.vehicle.brand} {selectedContract.vehicle.model} ({selectedContract.vehicle.year})
                  </Typography>
                  <Typography>Immatriculation: {selectedContract.vehicle.registration}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Location</Typography>
                  <Typography>
                    Du: {format(selectedContract.rental.startDate.toDate(), 'dd/MM/yyyy')}
                  </Typography>
                  <Typography>
                    Au: {format(selectedContract.rental.endDate.toDate(), 'dd/MM/yyyy')}
                  </Typography>
                  <Typography>
                    Coût total: {selectedContract.rental.totalCost.toLocaleString('fr-DZ')} DZD
                  </Typography>
                  <Typography>
                    Caution: {selectedContract.rental.deposit.toLocaleString('fr-DZ')} DZD
                  </Typography>
                  <Typography>
                    Mode de paiement: {selectedContract.rental.paymentMethod === 'cash' ? 'Espèces' : 
                                     selectedContract.rental.paymentMethod === 'bank_transfer' ? 'Virement bancaire' : 'Autre'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1">Conditions</Typography>
                  {selectedContract.terms.map((term, index) => (
                    <Typography key={index}>• {term}</Typography>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleContractClose}>Fermer</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Ici vous pouvez ajouter la logique pour imprimer le contrat
              window.print();
            }}
          >
            Imprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingRental ? 'Éditer la location' : 'Nouvelle location'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Véhicule"
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  required
                >
                  {vehicles
                    .filter(vehicle => {
                      const isAvailable = !editingRental 
                        ? vehicle.status === 'available'
                        : vehicle.status === 'available' || vehicle.id === editingRental.vehicleId;
                      
                      console.log(`Véhicule ${vehicle.id} (${vehicle.brand} ${vehicle.model}):`, {
                        status: vehicle.status,
                        editingRental: !!editingRental,
                        isAvailable
                      });
                      
                      return isAvailable;
                    })
                    .map((vehicle) => {
                      console.log('Affichage du véhicule dans le menu:', vehicle);
                      return (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {`${vehicle.brand} ${vehicle.model} (${vehicle.registration})`}
                        </MenuItem>
                      );
                    })
                  }
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Avec chauffeur"
                  name="withDriver"
                  value={formData.withDriver ? "true" : "false"}
                  onChange={(e) => handleInputChange({
                    target: {
                      name: 'withDriver',
                      value: e.target.value === "true"
                    }
                  } as any)}
                  required
                >
                  <MenuItem value="true">Oui</MenuItem>
                  <MenuItem value="false">Non</MenuItem>
                </TextField>
              </Grid>
              {formData.withDriver && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Coût du chauffeur (DZD/jour)"
                    name="driverCost"
                    type="number"
                    value={formData.driverCost}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
              )}
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
