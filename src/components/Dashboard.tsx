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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Véhicules Total
              </Typography>
              <Typography variant="h5">{totalVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Clients Total
              </Typography>
              <Typography variant="h5">{totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Locations Actives
              </Typography>
              <Typography variant="h5">{activeRentals}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Revenu Total
              </Typography>
              <Typography variant="h5">{totalRevenue.toFixed(2)} €</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, height: '600px' }}>
        <Typography variant="h6" gutterBottom>
          Calendrier des Locations
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
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
                <div style={{ padding: '4px', fontSize: '0.85em', lineHeight: '1.3' }}>
                  <div style={{ fontWeight: 'bold' }}>{eventInfo.event.extendedProps.vehicleInfo}</div>
                  <div>{eventInfo.event.extendedProps.customerInfo}</div>
                  <div style={{ marginTop: '2px', color: '#666' }}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(eventInfo.event.extendedProps.price)}
                  </div>
                </div>
              );
            }}
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
