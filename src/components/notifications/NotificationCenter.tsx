import React, { useEffect, useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit, Query, QuerySnapshot, DocumentData, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NOTIFICATIONS_COLLECTION = 'notifications';

interface Notification {
  id: string;
  type: 'subscription_expiring' | 'subscription_expired' | 'new_subscription' | 'renewal_request' | 'pending_subscription' | 'subscription_request';
  message: string;
  status: 'read' | 'unread';
  createdAt: any;
  userId?: string;
  subscriptionId?: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('NotificationCenter effect running, isAdmin:', isAdmin);
    const fetchNotifications = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        // Query pour les notifications de l'utilisateur
        const userQuery = query(
          collection(db, NOTIFICATIONS_COLLECTION),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'unread'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        // Si l'utilisateur est admin, ajouter une query pour les notifications d'administration
        let adminQuery: Query<DocumentData> | null = null;
        if (isAdmin) {
          console.log('Setting up admin notifications query');
          adminQuery = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('type', '==', 'subscription_request'),
            where('status', '==', 'unread'),
            orderBy('createdAt', 'desc')
          );
        }

        // Exécuter les requêtes
        const [userSnapshot, adminSnapshot] = await Promise.all([
          getDocs(userQuery),
          isAdmin ? getDocs(adminQuery!) : null
        ]);

        // Combiner les résultats
        const userNotifications = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        const adminNotifications = adminSnapshot
          ? adminSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Notification[]
          : [];

        setNotifications([...userNotifications, ...adminNotifications]);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setSnackbarMessage('Erreur lors du chargement des notifications');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser, isAdmin]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marquer la notification comme lue
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), {
        status: 'read'
      });

      // Rediriger en fonction du type de notification
      switch (notification.type) {
        case 'pending_subscription':
          navigate('/admin/subscriptions');
          break;
        case 'subscription_expiring':
        case 'subscription_expired':
        case 'renewal_request':
          navigate('/subscription');
          break;
        case 'subscription_request':
          navigate('/admin/subscriptions');
          break;
        default:
          break;
      }

      setAnchorEl(null);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '300px',
          },
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <Typography variant="body2">Loading...</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">Aucune notification</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <Box key={notification.id}>
              <MenuItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.status === 'unread' ? 'action.hover' : 'inherit',
                  display: 'block',
                }}
              >
                <Typography
                  variant="body2"
                  color={notification.status === 'unread' ? 'primary' : 'textPrimary'}
                  gutterBottom
                >
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {notification.createdAt?.toDate().toLocaleDateString()}
                </Typography>
              </MenuItem>
              <Divider />
            </Box>
          ))
        )}
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationCenter;
