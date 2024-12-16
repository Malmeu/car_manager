import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Assessment as AssessmentIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllCustomers, deleteCustomer, Customer } from '../../services/customerService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import AddCustomerDialog from './AddCustomerDialog';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface RentalHistory {
  id: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  paidAmount: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicle: {
    brand: string;
    model: string;
  };
}

interface ClientReport {
  totalRentals: number;
  totalRevenue: number;
  rentals: RentalHistory[];
}

interface RentalStats {
  averageDuration: number;
  mostRentedVehicles: { vehicle: string; count: number }[];
  monthlyRentals: { month: string; count: number }[];
}

const calculateRentalStats = (rentals: any[]): RentalStats => {
  // Calcul de la durée moyenne
  const totalDuration = rentals.reduce((acc, rental) => {
    const start = new Date(rental.startDate);
    const end = new Date(rental.endDate);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  const averageDuration = totalDuration / rentals.length;

  // Véhicules les plus loués
  const vehicleCounts = rentals.reduce((acc: Record<string, number>, rental) => {
    const vehicleKey = `${rental.vehicle.brand} ${rental.vehicle.model}`;
    acc[vehicleKey] = (acc[vehicleKey] || 0) + 1;
    return acc;
  }, {});
  const mostRentedVehicles = Object.entries(vehicleCounts)
    .map(([vehicle, count]) => ({ vehicle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Évolution mensuelle des locations
  const monthlyRentals = rentals.reduce((acc: Record<string, number>, rental) => {
    const month = format(new Date(rental.startDate), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const monthlyData = Object.entries(monthlyRentals)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return {
    averageDuration,
    mostRentedVehicles,
    monthlyRentals: monthlyData,
  };
};

const exportToPDF = (client: any, rentals: any[], stats: RentalStats) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text(`Rapport Client: ${client.firstName} ${client.lastName}`, 20, 20);

  // Résumé
  doc.setFontSize(14);
  doc.text('Résumé', 20, 40);
  doc.setFontSize(12);
  doc.text(`Nombre total de locations: ${rentals.length}`, 30, 50);
  doc.text(`Durée moyenne de location: ${stats.averageDuration.toFixed(1)} jours`, 30, 60);

  // Véhicules les plus loués
  doc.setFontSize(14);
  doc.text('Véhicules les plus loués', 20, 80);
  doc.setFontSize(12);
  stats.mostRentedVehicles.forEach((vehicle, index) => {
    doc.text(`${vehicle.vehicle}: ${vehicle.count} locations`, 30, 90 + index * 10);
  });

  // Tableau des locations
  const tableData = rentals.map((rental) => [
    format(new Date(rental.startDate), 'dd/MM/yyyy'),
    format(new Date(rental.endDate), 'dd/MM/yyyy'),
    `${rental.vehicle.brand} ${rental.vehicle.model}`,
    `${rental.totalCost}€`,
    `${rental.paidAmount}€`,
    `${rental.totalCost - rental.paidAmount}€`,
  ]);

  doc.autoTable({
    startY: 130,
    head: [['Début', 'Fin', 'Véhicule', 'Total', 'Payé', 'Reste']],
    body: tableData,
  });

  doc.save(`rapport_${client.firstName}_${client.lastName}.pdf`);
};

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Customer[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [rentals, setRentals] = useState<any[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [clientReport, setClientReport] = useState<ClientReport | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const clientsData = await getAllCustomers();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteCustomer(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const fetchClientReport = async (client: Customer) => {
    try {
      setSelectedClient(client);

      // Fetch all rentals for this client
      const rentalsQuery = query(
        collection(db, 'rentals'),
        where('clientId', '==', client.id)
      );
      const rentalsSnapshot = await getDocs(rentalsQuery);

      const rentalsHistory: RentalHistory[] = [];
      let totalRevenue = 0;

      for (const rentalDoc of rentalsSnapshot.docs) {
        const rental = rentalDoc.data();
        const vehicleDoc = await getDocs(query(collection(db, 'vehicles'), where('id', '==', rental.vehicleId)));
        const vehicle = vehicleDoc.docs[0]?.data();

        const rentalHistory = {
          id: rentalDoc.id,
          startDate: rental.startDate,
          endDate: rental.endDate,
          totalCost: rental.totalCost || 0,
          paidAmount: rental.paidAmount || 0,
          vehicleBrand: vehicle?.brand || 'Inconnu',
          vehicleModel: vehicle?.model || 'Inconnu',
          vehicle: {
            brand: vehicle?.brand || 'Inconnu',
            model: vehicle?.model || 'Inconnu'
          }
        };

        rentalsHistory.push(rentalHistory);
        totalRevenue += rental.totalCost || 0;
      }

      // Mettre à jour les locations
      setRentals(rentalsHistory);

      // Calculer et mettre à jour les statistiques
      const calculatedStats = calculateRentalStats(rentalsHistory);
      setStats(calculatedStats);

      // Mettre à jour le rapport client
      setClientReport({
        totalRentals: rentalsHistory.length,
        totalRevenue,
        rentals: rentalsHistory
      });

      setOpenReport(true);
    } catch (error) {
      console.error('Error fetching client report:', error);
    }
  };

  const handleCloseReport = () => {
    setOpenReport(false);
    setSelectedClient(null);
    setClientReport(null);
    setRentals([]);
    setStats(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Clients
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenAddDialog(true)}
          startIcon={<AddIcon />}
        >
          Ajouter un client
        </Button>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Client
      </Typography>
      <Grid container spacing={3}>
        {clients.map((client) => (
          <Grid item xs={12} sm={6} md={4} key={client.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {`${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {client.firstName}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {client.lastName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box component="span" sx={{ mr: 1 }}>📧</Box>
                  <Typography>{client.email}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box component="span" sx={{ mr: 1 }}>📱</Box>
                  <Typography>{client.phone}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box component="span" sx={{ mr: 1 }}>🚗</Box>
                  <Typography>{client.drivingLicense}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box component="span" sx={{ mr: 1 }}>📍</Box>
                  <Typography>{client.address}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <MuiTooltip title="Voir le rapport">
                    <IconButton
                      onClick={() => client.id && fetchClientReport(client)}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Modifier">
                    <IconButton
                      onClick={() => navigate(`/clients/edit/${client.id}`)}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Supprimer">
                    <IconButton
                      onClick={() => client.id && handleDelete(client.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </MuiTooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openReport}
        onClose={handleCloseReport}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClient && `Rapport de ${selectedClient.firstName} ${selectedClient.lastName}`}
        </DialogTitle>
        <DialogContent>
          {clientReport && (
            <Box>
              <Typography variant="h6">Résumé</Typography>
              <Typography>
                Nombre total de locations : {clientReport.totalRentals}
              </Typography>
              <Typography>
                Revenu total généré : {clientReport.totalRevenue}€
              </Typography>

              {/* Affichage des statistiques */}
              {stats && (
                <>
                  <Typography variant="h6" sx={{ mt: 3 }}>Statistiques détaillées</Typography>
                  <Typography>
                    Durée moyenne de location : {stats.averageDuration.toFixed(1)} jours
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 2 }}>Top 3 des véhicules les plus loués</Typography>
                  {stats.mostRentedVehicles.map((vehicle, index) => (
                    <Typography key={index}>
                      {index + 1}. {vehicle.vehicle} : {vehicle.count} location(s)
                    </Typography>
                  ))}

                  <Typography variant="h6" sx={{ mt: 3 }}>Évolution des locations</Typography>
                  <Box sx={{ width: '100%', height: 300, mt: 2 }}>
                    <BarChart
                      width={600}
                      height={300}
                      data={stats.monthlyRentals}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Nombre de locations" />
                    </BarChart>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => exportToPDF(selectedClient, rentals, stats)}
                    sx={{ mt: 2 }}
                  >
                    Exporter en PDF
                  </Button>
                </>
              )}

              <Typography variant="h6" sx={{ mt: 3 }}>Historique des locations</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date de début</TableCell>
                      <TableCell>Date de fin</TableCell>
                      <TableCell>Véhicule</TableCell>
                      <TableCell>Montant total</TableCell>
                      <TableCell>Montant payé</TableCell>
                      <TableCell>Reste à payer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientReport.rentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          {format(new Date(rental.startDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(rental.endDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {rental.vehicleBrand} {rental.vehicleModel}
                        </TableCell>
                        <TableCell>{rental.totalCost}€</TableCell>
                        <TableCell>{rental.paidAmount}€</TableCell>
                        <TableCell>
                          {rental.totalCost - rental.paidAmount}€
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <AddCustomerDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          setOpenAddDialog(false);
          fetchClients();
        }}
      />
    </Box>
  );
};

export default ClientList;
