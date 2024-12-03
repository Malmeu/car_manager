import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, deleteDoc, doc as firestoreDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  subscriptionStatus?: string;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Handle the createdAt date conversion safely
        let createdAtDate = new Date();
        if (data.createdAt) {
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            createdAtDate = new Date(data.createdAt);
          }
        }
        
        return {
          id: doc.id,
          email: data.email || '',
          role: data.role || 'user',
          createdAt: createdAtDate,
          subscriptionStatus: data.subscription?.status || 'inactive'
        };
      }) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Erreur lors de la récupération des utilisateurs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteDoc(firestoreDoc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(firestoreDoc(db, 'users', userId), {
        role: newRole,
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setOpenDialog(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={fetchUsers}>
            Réessayer
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion des Utilisateurs
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Statut d'abonnement</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{user.subscriptionStatus || 'Aucun'}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEditUser(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant={selectedUser?.role === 'user' ? 'contained' : 'outlined'}
              onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'user')}
              sx={{ mr: 1 }}
            >
              Utilisateur
            </Button>
            <Button
              variant={selectedUser?.role === 'admin' ? 'contained' : 'outlined'}
              onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'admin')}
            >
              Administrateur
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagementPage;
