import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllCustomers, deleteCustomer } from '../../services/customerService';
import type { Customer } from '../../services/customerService';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Customer[]>([]);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const clientsData = await getAllCustomers();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const success = await deleteCustomer(id);
        if (success) {
          console.log('Client deleted successfully');
          fetchClients(); // Refresh the list
        } else {
          console.error('Failed to delete client');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Liste des Clients</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/clients/new')}
        >
          Ajouter un Client
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Adresse</TableCell>
              <TableCell>Permis de Conduire</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{`${client.firstName} ${client.lastName}`}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.address}</TableCell>
                <TableCell>{client.drivingLicense}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => client.id && navigate(`/clients/edit/${client.id}`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => client.id && handleDelete(client.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClientList;
