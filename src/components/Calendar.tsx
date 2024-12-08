import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerById } from '../services/customerService';

interface Vehicle {
  brand: string;
  model: string;
  year: number;
  registration: string;
  status: string;
  make?: string;  // Some vehicles might use make instead of brand
}

interface Client {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Rental {
  vehicleId: string;
  clientId?: string;
  customerId?: string;
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  totalCost: number;
  status: string;
  additionalFees?: {
    amount: number;
  };
}

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
    additionalFees?: number;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) {
        console.log('No current user found');
        return;
      }

      try {
        console.log('Fetching rentals for user:', currentUser.uid);
        // Fetch rentals for the current user and active status
        const rentalsQuery = query(
          collection(db, 'rentals'),
          where('status', '==', 'active')
        );
        const rentalsSnapshot = await getDocs(rentalsQuery);
        console.log('Total active rentals in database:', rentalsSnapshot.size);
        
        const rentalEvents: CalendarEvent[] = [];
        
        for (const docSnapshot of rentalsSnapshot.docs) {
          const rental = docSnapshot.data() as Rental;
          console.log('Processing rental:', {
            id: docSnapshot.id,
            vehicleId: rental.vehicleId,
            clientId: rental.clientId,
            customerId: rental.customerId,
            startDate: rental.startDate?.toDate?.(),
            endDate: rental.endDate?.toDate?.(),
            status: rental.status
          });
          
          try {
            // Fetch associated vehicle
            const vehicleDocRef = doc(db, 'vehicles', rental.vehicleId);
            const vehicleDoc = await getDoc(vehicleDocRef);
            const vehicleData = vehicleDoc.exists() ? vehicleDoc.data() : null;
            console.log('Vehicle data:', vehicleData);

            if (!vehicleDoc.exists() || !vehicleData) {
              console.warn('Vehicle not found:', rental.vehicleId);
              continue;
            }

            const vehicle = {
              brand: vehicleData?.brand || vehicleData?.make || 'Unknown Brand',
              model: vehicleData?.model || 'Unknown Model',
              year: vehicleData?.year || 0,
              registration: vehicleData?.registration || 'Unknown',
              status: vehicleData?.status || 'unknown'
            };

            // Fetch associated client using customerService
            const clientId = rental.clientId || rental.customerId;
            if (!clientId) {
              console.warn('No client ID found in rental:', docSnapshot.id);
              continue;
            }

            const client = await getCustomerById(clientId);
            if (!client) {
              console.warn('Client not found:', clientId);
              continue;
            }

            console.log('Client data found:', client);

            // Ensure we have valid dates
            if (!rental.startDate?.toDate || !rental.endDate?.toDate) {
              console.warn('Invalid dates in rental:', docSnapshot.id);
              continue;
            }

            const totalAmount = rental.totalCost + (rental.additionalFees?.amount || 0);

            const event = {
              id: docSnapshot.id,
              title: `🚗 ${vehicle.brand} ${vehicle.model}\n👤 ${client.firstName} ${client.lastName}`,
              start: rental.startDate.toDate().toISOString(),
              end: rental.endDate.toDate().toISOString(),
              backgroundColor: rental.status === 'active' ? '#4CAF50' : '#9E9E9E',
              borderColor: rental.status === 'active' ? '#4CAF50' : '#9E9E9E',
              extendedProps: {
                type: 'rental' as const,
                vehicleInfo: `${vehicle.brand} ${vehicle.model}`,
                customerInfo: `${client.firstName} ${client.lastName}`,
                price: totalAmount,
                additionalFees: rental.additionalFees?.amount
              }
            };
            console.log('Created calendar event:', event);
            rentalEvents.push(event);
          } catch (error) {
            console.error('Error processing rental:', docSnapshot.id, error);
          }
        }

        console.log('Setting final events:', rentalEvents);
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
              {eventInfo.event.extendedProps.additionalFees && (
                <Typography sx={{ 
                  mt: '2px',
                  fontSize: '0.9em',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  Frais supplémentaires: {eventInfo.event.extendedProps.additionalFees.toLocaleString()} DA
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
