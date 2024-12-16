import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetUsers: 'all' | 'specific' | 'role';
  userIds?: string[];
  userRole?: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'draft';
}

const AdminNotificationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetUsers: 'all',
    userRole: '',
    expiresAt: ''
  });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Notification[];

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (notification?: Notification) => {
    if (notification) {
      setSelectedNotification(notification);
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetUsers: notification.targetUsers,
        userRole: notification.userRole || '',
        expiresAt: notification.expiresAt ? format(notification.expiresAt, 'yyyy-MM-dd') : ''
      });
    } else {
      setSelectedNotification(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetUsers: 'all',
        userRole: '',
        expiresAt: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNotification(null);
  };

  const handleSubmit = async () => {
    try {
      const notificationData = {
        ...formData,
        createdAt: new Date(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        status: 'active'
      };

      if (selectedNotification) {
        // Mettre à jour une notification existante
        await updateDoc(doc(db, 'notifications', selectedNotification.id), notificationData);
      } else {
        // Créer une nouvelle notification
        await addDoc(collection(db, 'notifications'), notificationData);
      }

      handleCloseDialog();
      loadNotifications();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la notification:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      try {
        await deleteDoc(doc(db, 'notifications', notificationId));
        loadNotifications();
      } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <NotificationsActiveIcon color="success" />;
      case 'expired':
        return <NotificationsOffIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (tabValue) {
      case 0: // Toutes
        return true;
      case 1: // Actives
        return notification.status === 'active';
      case 2: // Expirées
        return notification.status === 'expired';
      default:
        return true;
    }
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Gestion des Notifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Notification
        </Button>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Toutes" />
          <Tab label="Actives" />
          <Tab label="Expirées" />
        </Tabs>
      </Paper>

      <List>
        {filteredNotifications.map((notification) => (
          <React.Fragment key={notification.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleOpenDialog(notification)}
                  >
                    <SendIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                {getStatusIcon(notification.status)}
              </ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <React.Fragment>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={notification.type}
                        color={getTypeColor(notification.type)}
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        size="small"
                        label={`Cible: ${notification.targetUsers}`}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Créée le {format(notification.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  </React.Fragment>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedNotification ? 'Modifier la Notification' : 'Nouvelle Notification'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="info">Information</MenuItem>
                <MenuItem value="warning">Avertissement</MenuItem>
                <MenuItem value="error">Erreur</MenuItem>
                <MenuItem value="success">Succès</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Destinataires</InputLabel>
              <Select
                value={formData.targetUsers}
                label="Destinataires"
                onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
              >
                <MenuItem value="all">Tous les utilisateurs</MenuItem>
                <MenuItem value="role">Par rôle</MenuItem>
              </Select>
            </FormControl>
            {formData.targetUsers === 'role' && (
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={formData.userRole}
                  label="Rôle"
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                >
                  <MenuItem value="admin">Administrateurs</MenuItem>
                  <MenuItem value="user">Utilisateurs</MenuItem>
                  <MenuItem value="premium">Utilisateurs Premium</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              label="Date d'expiration"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedNotification ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminNotificationsPage;
