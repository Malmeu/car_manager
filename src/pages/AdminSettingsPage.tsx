import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AppSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxUsersPerSubscription: number;
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    bankTransfer: boolean;
  };
  emailSettings: {
    notifyOnNewUser: boolean;
    notifyOnPayment: boolean;
    notifyOnError: boolean;
  };
  customization: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    companyName: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerSubscription: 5,
    paymentMethods: {
      stripe: true,
      paypal: false,
      bankTransfer: true
    },
    emailSettings: {
      notifyOnNewUser: true,
      notifyOnPayment: true,
      notifyOnError: true
    },
    customization: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      logoUrl: '',
      companyName: 'Car Manager'
    }
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadSettings();
    loadEmailTemplates();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'appSettings'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as AppSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      showSnackbar('Erreur lors du chargement des paramètres', 'error');
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const templatesSnapshot = await getDocs(collection(db, 'emailTemplates'));
      const templates = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailTemplate[];
      setEmailTemplates(templates);
    } catch (error) {
      console.error('Erreur lors du chargement des modèles d\'email:', error);
      showSnackbar('Erreur lors du chargement des modèles d\'email', 'error');
    }
  };

  const handleSettingChange = (section: keyof AppSettings, field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => {
      const updatedSettings = { ...prev };
      const sectionObj = updatedSettings[section] as Record<string, any>;
      if (sectionObj) {
        sectionObj[field] = value;
      }
      return updatedSettings;
    });
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'appSettings'), settings);
      showSnackbar('Paramètres enregistrés avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', error);
      showSnackbar('Erreur lors de l\'enregistrement des paramètres', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Paramètres de l'Application
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Enregistrer les modifications
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Paramètres Généraux */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Paramètres Généraux" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={handleSettingChange('maintenanceMode', '')}
                  />
                }
                label="Mode Maintenance"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.registrationEnabled}
                    onChange={handleSettingChange('registrationEnabled', '')}
                  />
                }
                label="Inscription Activée"
              />
              <TextField
                fullWidth
                label="Nombre maximum d'utilisateurs par abonnement"
                type="number"
                value={settings.maxUsersPerSubscription}
                onChange={handleSettingChange('maxUsersPerSubscription', '')}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Méthodes de Paiement */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Méthodes de Paiement" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.paymentMethods.stripe}
                    onChange={handleSettingChange('paymentMethods', 'stripe')}
                  />
                }
                label="Stripe"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.paymentMethods.paypal}
                    onChange={handleSettingChange('paymentMethods', 'paypal')}
                  />
                }
                label="PayPal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.paymentMethods.bankTransfer}
                    onChange={handleSettingChange('paymentMethods', 'bankTransfer')}
                  />
                }
                label="Virement Bancaire"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications par Email */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notifications par Email" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailSettings.notifyOnNewUser}
                    onChange={handleSettingChange('emailSettings', 'notifyOnNewUser')}
                  />
                }
                label="Notification lors d'une nouvelle inscription"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailSettings.notifyOnPayment}
                    onChange={handleSettingChange('emailSettings', 'notifyOnPayment')}
                  />
                }
                label="Notification lors d'un paiement"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailSettings.notifyOnError}
                    onChange={handleSettingChange('emailSettings', 'notifyOnError')}
                  />
                }
                label="Notification lors d'une erreur"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Personnalisation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Personnalisation" />
            <CardContent>
              <TextField
                fullWidth
                label="Nom de l'entreprise"
                value={settings.customization.companyName}
                onChange={handleSettingChange('customization', 'companyName')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="URL du Logo"
                value={settings.customization.logoUrl}
                onChange={handleSettingChange('customization', 'logoUrl')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Couleur Primaire"
                value={settings.customization.primaryColor}
                onChange={handleSettingChange('customization', 'primaryColor')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Couleur Secondaire"
                value={settings.customization.secondaryColor}
                onChange={handleSettingChange('customization', 'secondaryColor')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Modèles d'Email */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Modèles d'Email"
              action={
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  size="small"
                >
                  Nouveau Modèle
                </Button>
              }
            />
            <CardContent>
              <List>
                {emailTemplates.map((template) => (
                  <ListItem key={template.id}>
                    <ListItemText
                      primary={template.name}
                      secondary={template.subject}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSettingsPage;
