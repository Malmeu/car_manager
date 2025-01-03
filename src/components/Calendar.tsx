import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Dialog,
  DialogContent,
  IconButton,
  Button,
  AppBar,
  Toolbar,
  Typography,
  DialogTitle,
  DialogActions,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import { collection, getDocs, query, where, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { getCustomerById } from '../services/customerService';
import { getAllVehicles } from '../services/vehicleService';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../services/customerService';
import NewRentalModal from './rentals/NewRentalModal';

// Types
interface FirebaseRental {
  id: string;
  vehicleId: string;
  customerId: string;
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  status: 'active' | 'cancelled' | 'reservation' | 'completed' | 'blocked';
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  wilaya: string;
  contractId: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  userId: string;
  additionalFees: {
    description: string;
    amount: number;
  };
}

type RentalStatus = 'active' | 'cancelled' | 'reservation' | 'completed' | 'blocked';
type VehicleStatus = 'available' | 'rented' | 'reserved' | 'blocked';

interface Resource {
  id: string;
  title: string;
  status: VehicleStatus;
  statusLabel: string;
}

interface CalendarEvent {
  id: string;
  resourceId: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: RentalStatus;
    customerName?: string;
    vehicleInfo: string;
    vehicleId: string;
    durationInDays: number;
    note?: string;
  };
}

