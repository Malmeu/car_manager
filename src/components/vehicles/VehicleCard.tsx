import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Badge,
  Collapse,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import DateRangeIcon from '@mui/icons-material/DateRange';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { db } from '../../config/firebase';

import { Vehicle, VehicleStatus } from '../../types';
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

const statusLabels: Record<VehicleStatus, string> = {
  available: 'Disponible',
  rented: 'En location',
  reservation: 'En réservation',
  maintenance: 'En maintenance',
  unavailable: 'Indisponible'
};

const statusColors: Record<VehicleStatus, string> = {
  available: 'success.main',
  rented: 'info.main',
  reservation: 'warning.main',
  maintenance: 'error.main',
  unavailable: 'error.main'
};

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
  const [expanded, setExpanded] = useState(false);

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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.expand-button')) {
      return;
    }
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

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    setShowNotifications(true);
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
        mb: 2, 
        position: 'relative',
        backgroundColor: 'rgba(64, 81, 181, 0.85)', // Plus de transparence
        borderRadius: '16px',
        '& .MuiCardContent-root': {
          color: 'white'
        },
        '& .MuiIconButton-root': {
          color: 'white'
        },
        '& .expand-button:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        },
        '& .MuiTypography-root': {
          color: 'white'
        },
        '& .MuiChip-root': {
          color: 'white'
        },
        '& .MuiSvgIcon-root': {
          color: 'white'
        },
        backdropFilter: 'blur(4px)', // Effet de flou pour la transparence
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' // Ombre légère
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: !expanded ? 0 : 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </Typography>
            {!expanded && (
              <Chip
                size="small"
                label={statusLabels[vehicle.status]}
                sx={{ 
                  backgroundColor: statusColors[vehicle.status],
                  color: 'white',
                  ml: 1
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {notifications.length > 0 && (
              <IconButton
                size="small"
                onClick={handleNotificationClick}
                sx={{
                  position: 'relative',
                  color: 'white'
                }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
            <IconButton 
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ ml: 1 }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip
              size="small"
              label={statusLabels[vehicle.status]}
              sx={{ 
                backgroundColor: statusColors[vehicle.status],
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

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Carburant
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalGasStationIcon sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', textTransform: 'capitalize' }}>
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
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Kilométrage initial
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {((vehicle?.baseMileage || 0).toLocaleString())} km
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
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Kilométrage total
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {loading ? '...' : (totalMileage || 0).toLocaleString()} km
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
          </Box>

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
                    backgroundColor: (theme) => `${theme.palette.primary.main}15`,
                    color: (theme) => theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: 'white',
                    },
                  }}
                >
                  <TimelineIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Modifier">
                <IconButton
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vehicle);
                  }}
                  sx={{ 
                    backgroundColor: (theme) => `${theme.palette.primary.main}15`,
                    color: (theme) => theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: 'white',
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (vehicle.id) {
                      onDelete(vehicle.id);
                    }
                  }}
                  sx={{ 
                    backgroundColor: (theme) => `${theme.palette.error.main}15`,
                    color: (theme) => theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.error.main,
                      color: 'white',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardActions>
        </Collapse>
      </CardContent>

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
