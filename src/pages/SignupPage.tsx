import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !fullName || !companyName || !phoneNumber) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        fullName,
        companyName,
        phoneNumber,
        role: 'user',
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        subscription: {
          status: 'trial',
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        }
      });

      navigate('/subscription-plans');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée');
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresse email invalide');
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
        console.error(err);
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Inscription
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nom de l'entreprise"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Numéro de téléphone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              S'inscrire
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Déjà un compte ? Connectez-vous
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;
