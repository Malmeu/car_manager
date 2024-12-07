import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Avatar,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { PhotoCamera, Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfileCustomization = () => {
  const { currentUser } = useAuth();
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('companyLogo'));
  const [companyName, setCompanyName] = useState<string>(localStorage.getItem('companyName') || '');
  const [primaryColor, setPrimaryColor] = useState<string>(localStorage.getItem('primaryColor') || '#1a237e');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        localStorage.setItem('companyLogo', base64String);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem('companyName', companyName);
      localStorage.setItem('primaryColor', primaryColor);
      
      window.dispatchEvent(new CustomEvent('themeChange', {
        detail: { primaryColor }
      }));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Erreur lors de la sauvegarde des paramètres');
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    setError('');
    setPasswordSuccess(false);
    setLoading(true);

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Réauthentification de l'utilisateur
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Mise à jour du mot de passe
      await updatePassword(user, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Mot de passe actuel incorrect');
      } else {
        setError('Erreur lors du changement de mot de passe');
      }
    }
    setLoading(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, [primaryColor]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Personnalisation du profil
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Apparence" />
            <Tab label="Sécurité" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Logo de l'entreprise
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={logo || undefined}
                    sx={{ width: 100, height: 100 }}
                  />
                  <label htmlFor="logo-upload">
                    <input
                      accept="image/*"
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                    />
                    <IconButton
                      color="primary"
                      component="span"
                      aria-label="upload logo"
                    >
                      <PhotoCamera />
                    </IconButton>
                  </label>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Nom de l'entreprise
                </Typography>
                <TextField
                  fullWidth
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Entrez le nom de votre entreprise"
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Couleur principale
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '50px', height: '50px', padding: 0, border: 'none' }}
                  />
                  <TextField
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Enregistrer
                </Button>
                {success && (
                  <Alert severity="success" sx={{ ml: 2 }}>
                    Paramètres enregistrés avec succès
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ ml: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Changer le mot de passe
              </Typography>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mot de passe actuel"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
                >
                  Changer le mot de passe
                </Button>
                {passwordSuccess && (
                  <Alert severity="success" sx={{ ml: 2 }}>
                    Mot de passe changé avec succès
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ ml: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProfileCustomization;
