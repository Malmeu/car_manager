import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getAllRentals } from '../services/rentalService';
import { getAllVehicles } from '../services/vehicleService';
import { getAllCustomers } from '../services/customerService';
import { subscriptionService } from '../services/subscriptionService';
import { auth, db } from '../config/firebase';
import { differenceInDays } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import TestSubscriptionSystem from './test/TestSubscriptionSystem';

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
  const [subscription, setSubscription] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.fullName || userData.email || 'Utilisateur');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du nom d\'utilisateur:', error);
        }
      }
    };

    fetchUserName();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        // Récupérer l'abonnement en premier
        const currentSubscription = await subscriptionService.getCurrentSubscription(user.uid);
        setSubscription(currentSubscription);
        console.log('Subscription:', currentSubscription); // Debug

        // Récupérer les données avec le userId
        const [rentalsData, vehiclesData, customersData] = await Promise.all([
          getAllRentals(user.uid),
          getAllVehicles(user.uid),
          getAllCustomers(user.uid),
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
        const calendarEvents = rentals.map((rental) => {
          const vehicle = vehiclesData.find(v => v.id === rental.vehicleId);
          const customer = customersData.find(c => c.id === rental.customerId);
          const eventColor = '#4CAF50';
          
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
  }, [navigate]);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    console.log('Event clicked:', {
      rental: event.id,
      vehicle: event.extendedProps.vehicleId,
      customer: event.extendedProps.customerId,
      status: event.extendedProps.status,
    });
  };

  const handleSubscribe = () => {
    navigate('/subscription');  // Make sure this route exists in your App.tsx
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Message */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Bienvenue, {userName}
      </Typography>

      {(!subscription || subscription?.status === 'trial') && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%'
            },
            '& .MuiAlert-action': {
              paddingLeft: 0,
              marginRight: 0,
              alignItems: 'center'
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleSubscribe}
              sx={{
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                px: { xs: 1, sm: 2 }
              }}
            >
              Choisir un abonnement
            </Button>
          }
        >
          {subscription?.status === 'trial' 
            ? `Il vous reste ${differenceInDays(new Date(subscription.endDate), new Date())} jours d'essai.`
            : "Veuillez choisir un abonnement pour utiliser l'application."
          }
        </Alert>
      )}
      {subscription?.status === 'pending' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Votre demande d'abonnement est en cours de traitement.
        </Alert>
      )}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                {new Intl.NumberFormat('fr-FR', { 
                  style: 'decimal',
                  maximumFractionDigits: 0
                }).format(totalRevenue)} DZD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {process.env.NODE_ENV === 'development' && <TestSubscriptionSystem />}

      <Card sx={{ 
        mt: { xs: 2, sm: 3 },
        overflow: 'hidden'
      }}>
        <CardContent sx={{ 
          p: { xs: 1, sm: 2 },
          '& .fc': {
            // Styles généraux pour FullCalendar
            maxWidth: '100%',
            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
            
            // Styles pour la barre d'outils
            '& .fc-toolbar': {
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 },
              mb: { xs: 2, sm: 3 },
              '& .fc-toolbar-chunk': {
                display: 'flex',
                justifyContent: 'center',
                mb: { xs: 1, sm: 0 },
                width: { xs: '100%', sm: 'auto' }
              },
              '& .fc-button-group': {
                display: 'flex',
                gap: '4px'
              }
            },
            
            // Styles pour le titre et les boutons
            '& .fc-toolbar-title': {
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              padding: { xs: '0.5rem 0', sm: 0 }
            },
            '& .fc-button': {
              padding: { xs: '4px 8px', sm: '6px 12px' },
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              minWidth: { xs: '60px', sm: 'auto' }
            },
            
            // Styles pour les événements
            '& .fc-event': {
              cursor: 'pointer',
              margin: '2px 0',
              minHeight: { xs: '40px', sm: '50px' }
            },
            
            // Styles pour les cellules
            '& .fc-daygrid-day': {
              padding: { xs: '2px', sm: '4px' }
            },
            
            // Styles pour la vue mobile
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
                  p: { xs: '3px', sm: '4px', md: '6px' },
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                  lineHeight: '1.3',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
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
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'decimal',
                      maximumFractionDigits: 0
                    }).format(eventInfo.event.extendedProps.price)} DZD
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