interface DateRange {
  start: Date;
  end: Date;
}

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ open, onClose }) => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDates, setSelectedDates] = useState<DateRange | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showNewRentalModal, setShowNewRentalModal] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [selectedBlockedEvent, setSelectedBlockedEvent] = useState<CalendarEvent | null>(null);
  const [blockNote, setBlockNote] = useState<string>('');

  // Gestionnaire de sélection de dates
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    if (!currentUser || !selectInfo.resource?.id) return;
    
    const resource = resources.find(r => r.id === selectInfo.resource?.id);
    if (!resource) return;

    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end
    });
    setSelectedResource(resource);
    setShowActionDialog(true);
  }, [currentUser, resources]);

  // Fonction pour bloquer une période
  const handleBlock = async () => {
    if (!selectedDates || !selectedResource || !currentUser) {
      console.error('Données manquantes pour le blocage:', { selectedDates, selectedResource, currentUser });
      return;
    }

    if (!blockNote.trim()) {
      console.error('Une note est requise pour le blocage');
      return;
    }

    try {
      console.log('Début du blocage:', {
        dates: selectedDates,
        resource: selectedResource,
        userId: currentUser.uid,
        note: blockNote
      });

      const rentalsRef = collection(db, 'rentals');
      const newBlockDoc = {
        userId: currentUser.uid,
        vehicleId: selectedResource.id,
        customerId: currentUser.uid,
        startDate: Timestamp.fromDate(selectedDates.start),
        endDate: Timestamp.fromDate(selectedDates.end),
        status: 'blocked',
        totalCost: 0,
        paymentStatus: 'paid',
        paidAmount: 0,
        wilaya: '',
        contractId: `blocked-${Date.now()}`,
        paymentMethod: 'other',
        additionalFees: {
          description: blockNote,
          amount: 0
        }
      };

      const docRef = await addDoc(rentalsRef, newBlockDoc);
      console.log('Document de blocage créé:', docRef.id);

      // Ajouter l'événement localement
      const newEvent: CalendarEvent = {
        id: docRef.id,
        resourceId: selectedResource.id,
        title: `Bloqué: ${blockNote}`,
        start: selectedDates.start,
        end: selectedDates.end,
        backgroundColor: '#666666',
        borderColor: '#444444',
        extendedProps: {
          status: 'blocked',
          vehicleInfo: selectedResource.title,
          vehicleId: selectedResource.id,
          durationInDays: Math.ceil((selectedDates.end.getTime() - selectedDates.start.getTime()) / (1000 * 60 * 60 * 24)),
          note: blockNote
        }
      };

      setEvents(prev => [...prev, newEvent]);
      console.log('Événement ajouté au calendrier');

      // Recharger les données
      await loadRentals();
      await loadVehicles();

      setShowActionDialog(false);
      setSelectedDates(null);
      setSelectedResource(null);
      setBlockNote('');
    } catch (error) {
      console.error('Erreur lors du blocage des dates:', error);
    }
  };

  // Fonction pour charger les locations et réservations
  const loadRentals = useCallback(async () => {
    if (!currentUser) return;

    try {
      const rentalsRef = collection(db, 'rentals');
      const q = query(
        rentalsRef,
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['active', 'reservation', 'blocked'])
      );
      
      const querySnapshot = await getDocs(q);
      const rentalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseRental[];

      const newEvents: CalendarEvent[] = [];

      for (const rental of rentalsData) {
        const startDate = rental.startDate.toDate();
        const endDate = rental.endDate.toDate();

        let customerName = '';
        let title = '';

        if (rental.status === 'blocked') {
          title = `Bloqué: ${rental.additionalFees.description}`;
        } else {
          if (rental.customerId && rental.customerId !== currentUser.uid) {
            try {
              const customer = await getCustomerById(rental.customerId);
              if (customer) {
                customerName = `${customer.firstName} ${customer.lastName}`;
                title = customerName;
              }
            } catch (error) {
              console.error('Erreur lors du chargement du client:', error);
              title = 'Sans nom';
            }
          }
        }

        const event: CalendarEvent = {
          id: rental.id,
          resourceId: rental.vehicleId,
          title: title,
          start: startDate,
          end: endDate,
          backgroundColor: rental.status === 'blocked' ? '#666666' : getEventColor(rental.status).backgroundColor,
          borderColor: rental.status === 'blocked' ? '#444444' : getEventColor(rental.status).borderColor,
          extendedProps: {
            status: rental.status,
            customerName,
            vehicleInfo: resources.find(r => r.id === rental.vehicleId)?.title || '',
            vehicleId: rental.vehicleId,
            durationInDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
            note: rental.additionalFees.description
          }
        };

        newEvents.push(event);
      }

      setEvents(newEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des locations:', error);
    }
  }, [currentUser, resources]);

  // Fonction pour traduire le statut du véhicule
  const getVehicleStatusLabel = (status: VehicleStatus): string => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'rented':
        return 'En Location';
      case 'reserved':
        return 'Réservé';
      case 'blocked':
        return 'Bloqué';
      default:
        return status;
    }
  };

  // Fonction pour charger les véhicules
  const loadVehicles = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const vehicles = await getAllVehicles(currentUser.uid);
      const resourcesList = vehicles
        .filter(vehicle => vehicle.id)
        .map(vehicle => ({
          id: vehicle.id!,
          title: `${vehicle.brand} ${vehicle.model}`,
          status: getVehicleStatus(vehicle.id!, events) as VehicleStatus,
          statusLabel: getVehicleStatusLabel(getVehicleStatus(vehicle.id!, events) as VehicleStatus)
        }));
      
      setResources(resourcesList);
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    }
  }, [currentUser, events]);

  // Fonction pour déterminer le statut d'un véhicule
  const getVehicleStatus = (vehicleId: string, events: CalendarEvent[]): VehicleStatus => {
    const now = new Date();
    const vehicleEvents = events.filter(event => event.resourceId === vehicleId);
    
    for (const event of vehicleEvents) {
      if (event.start <= now && event.end >= now) {
        if (event.extendedProps.status === 'blocked') return 'blocked';
        if (event.extendedProps.status === 'active') return 'rented';
        if (event.extendedProps.status === 'reservation') return 'reserved';
      }
    }
    
    return 'available';
  };

  // Gestionnaire de clic sur un événement
  const handleEventClick = useCallback((arg: EventClickArg) => {
    if (!arg.event) return;

    const eventStatus = arg.event.extendedProps?.status;
    if (eventStatus === 'blocked') {
      setSelectedBlockedEvent({
        id: arg.event.id,
        resourceId: arg.event.extendedProps?.vehicleId || '',
        title: arg.event.title,
        start: arg.event.start || new Date(),
        end: arg.event.end || new Date(),
        backgroundColor: arg.event.backgroundColor,
        borderColor: arg.event.borderColor,
        extendedProps: {
          status: eventStatus,
          vehicleInfo: arg.event.extendedProps?.vehicleInfo || '',
          vehicleId: arg.event.extendedProps?.vehicleId || '',
          durationInDays: 0,
          customerName: arg.event.extendedProps?.customerName,
          note: arg.event.extendedProps?.note
        }
      });
      setShowUnblockDialog(true);
    }
  }, []);

  // Fonction pour débloquer une période
  const handleUnblock = async () => {
    if (!selectedBlockedEvent || !currentUser) return;

    try {
      const rentalsRef = collection(db, 'rentals');
      const q = query(
        rentalsRef,
        where('userId', '==', currentUser.uid),
        where('vehicleId', '==', selectedBlockedEvent.extendedProps.vehicleId),
        where('status', '==', 'blocked')
      );
      
      const querySnapshot = await getDocs(q);
      let found = false;

      for (const doc of querySnapshot.docs) {
        const data = doc.data() as FirebaseRental;
        const startDate = data.startDate.toDate();
        const endDate = data.endDate.toDate();
        const eventStart = selectedBlockedEvent.start;
        const eventEnd = selectedBlockedEvent.end;

        // Comparer les dates avec une tolérance d'une seconde
        if (Math.abs(startDate.getTime() - eventStart.getTime()) < 1000 && 
            Math.abs(endDate.getTime() - eventEnd.getTime()) < 1000) {
          await deleteDoc(doc.ref);
          found = true;
          break;
        }
      }

      if (found) {
        // Mettre à jour l'état local
        setEvents(prev => prev.filter(event => event.id !== selectedBlockedEvent.id));
        console.log("Période débloquée avec succès");
      }

      setShowUnblockDialog(false);
      setSelectedBlockedEvent(null);
    } catch (error) {
      console.error('Erreur lors du déblocage de la période:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadVehicles();
      await loadRentals();
    };
    loadData();
  }, [loadVehicles, loadRentals]);

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Calendrier des Locations
            </Typography>
          </Toolbar>
        </AppBar>
        
        <DialogContent>
          <Box sx={{ height: 'calc(100vh - 100px)' }}>
            <FullCalendar
              plugins={[resourceTimelinePlugin, interactionPlugin]}
              initialView="resourceTimelineMonth"
              locale={frLocale}
              selectable={true}
              editable={false}
              resources={resources}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
              }}
              resourceGroupField="statusLabel"
              resourceAreaColumns={[
                {
                  field: 'title',
                  headerContent: 'Véhicules'
                }
              ]}
              eventContent={(arg) => {
                return (
                  <div
                    style={{
                      padding: '2px 4px',
                      fontSize: '0.9em',
                      cursor: arg.event.extendedProps?.status === 'blocked' ? 'pointer' : 'default'
                    }}
                  >
                    {arg.event.title}
                  </div>
                );
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialogue de choix d'action */}
      <Dialog
        open={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        aria-labelledby="action-dialog-title"
      >
        <DialogTitle id="action-dialog-title">
          Que souhaitez-vous faire ?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setShowActionDialog(false);
                setShowNewRentalModal(true);
              }}
            >
              Ajouter une location
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Note pour le blocage"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                placeholder="Entrez une note pour le blocage"
                required
                multiline
                rows={2}
              />
              <Button
                variant="contained"
                onClick={handleBlock}
                disabled={!blockNote.trim()}
                sx={{ 
                  backgroundColor: '#666666',
                  '&:hover': {
                    backgroundColor: '#444444'
                  }
                }}
              >
                Bloquer la période
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialogue de déblocage */}
      <Dialog
        open={showUnblockDialog}
        onClose={() => setShowUnblockDialog(false)}
        aria-labelledby="unblock-dialog-title"
      >
        <DialogTitle id="unblock-dialog-title">
          Débloquer la période
        </DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous débloquer cette période ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowUnblockDialog(false)}
            color="primary"
          >
            Annuler
          </Button>
          <Button
            onClick={handleUnblock}
            color="primary"
            variant="contained"
          >
            Débloquer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de nouvelle location */}
      {selectedDates && selectedResource && (
        <NewRentalModal
          open={showNewRentalModal}
          onClose={() => {
            setShowNewRentalModal(false);
            setSelectedDates(null);
            setSelectedResource(null);
          }}
          selectedDate={selectedDates.start}
          selectedEndDate={selectedDates.end}
          selectedResource={selectedResource}
          onSuccess={() => {
            loadRentals();
            setShowNewRentalModal(false);
            setSelectedDates(null);
            setSelectedResource(null);
          }}
        />
      )}
    </>
  );
};

// Fonction pour obtenir la couleur en fonction du statut
const getEventColor = (status: RentalStatus): { backgroundColor: string; borderColor: string } => {
  switch (status) {
    case 'active':
      return { backgroundColor: '#4CAF50', borderColor: '#2E7D32' }; // Vert
    case 'reservation':
      return { backgroundColor: '#2196F3', borderColor: '#1565C0' }; // Bleu
    case 'cancelled':
      return { backgroundColor: '#F44336', borderColor: '#C62828' }; // Rouge
    case 'completed':
      return { backgroundColor: '#9E9E9E', borderColor: '#616161' }; // Gris
    case 'blocked':
      return { backgroundColor: '#666666', borderColor: '#444444' }; // Gris foncé
    default:
      return { backgroundColor: '#E0E0E0', borderColor: '#9E9E9E' };
  }
};

// Composant bouton pour ouvrir le calendrier
const CalendarButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        startIcon={<CalendarMonthIcon />}
      >
        Calendrier des Locations
      </Button>
      <CalendarModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export { CalendarButton, CalendarModal };
