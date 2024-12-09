import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Checkbox, 
  FormControlLabel, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { getCustomerById } from '../services/customerService';
import { getAllVehicles } from '../services/vehicleService';
import { addRental } from '../services/rentalService';
import { Vehicle } from '../models/Vehicle';
import { Customer as CustomerType } from '../services/customerService';
import { Rental as RentalType } from '../services/rentalService';
import NewRentalModal from './rentals/NewRentalModal';

type RentalStatus = 'active' | 'cancelled' | 'reservation' | 'completed';

interface Resource {
  id: string;
  title: string;
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
    customerName: string;
    vehicleInfo: string;
    vehicleId: string;
    durationInDays: number;
  };
}

interface Rental {
  id: string;
  vehicleId: string;
  customerId?: string;
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  totalCost: number;
  status: string;
  customerName?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface NewRentalModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedEndDate: Date | null;
  selectedResource: Resource | null;
  onSuccess: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Calendar: React.FC = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isNewRentalModalOpen, setIsNewRentalModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showQuotes, setShowQuotes] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (event.extendedProps?.status === 'completed') return false;
      if (!showQuotes && event.extendedProps?.status === 'reservation') return false;
      return true;
    });
  }, [events, showQuotes]);

  const handleDateSelect = useCallback((selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    const resourceId = selectInfo.resource?.id;
    
    // Ajuster la date de début pour le fuseau horaire local
    const localStartDate = new Date(selectInfo.start);
    localStartDate.setMinutes(localStartDate.getMinutes() - localStartDate.getTimezoneOffset());
    
    // Ajuster la date de fin pour le fuseau horaire local
    const localEndDate = new Date(selectInfo.end);
    localEndDate.setMinutes(localEndDate.getMinutes() - localEndDate.getTimezoneOffset());
    
    // Soustraire un jour à la date de fin car FullCalendar ajoute un jour par défaut
    localEndDate.setDate(localEndDate.getDate() - 1);
    
    setSelectedDate(localStartDate);
    setSelectedEndDate(localEndDate);
    setSelectedResource(resourceId || null);
    setIsNewRentalModalOpen(true);
  }, []);

  const fetchVehiclesAndRentals = useCallback(async () => {
    if (!currentUser) return;

    try {
      const vehiclesData = await getAllVehicles(currentUser.uid);
      
      const resourcesList = vehiclesData.map(vehicle => ({
        id: vehicle.id || '',
        title: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
      }));
      setResources(resourcesList);

      const rentalsSnapshot = await getDocs(
        query(collection(db, 'rentals'), 
        where('userId', '==', currentUser.uid))
      );

      const eventsList: CalendarEvent[] = [];
      for (const rentalDoc of rentalsSnapshot.docs) {
        const rental = rentalDoc.data() as RentalType;
        rental.id = rentalDoc.id;

        // Ignorer les locations terminées
        if (rental.status === 'completed') continue;

        let customerName = '';
        if (rental.customerId) {
          const customerDoc = await getCustomerById(rental.customerId);
          if (customerDoc) {
            customerName = `${customerDoc.firstName} ${customerDoc.lastName}`;
          }
        }

        const vehicle = vehiclesData.find(v => v.id === rental.vehicleId);
        const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model}` : '';

        const eventColor = getEventColor(rental.status as RentalStatus);
        
        // Ajuster la date de fin pour inclure le dernier jour
        const endDate = rental.endDate.toDate();
        endDate.setHours(23, 59, 59);

        eventsList.push({
          id: rental.id,
          resourceId: rental.vehicleId,
          title: `${rental.status === 'reservation' ? '🕒 ' : ''}${customerName}`,
          start: rental.startDate.toDate(),
          end: endDate,
          backgroundColor: eventColor,
          borderColor: eventColor,
          extendedProps: {
            status: rental.status as RentalStatus,
            customerName,
            vehicleInfo,
            vehicleId: rental.vehicleId,
            durationInDays: Math.ceil(
              (endDate.getTime() - rental.startDate.toDate().getTime()) / 
              (1000 * 60 * 60 * 24)
            )
          }
        });
      }

      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchVehiclesAndRentals();
  }, [fetchVehiclesAndRentals]);

  return (
    <Box sx={{ 
      height: 'calc(100vh - 100px)', 
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showQuotes}
              onChange={(e) => setShowQuotes(e.target.checked)}
            />
          }
          label="Afficher les réservations"
        />
      </Box>
      <Box sx={{ 
        flex: 1,
        minHeight: 0, // Important pour que le flex fonctionne correctement
        '& .fc': {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& .fc-view-harness': {
            flex: 1,
            minHeight: 0 // Important pour éviter le débordement
          }
        }
      }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineMonth"
          locale={frLocale}
          resources={resources}
          events={filteredEvents}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          resourceAreaHeaderContent="Liste des véhicules"
          resourceAreaColumns={[
            {
              field: 'title',
              headerContent: '',
              width: 200
            }
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
          }}
          height="100%"
          slotMinWidth={50}
          resourceAreaWidth="200px"
          slotDuration={{ days: 1 }}
          snapDuration={{ days: 1 }}
          editable={false}
          droppable={false}
          eventOverlap={false}
          selectOverlap={false}
          eventConstraint="businessHours"
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '00:00',
            endTime: '24:00',
          }}
        />
      </Box>
      
      <NewRentalModal
        open={isNewRentalModalOpen}
        onClose={() => {
          setIsNewRentalModalOpen(false);
          setSelectedDate(null);
          setSelectedEndDate(null);
          setSelectedResource(null);
        }}
        selectedDate={selectedDate}
        selectedEndDate={selectedEndDate}
        selectedResource={selectedResource ? resources.find(resource => resource.id === selectedResource) || null : null}
        onSuccess={() => {
          fetchVehiclesAndRentals();
          setIsNewRentalModalOpen(false);
        }}
      />
    </Box>
  );
};

const getEventColor = (status: RentalStatus) => {
  switch (status) {
    case 'active':
      return '#4CAF50'; // Vert
    case 'completed':
      return '#9E9E9E'; // Gris
    case 'cancelled':
      return '#F44336'; // Rouge
    case 'reservation':
      return '#FFA726'; // Orange
    default:
      return '#2196F3'; // Bleu par défaut
  }
};

const styles = `
  .fc {
    background-color: white;
  }

  .resource-header {
    background-color: #f5f5f5;
    border-bottom: 2px solid #e0e0e0;
    font-weight: bold;
  }

  .resource-label {
    padding: 8px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #ffffff;
  }

  .slot-lane {
    border-bottom: 1px solid #e0e0e0;
    background-color: #ffffff;
  }

  .calendar-event {
    margin: 2px 0;
    border-radius: 20px;
    padding: 2px 8px;
  }

  .fc .fc-timeline-slot {
    border-right: 1px solid #e0e0e0 !important;
  }

  .fc .fc-timeline-slot-label {
    border-right: 1px solid #ccc !important;
  }

  .fc .fc-timeline-slot.fc-day-today {
    background-color: rgba(188, 232, 241, 0.1);
  }

  .fc-timeline-slot-label-frame {
    font-weight: normal;
    color: #666;
  }

  .fc-resource-timeline-divider {
    background-color: #e0e0e0 !important;
    width: 2px !important;
  }

  .fc-timeline-header {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e0e0e0;
  }

  .fc-timeline-slot-label {
    border-top: 1px solid #e0e0e0 !important;
  }

  .fc-timeline-body {
    border-top: 1px solid #e0e0e0;
  }

  .fc-resource-timeline-divider {
    background: #e0e0e0;
  }

  .fc-col-header-cell {
    background-color: #f8f9fa;
    border-right: 1px solid #e0e0e0;
    border-bottom: 2px solid #e0e0e0;
  }

  .fc-timeline-slot.fc-day-sat,
  .fc-timeline-slot.fc-day-sun {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .fc-resource-group {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e0e0e0;
  }

  .fc-resource-group-header {
    font-weight: bold;
    padding: 8px;
  }

  .fc-timeline-event {
    border-radius: 20px;
    padding: 2px 8px;
    margin: 1px 0;
  }

  .fc-timeline-event .fc-event-main {
    padding: 2px 4px;
  }

  .fc-timeline-header-row {
    border-right: 1px solid #e0e0e0;
  }

  .fc-timeline-lane {
    border-bottom: 1px solid #e0e0e0;
  }

  .fc-resource-timeline-divider {
    width: 2px;
    background-color: #e0e0e0;
  }

  .fc-day-today {
    background-color: rgba(188, 232, 241, 0.1) !important;
  }

  .fc-day-header {
    font-weight: normal;
    color: #666;
    padding: 8px 0;
    border-right: 1px solid #e0e0e0;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Calendar;
