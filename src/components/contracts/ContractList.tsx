import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Box,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { collection, getDocs, Timestamp, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

interface Contract {
  id: string;
  clientName: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  vehicleId: string;
  deposit?: number;
}

const ContractList = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();

  const convertTimestampToDate = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.seconds) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    }
    return new Date(timestamp || Date.now());
  };

  useEffect(() => {
    const fetchContracts = async () => {
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      try {
        const contractsCollection = collection(db, 'contracts');
        const q = query(contractsCollection, where('userId', '==', currentUser.uid));
        const contractsSnapshot = await getDocs(q);
        const contractsList = contractsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            clientName: data.clientName || '',
            vehicleId: data.vehicleId || '',
            deposit: data.deposit || 0,
            startDate: convertTimestampToDate(data.startDate),
            endDate: convertTimestampToDate(data.endDate),
            createdAt: convertTimestampToDate(data.createdAt),
          } as Contract;
        });

        contractsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setContracts(contractsList);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    };

    fetchContracts();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        await deleteDoc(doc(db, 'contracts', id));
        setContracts(contracts.filter(contract => contract.id !== id));
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    try {
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ mb: 4, backgroundColor: theme.palette.primary.main, color: 'white' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              Gestion des Contrats
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/contracts/new')}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.grey[100],
                },
              }}
            >
              Nouveau Contrat
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date de début</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date de fin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Caution</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow 
                  key={contract.id}
                  sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                >
                  <TableCell>{contract.clientName}</TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell align="right">
                    {contract.deposit ? contract.deposit.toLocaleString() : '0'} DA
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="info"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      title="Voir"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(contract.id)}
                      title="Supprimer"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      Aucun contrat trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default ContractList;
