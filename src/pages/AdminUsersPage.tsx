import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  companyName: string;
  createdAt: Date;
  isActive: boolean;
  subscriptionStatus?: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const usersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userData = doc.data();
          
          // Récupérer l'abonnement actif de l'utilisateur
          const subscriptionsQuery = query(
            collection(db, 'subscriptions'),
            where('userId', '==', doc.id),
            where('status', 'in', ['active', 'trial', 'pending'])
          );
          const subscriptionSnapshot = await getDocs(subscriptionsQuery);
          const subscriptionStatus = !subscriptionSnapshot.empty 
            ? subscriptionSnapshot.docs[0].data().status 
            : undefined;

          return {
            id: doc.id,
            email: userData.email || '',
            displayName: userData.displayName || '',
            phoneNumber: userData.phoneNumber || '',
            companyName: userData.companyName || '',
            createdAt: userData.createdAt?.toDate() || new Date(),
            isActive: userData.isActive !== false,
            subscriptionStatus,
          };
        })
      );

      setUsers(usersData);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
      });
      await loadUsers();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  if (loading) return <Typography>Chargement...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Utilisateurs
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Entreprise</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Abonnement</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.companyName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Actif' : 'Bloqué'}
                    color={user.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      user.subscriptionStatus === 'active' ? 'Actif' :
                      user.subscriptionStatus === 'trial' ? 'Essai' :
                      user.subscriptionStatus === 'pending' ? 'En attente' :
                      'Aucun'
                    }
                    color={
                      user.subscriptionStatus === 'active' ? 'success' :
                      user.subscriptionStatus === 'trial' ? 'info' :
                      user.subscriptionStatus === 'pending' ? 'warning' :
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {format(user.createdAt, 'dd/MM/yyyy', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Tooltip title="Voir les détails">
                    <IconButton
                      onClick={() => handleViewDetails(user)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.isActive ? 'Bloquer' : 'Débloquer'}>
                    <IconButton
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      color={user.isActive ? 'error' : 'success'}
                      size="small"
                    >
                      {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog des détails */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Détails de l'utilisateur</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>Nom:</strong> {selectedUser.displayName}</Typography>
              <Typography><strong>Entreprise:</strong> {selectedUser.companyName}</Typography>
              <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
              <Typography><strong>Téléphone:</strong> {selectedUser.phoneNumber}</Typography>
              <Typography>
                <strong>Date d'inscription:</strong> {' '}
                {format(selectedUser.createdAt, 'dd MMMM yyyy', { locale: fr })}
              </Typography>
              <Typography>
                <strong>Statut:</strong> {' '}
                <Chip
                  label={selectedUser.isActive ? 'Actif' : 'Bloqué'}
                  color={selectedUser.isActive ? 'success' : 'error'}
                  size="small"
                />
              </Typography>
              <Typography>
                <strong>Abonnement:</strong> {' '}
                <Chip
                  label={
                    selectedUser.subscriptionStatus === 'active' ? 'Actif' :
                    selectedUser.subscriptionStatus === 'trial' ? 'Essai' :
                    selectedUser.subscriptionStatus === 'pending' ? 'En attente' :
                    'Aucun'
                  }
                  color={
                    selectedUser.subscriptionStatus === 'active' ? 'success' :
                    selectedUser.subscriptionStatus === 'trial' ? 'info' :
                    selectedUser.subscriptionStatus === 'pending' ? 'warning' :
                    'default'
                  }
                  size="small"
                />
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsersPage;
