import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

const CreateAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Vérifications de base
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (formData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // Créer le compte admin
      await userService.createAdminUser(
        formData.email,
        formData.password,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          phone: formData.phone,
        }
      );

      setSuccess(true);
      // Rediriger vers le tableau de bord après 2 secondes
      setTimeout(() => {
        navigate('/admin/subscriptions');
      }, 2000);

    } catch (err: any) {
      console.error('Erreur lors de la création du compte admin:', err);
      setError(err.message || 'Une erreur est survenue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Créer un Compte Administrateur
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Compte administrateur créé avec succès! Redirection...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              required
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              required
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              label="Nom de l'entreprise"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              label="Téléphone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Créer le compte administrateur'
              )}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateAdminPage;
