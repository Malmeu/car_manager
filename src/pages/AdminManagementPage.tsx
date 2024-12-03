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
import { createAdminUser } from '../scripts/createAdmin';

const AdminManagementPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createAdminUser(email, password);
      setSuccess('Administrateur créé avec succès');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la création de l\'administrateur');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Créer un nouvel administrateur
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleCreateAdmin} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            type="email"
          />
          
          <TextField
            fullWidth
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            type="password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
          >
            Créer l'administrateur
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminManagementPage;
