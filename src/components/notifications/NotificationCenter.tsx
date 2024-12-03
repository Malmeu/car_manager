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
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NOTIFICATIONS_COLLECTION = 'notifications';

interface Notification {
  id: string;
  type: 'subscription_expiring' | 'subscription_expired' | 'new_subscription' | 'renewal_request';
  message: string;
  status: 'read' | 'unread';
  createdAt: any;
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
    const fetchNotifications = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, NOTIFICATIONS_COLLECTION),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'unread'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newNotifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type || 'subscription_expired', // Provide a default value
              message: data.message || 'No message available',
              status: data.status || 'unread',
              createdAt: data.createdAt || new Date()
            } as Notification;
          });
          setNotifications(newNotifications);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching notifications:', error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up notifications listener:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), {
      status: 'read'
    });

    // Navigate based on notification type
    switch (notification.type) {
      case 'subscription_expiring':
      case 'subscription_expired':
        navigate('/subscription-plans');
        break;
      case 'new_subscription':
      case 'renewal_request':
        if (isAdmin) {
          navigate('/admin/subscriptions');
        }
        break;
    }

    handleClose();
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
