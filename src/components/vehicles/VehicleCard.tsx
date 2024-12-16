import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Switch,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CloseIcon from '@mui/icons-material/Close';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { db } from '../../config/firebase';

import { Vehicle } from '../../models/Vehicle';
import { VehicleTracking } from '../../types/vehicleTracking';
import { getVehicleTracking } from '../../services/vehicleTrackingService';
import { Notification, checkNotifications } from '../../services/notificationService';
import VehicleDetails from './VehicleDetails';
import VehicleFinancialSummary from './VehicleFinancialSummary';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => Promise<void>;
}

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
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
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

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [value, setValue] = useState(0);
  const [totalMileage, setTotalMileage] = useState<number>(vehicle.baseMileage);

  useEffect(() => {
    console.log('VehicleCard - Vehicle data:', vehicle);
    const fetchData = async () => {
      try {
        if (!vehicle.id) {
          console.error('VehicleCard - Vehicle ID is missing:', vehicle);
          return;
        }
        console.log('VehicleCard - Fetching data for vehicle ID:', vehicle.id);
        const vehicleTracking = await getVehicleTracking(vehicle.id);
        if (vehicleTracking && vehicleTracking.mileages) {
          const total = vehicleTracking.mileages.reduce((acc, curr) => acc + curr.value, vehicle.baseMileage);
          setTotalMileage(total);
        }
        if (vehicleTracking) {
          const newNotifications = checkNotifications(vehicleTracking);
          setNotifications(newNotifications);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicle]);

  const getNotificationColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getHighestSeverity = (): Notification['severity'] => {
    if (notifications.some(n => n.severity === 'error')) return 'error';
    if (notifications.some(n => n.severity === 'warning')) return 'warning';
    if (notifications.some(n => n.severity === 'info')) return 'info';
    return 'info';
  };

  const handleCardClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setValue(0); // Reset l'onglet actif lors de la fermeture
  };

  const handleStatusToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Empêche l'ouverture de la modal
    if (!vehicle.id) return;
    
    try {
      const newStatus = e.target.checked ? 'available' : 'maintenance';
      const vehicleRef = doc(db, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, { 
        status: newStatus 
      });
      console.log('Statut mis à jour avec succès:', newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const formatRegistration = (registration: string) => {
    // Supprimer tous les espaces et caractères non numériques
    const numbers = registration.replace(/[^\d]/g, '');
    
    // Diviser en groupes : reste + 3 chiffres + 2 chiffres
    const length = numbers.length;
    const lastTwo = numbers.slice(-2);
    const previousThree = numbers.slice(-5, -2);
    const rest = numbers.slice(0, length - 5);

    // Construire le format final
    return `${rest} ${previousThree} ${lastTwo}`.trim();
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
        background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
      }}
      onClick={handleCardClick}
    >
      <Box
        sx={{
          position: 'relative',
          p: 2,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            color: 'white'
          }}>
            {vehicle.brand} {vehicle.model}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {notifications.length > 0 && (
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                }}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Badge badgeContent={notifications.length} color={getHighestSeverity()}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
            <IconButton
              size="small"
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vehicle);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
              onClick={(e) => {
                e.stopPropagation();
                vehicle.id && onDelete(vehicle.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            size="small"
            label={
              vehicle.status === 'available' 
                ? 'Disponible' 
                : vehicle.status === 'rented'
                ? 'En location'
                : 'En maintenance'
            }
            sx={{ 
              backgroundColor: 
                vehicle.status === 'available' 
                  ? 'success.main' 
                  : vehicle.status === 'rented'
                  ? 'info.main'
                  : 'error.main',
              color: 'white',
              fontWeight: 500,
              '& .MuiChip-label': { px: 2 }
            }}
          />
          <Chip
            size="small"
            icon={<DateRangeIcon sx={{ color: 'white !important' }} />}
            label={`${vehicle.year}`}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </Box>

        <Collapse in={showNotifications}>
          <Box sx={{ mt: 2 }}>
            {notifications.map((notification, index) => (
              <Chip
                key={index}
                label={notification.message}
                color={getNotificationColor(notification.severity)}
                size="small"
                sx={{ mb: 1, mr: 1 }}
              />
            ))}
          </Box>
        </Collapse>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5
            }}>
              <Typography variant="caption" color="text.secondary">
                Carburant
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalGasStationIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {vehicle.fuelType}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 0.5 
            }}>
              <Typography variant="caption" color="text.secondary">
                Kilométrage initial
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  {(vehicle.baseMileage || 0).toLocaleString()} km
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 0.5 
            }}>
              <Typography variant="caption" color="text.secondary">
                Kilométrage total
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  {loading ? '...' : totalMileage.toLocaleString()} km
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Immatriculation
          </Typography>
          <Box sx={{
            mt: 0.5,
            p: 1.5,
            backgroundColor: '#FFB800',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #000',
            fontFamily: 'monospace',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            minWidth: '200px'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: '#000',
                letterSpacing: '2px',
                fontFamily: 'inherit',
                fontSize: '1.5rem',
                textShadow: '0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              {formatRegistration(vehicle.registration)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{
          mt: 2,
          p: 1.5,
          backgroundColor: (theme) => theme.palette.primary.main,
          borderRadius: 1,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            {vehicle.dailyRate.toLocaleString()} DZD
          </Typography>
          <Typography variant="caption" sx={{ color: 'white' }}>
            par jour
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', mt: 'auto', p: 2 }}>
        <Tooltip title={vehicle.status === 'available' ? 'Marquer comme indisponible' : 'Marquer comme disponible'}>
          <Switch
            checked={vehicle.status === 'available'}
            onChange={handleStatusToggle}
            color="success"
            onClick={(e) => e.stopPropagation()}
          />
        </Tooltip>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Voir le suivi du véhicule">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                if (vehicle.id) {
                  navigate(`/vehicles/${vehicle.id}/tracking`);
                } else {
                  console.error('Vehicle ID is undefined');
                }
              }}
              sx={{ 
                color: (theme) => theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.primary.light,
                  color: 'white',
                },
              }}
            >
              <TimelineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vehicle);
              }}
              sx={{ 
                color: (theme) => theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.primary.light,
                  color: 'white',
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (vehicle.id) {
                  onDelete(vehicle.id);
                }
              }}
              sx={{ 
                color: (theme) => theme.palette.error.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.error.light,
                  color: 'white',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        onClick={(e) => e.stopPropagation()} // Empêche la propagation du clic
      >
        <DialogTitle>
          Détails du Véhicule
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="vehicle details tabs">
              <Tab label="Informations" id="vehicle-tab-0" />
              <Tab label="Finances" id="vehicle-tab-1" />
            </Tabs>
          </Box>
          
          <TabPanel value={value} index={0}>
            <VehicleDetails vehicle={vehicle} />
          </TabPanel>
          
          <TabPanel value={value} index={1}>
            <VehicleFinancialSummary vehicleId={vehicle.id || ''} />
          </TabPanel>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
