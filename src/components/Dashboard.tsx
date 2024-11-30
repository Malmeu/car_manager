import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getAllRentals } from '../services/rentalService';
import { getAllVehicles } from '../services/vehicleService';
import { getAllCustomers } from '../services/customerService';

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;  // Allow both string and Date
  end: string | Date;    // Allow both string and Date
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    vehicleId: string;
    customerId: string;
    status: string;
    vehicleInfo: string;
    customerInfo: string;
    price: number;
  };
}

const Dashboard: React.FC = () => {
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rentalsData, vehiclesData, customersData] = await Promise.all([
          getAllRentals(),
          getAllVehicles(),
          getAllCustomers(),
        ]);

        // Mise à jour des statistiques
        setTotalVehicles(vehiclesData.length);
        setTotalCustomers(customersData.length);
        
        const rentals = rentalsData.filter(
          (rental) => rental.status === 'active'
        );
        setActiveRentals(rentals.length);

        const revenue = rentalsData.reduce((acc, rental) => acc + (rental.totalCost || 0), 0);
        setTotalRevenue(revenue);

        // Préparation des événements du calendrier
        // Filter only active rentals
        const activeRentals = rentalsData.filter(rental => rental.status === 'active');
        
        const calendarEvents = activeRentals.map((rental) => {
          const vehicle = vehiclesData.find(v => v.id === rental.vehicleId);
          const customer = customersData.find(c => c.id === rental.customerId);
          const eventColor = '#4CAF50'; // Couleur verte pour les locations actives
          
          // Formatage du titre pour plus de clarté
          const title = `🚗 ${vehicle?.brand} ${vehicle?.model}\n👤 ${customer?.firstName} ${customer?.lastName}`;
          
          return {
            id: rental.id!,
            title: title,
            start: rental.startDate.toDate().toISOString(),
            end: rental.endDate.toDate().toISOString(),
            backgroundColor: eventColor,
            borderColor: eventColor,
            extendedProps: {
              vehicleId: rental.vehicleId,
              customerId: rental.customerId,
              status: rental.status,
              vehicleInfo: `${vehicle?.brand} ${vehicle?.model}`,
              customerInfo: `${customer?.firstName} ${customer?.lastName}`,
              price: rental.totalCost
            }
          };
        });

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    console.log('Event clicked:', {
      rental: event.id,
      vehicle: event.extendedProps.vehicleId,
      customer: event.extendedProps.customerId,
      status: event.extendedProps.status,
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                Véhicules Totaux
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                {totalVehicles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                Clients Totaux
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                {totalCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                Locations Actives
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                {activeRentals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                Revenus Totaux
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ 
          p: { xs: 1, sm: 2 },
          '& .fc': {
            // Styles pour FullCalendar
            '& .fc-toolbar': {
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 },
              '& .fc-toolbar-chunk': {
                display: 'flex',
                justifyContent: 'center',
                mb: { xs: 1, sm: 0 }
              }
            },
            '& .fc-toolbar-title': {
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            },
            '& .fc-button': {
              padding: { xs: '4px 8px', sm: '6px 12px' },
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            },
            '& .fc-event': {
              cursor: 'pointer'
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
                  p: { xs: '2px', sm: '4px' }, 
                  fontSize: { xs: '0.75em', sm: '0.85em' }, 
                  lineHeight: '1.3' 
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
                  <Typography sx={{ 
                    mt: '2px',
                    color: '#666',
                    fontSize: 'inherit',
                    display: { xs: 'none', sm: 'block' }
                  }}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(eventInfo.event.extendedProps.price)}
                  </Typography>
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
