import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Container
} from '@mui/material';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const MakeAdminPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Rechercher l'utilisateur par email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Aucun utilisateur trouvé avec cet email');
        return;
      }

      // Mettre à jour le premier utilisateur trouvé
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        isAdmin: true,
        updatedAt: new Date().toISOString()
      });

      setSuccess('Utilisateur promu administrateur avec succès');
      setEmail('');
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Promouvoir un utilisateur en administrateur
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleMakeAdmin} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email de l'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            type="email"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
          >
            Promouvoir en administrateur
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default MakeAdminPage;
