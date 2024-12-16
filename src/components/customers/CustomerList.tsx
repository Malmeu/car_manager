import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  InputAdornment,
  Avatar,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  DriveEta as LicenseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Customer, addCustomer, getAllCustomers, updateCustomer, deleteCustomer, searchCustomersByName } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface RentalHistory {
  id: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  paidAmount: number;
  vehicleBrand: string;
  vehicleModel: string;
}

interface CustomerReport {
  totalRentals: number;
  totalRevenue: number;
  rentals: RentalHistory[];
}

interface RentalStats {
  averageDuration: number;
  mostRentedVehicles: { vehicle: string; count: number }[];
  monthlyRentals: { month: string; count: number }[];
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { currentUser, isAdmin } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    userId: currentUser?.uid || '',
    type: 'particular',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    drivingLicense: '',
    companyName: '',
    rentalsHistory: []
  });
  const [rentals, setRentals] = useState<RentalHistory[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      loadCustomers();
    }
  }, [currentUser]);

  const loadCustomers = async () => {
    try {
      if (!currentUser?.uid) return;
      const data = await getAllCustomers(currentUser.uid, isAdmin);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSearch = async () => {
    try {
      if (!currentUser?.uid) return;
      if (searchTerm.trim() === '') {
        loadCustomers();
      } else {
        const results = await searchCustomersByName(searchTerm, currentUser.uid, isAdmin);
        setCustomers(results);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        userId: customer.userId,
        type: customer.type || 'particular',
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        drivingLicense: customer.drivingLicense,
        companyName: customer.companyName || '',
        rentalsHistory: customer.rentalsHistory
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        userId: currentUser?.uid || '',
        type: 'particular',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        drivingLicense: '',
        companyName: '',
        rentalsHistory: []
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer?.id) {
        await updateCustomer(editingCustomer.id, formData);
      } else {
        await addCustomer(formData);
      }
      handleClose();
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const calculateRentalStats = (rentals: any[]): RentalStats => {
    // Calcul de la durée moyenne
    const totalDuration = rentals.reduce((acc, rental) => {
      try {
        const start = rental.startDate.toDate ? rental.startDate.toDate() : new Date(rental.startDate);
        const end = rental.endDate.toDate ? rental.endDate.toDate() : new Date(rental.endDate);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      } catch (error) {
        console.error('Error calculating duration:', error);
        return acc;
      }
    }, 0);
    const averageDuration = rentals.length > 0 ? totalDuration / rentals.length : 0;

    // Véhicules les plus loués
    const vehicleCounts = rentals.reduce((acc: Record<string, number>, rental) => {
      const vehicleKey = `${rental.vehicleBrand} ${rental.vehicleModel}`;
      acc[vehicleKey] = (acc[vehicleKey] || 0) + 1;
      return acc;
    }, {});
    const mostRentedVehicles = Object.entries(vehicleCounts)
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Évolution mensuelle des locations
    const monthlyRentals = rentals.reduce((acc: Record<string, number>, rental) => {
      try {
        const date = rental.startDate.toDate ? rental.startDate.toDate() : new Date(rental.startDate);
        const month = format(date, 'MMM yyyy', { locale: fr });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      } catch (error) {
        console.error('Error processing monthly rentals:', error);
        return acc;
      }
    }, {});
    const monthlyData = Object.entries(monthlyRentals)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      averageDuration,
      mostRentedVehicles,
      monthlyRentals: monthlyData
    };
  };

  const exportToPDF = (customer: any, rentals: any[], stats: RentalStats) => {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text(`Rapport Client: ${customer.firstName} ${customer.lastName}`, 20, 20);

    // Résumé
    doc.setFontSize(14);
    doc.text('Résumé', 20, 40);
    doc.setFontSize(12);
    doc.text(`Nombre total de locations: ${rentals.length}`, 30, 50);
    doc.text(`Durée moyenne de location: ${stats.averageDuration.toFixed(1)} jours`, 30, 60);

    // Véhicules les plus loués
    doc.setFontSize(14);
    doc.text('Véhicules les plus loués', 20, 80);
    doc.setFontSize(12);
    stats.mostRentedVehicles.forEach((vehicle, index) => {
      doc.text(`${vehicle.vehicle}: ${vehicle.count} locations`, 30, 90 + index * 10);
    });

    // Tableau des locations
    const tableData = rentals.map(rental => [
      format(new Date(rental.startDate), 'dd/MM/yyyy'),
      format(new Date(rental.endDate), 'dd/MM/yyyy'),
      `${rental.vehicleBrand} ${rental.vehicleModel}`,
      `${rental.totalCost} DA`,
      `${rental.paidAmount} DA`,
      `${rental.totalCost - rental.paidAmount} DA`
    ]);

    doc.autoTable({
      startY: 130,
      head: [['Début', 'Fin', 'Véhicule', 'Total', 'Payé', 'Reste']],
      body: tableData,
    });

    doc.save(`rapport_${customer.firstName}_${customer.lastName}.pdf`);
  };

  const fetchCustomerReport = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);

      // Fetch all rentals for this customer
      const rentalsQuery = query(
        collection(db, 'rentals'),
        where('customerId', '==', customer.id)
      );
      const rentalsSnapshot = await getDocs(rentalsQuery);

      const rentalsHistory: RentalHistory[] = [];
      let totalRevenue = 0;

      for (const rentalDoc of rentalsSnapshot.docs) {
        const rental = rentalDoc.data();
        const vehicleDoc = await getDocs(query(collection(db, 'vehicles'), where('id', '==', rental.vehicleId)));
        const vehicle = vehicleDoc.docs[0]?.data();

        const rentalHistory = {
          id: rentalDoc.id,
          startDate: rental.startDate.toDate(),
          endDate: rental.endDate.toDate(),
          totalCost: rental.totalCost || 0,
          paidAmount: rental.paidAmount || 0,
          vehicleBrand: vehicle?.brand || 'Inconnu',
          vehicleModel: vehicle?.model || 'Inconnu',
          vehicle: {
            brand: vehicle?.brand || 'Inconnu',
            model: vehicle?.model || 'Inconnu'
          }
        };

        rentalsHistory.push(rentalHistory);
        totalRevenue += rental.totalCost || 0;
      }

      // Mettre à jour les locations
      setRentals(rentalsHistory);

      // Calculer et mettre à jour les statistiques
      const calculatedStats = calculateRentalStats(rentalsHistory);
      setStats(calculatedStats);

      // Mettre à jour le rapport client
      setCustomerReport({
        totalRentals: rentalsHistory.length,
        totalRevenue,
        rentals: rentalsHistory
      });

      setOpenReport(true);
    } catch (error) {
      console.error('Error fetching customer report:', error);
    }
  };

  const handleCloseReport = () => {
    setOpenReport(false);
    setSelectedCustomer(null);
    setCustomerReport(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.drivingLicense.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Rechercher un client..."
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
            onClick={() => {
              setEditingCustomer(null);
              setOpen(true);
            }}
          >
            Ajouter
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Entreprises
        </Typography>
        <Grid container spacing={3}>
          {filteredCustomers
            .filter(customer => customer.type === 'business')
            .map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <Card sx={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'visible',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'linear-gradient(45deg, #1a237e, #0d47a1, #1a237e)',
                  zIndex: -1,
                  borderRadius: '8px'
                }
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    position: 'relative'
                  }}>
                    <Avatar sx={{ 
                      bgcolor: '#fff',
                      color: '#1a237e',
                      mr: 2,
                      width: 56,
                      height: 56,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                      <BusinessIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" component="div" sx={{ 
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {customer.companyName}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Entreprise
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.5,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                    p: 2,
                    mt: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body2">{customer.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body2">{customer.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body2">{customer.address}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LicenseIcon sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body2">{customer.drivingLicense}</Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ 
                  justifyContent: 'flex-end',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  p: 1.5
                }}>
                  <Tooltip title="Modifier">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(customer)}
                      sx={{ color: 'white' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(customer.id!)}
                      sx={{ color: 'white' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rapport">
                    <IconButton 
                      size="small"
                      onClick={() => customer.id && fetchCustomerReport(customer)}
                      sx={{ color: 'white' }}
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Particuliers
        </Typography>
        <Grid container spacing={3}>
          {filteredCustomers
            .filter(customer => customer.type === 'particular')
            .map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {customer.firstName} {customer.lastName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{customer.address}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LicenseIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{customer.drivingLicense}</Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(customer)}
                    title="Modifier"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(customer.id!)}
                    title="Supprimer"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => customer.id && fetchCustomerReport(customer)}
                    title="Rapport"
                  >
                    <AssessmentIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Modifier le client' : 'Ajouter un client'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl component="fieldset" fullWidth margin="normal" required>
              <FormLabel component="legend">Type de client</FormLabel>
              <RadioGroup
                row
                name="type"
                value={formData.type}
                onChange={(e) => handleInputChange(e as React.ChangeEvent<HTMLInputElement>)}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
          >
            {editingCustomer ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReport}
        onClose={handleCloseReport}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Rapport Client : {selectedCustomer?.firstName} {selectedCustomer?.lastName}
        </DialogTitle>
        <DialogContent>
          {customerReport && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Résumé
                </Typography>
                <Typography>
                  Nombre total de locations : {customerReport.totalRentals}
                </Typography>
                <Typography>
                  Revenu total généré : {customerReport.totalRevenue} DA
                </Typography>
              </Box>

              {stats && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Statistiques détaillées
                  </Typography>
                  <Typography>
                    Durée moyenne de location : {stats.averageDuration.toFixed(1)} jours
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                    Top 3 des véhicules les plus loués
                  </Typography>
                  {stats.mostRentedVehicles.map((vehicle, index) => (
                    <Typography key={index}>
                      {index + 1}. {vehicle.vehicle} : {vehicle.count} location(s)
                    </Typography>
                  ))}

                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Évolution des locations
                  </Typography>
                  <Box sx={{ width: '100%', height: 300, mt: 2, mb: 2 }}>
                    <BarChart
                      width={600}
                      height={300}
                      data={stats.monthlyRentals}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Nombre de locations" />
                    </BarChart>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => exportToPDF(selectedCustomer, rentals, stats)}
                    sx={{ mb: 2 }}
                  >
                    Exporter en PDF
                  </Button>
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Historique des Locations
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date de début</TableCell>
                      <TableCell>Date de fin</TableCell>
                      <TableCell>Véhicule</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Payé</TableCell>
                      <TableCell>Reste</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerReport.rentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          {format(new Date(rental.startDate), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(rental.endDate), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {rental.vehicleBrand} {rental.vehicleModel}
                        </TableCell>
                        <TableCell>{rental.totalCost} DA</TableCell>
                        <TableCell>{rental.paidAmount} DA</TableCell>
                        <TableCell>{rental.totalCost - rental.paidAmount} DA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
