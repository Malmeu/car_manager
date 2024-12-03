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
} from '@mui/icons-material';
import { Customer, addCustomer, getAllCustomers, updateCustomer, deleteCustomer, searchCustomersByName } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    userId: currentUser?.uid || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    drivingLicense: '',
    rentalsHistory: []
  });

  useEffect(() => {
    if (currentUser?.uid) {
      loadCustomers();
    }
  }, [currentUser]);

  const loadCustomers = async () => {
    try {
      if (!currentUser?.uid) return;
      const data = await getAllCustomers(currentUser.uid);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        userId: customer.userId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        drivingLicense: customer.drivingLicense,
        rentalsHistory: customer.rentalsHistory
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        userId: currentUser?.uid || '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        drivingLicense: '',
        rentalsHistory: []
      });
    }
    setOpen(true);
  };

  const handleSearch = async () => {
    if (!currentUser?.uid) return;
    
    if (searchTerm.trim()) {
      try {
        const results = await searchCustomersByName(searchTerm);
        setCustomers(results);
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    } else {
      loadCustomers();
    }
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

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.drivingLicense.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Client</Typography>
        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Chercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
            onClick={() => handleOpenDialog()}
          >
            Ajouter un client
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredCustomers.map((customer) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                    }}
                  >
                    {customer.firstName[0]}{customer.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                      {customer.firstName} {customer.lastName}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={1}>
                  <Tooltip title="Email" placement="left">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <EmailIcon fontSize="small" />
                      {customer.email || 'Non renseigné'}
                    </Typography>
                  </Tooltip>

                  <Tooltip title="Téléphone" placement="left">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <PhoneIcon fontSize="small" />
                      {customer.phone}
                    </Typography>
                  </Tooltip>

                  <Tooltip title="Permis de conduire" placement="left">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <LicenseIcon fontSize="small" />
                      {customer.drivingLicense}
                    </Typography>
                  </Tooltip>

                  <Tooltip title="Adresse" placement="left">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <LocationIcon fontSize="small" />
                      {customer.address}
                    </Typography>
                  </Tooltip>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(customer)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(customer.id!)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="firstName"
              label="Prénom"
              type="text"
              fullWidth
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="lastName"
              label="Nom"
              type="text"
              fullWidth
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="phone"
              label="Numéro de Tel"
              type="tel"
              fullWidth
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="drivingLicense"
              label="Numéro de permis"
              type="text"
              fullWidth
              value={formData.drivingLicense}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="address"
              label="Addresse"
              type="text"
              fullWidth
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingCustomer ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
