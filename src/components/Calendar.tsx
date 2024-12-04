import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'rental' | 'maintenance';
    vehicleInfo?: string;
    customerInfo?: string;
    price?: number;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) return;

      try {
        // Fetch rentals
        const rentalsQuery = query(
          collection(db, 'rentals'),
          where('userId', '==', currentUser.uid)
        );
        const rentalsSnapshot = await getDocs(rentalsQuery);
        
        const rentalEvents: CalendarEvent[] = [];
        
        for (const doc of rentalsSnapshot.docs) {
          const rental = doc.data();
          
          // Fetch associated vehicle
          const vehicleDoc = await getDocs(
            query(collection(db, 'vehicles'), 
            where('id', '==', rental.vehicleId))
          );
          const vehicle = vehicleDoc.docs[0]?.data();

          // Fetch associated client
          const clientDoc = await getDocs(
            query(collection(db, 'clients'), 
            where('id', '==', rental.clientId))
          );
          const client = clientDoc.docs[0]?.data();

          rentalEvents.push({
            id: doc.id,
            title: `🚗 ${vehicle?.brand} ${vehicle?.model}\n👤 ${client?.name}`,
            start: rental.startDate.toDate().toISOString(),
            end: rental.endDate.toDate().toISOString(),
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            extendedProps: {
              type: 'rental',
              vehicleInfo: `${vehicle?.brand} ${vehicle?.model}`,
              customerInfo: client?.name,
              price: rental.totalAmount
            }
          });
        }

        setEvents(rentalEvents);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };

    fetchEvents();
  }, [currentUser]);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    console.log('Event clicked:', event.extendedProps);
  };

  return (
    <Box sx={{ 
      '& .fc': {
        maxWidth: '100%',
        fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
        
        '& .fc-toolbar': {
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          mb: { xs: 2, sm: 3 },
          '& .fc-toolbar-chunk': {
            display: 'flex',
            justifyContent: 'center',
            mb: { xs: 1, sm: 0 },
            width: { xs: '100%', sm: 'auto' }
          }
        },
        
        '& .fc-toolbar-title': {
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
        },
        
        '& .fc-event': {
          cursor: 'pointer',
          padding: '4px',
          margin: '2px 0'
        },
        
        '& .fc-view': {
          minHeight: { xs: '300px', sm: '400px', md: '500px' }
        }
      }
    }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        locale="fr"
        eventContent={(eventInfo) => {
          return (
            <Box sx={{ 
              p: '4px',
              fontSize: 'inherit',
              lineHeight: 1.2
            }}>
              <Typography sx={{ 
                fontWeight: 'bold',
                fontSize: 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {eventInfo.event.extendedProps.vehicleInfo}
              </Typography>
              <Typography sx={{ 
                fontSize: 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {eventInfo.event.extendedProps.customerInfo}
              </Typography>
              {eventInfo.event.extendedProps.price && (
                <Typography sx={{ 
                  mt: '2px',
                  fontSize: '0.9em',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  {eventInfo.event.extendedProps.price.toLocaleString()} DA
                </Typography>
              )}
            </Box>
          );
        }}
        buttonText={{
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour'
        }}
      />
    </Box>
  );
};

export default Calendar;
