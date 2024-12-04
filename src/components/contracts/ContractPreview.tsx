import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Divider,
  Box,
  styled,
  CircularProgress,
  Button,
  useTheme,
  Container,
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Vehicle } from '../../models/Vehicle';
import { ContractFormData } from './ContractForm';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const PrintableContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  backgroundColor: '#fff',
  '@media print': {
    margin: 0,
    padding: 0,
  }
}));

const PrintableContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  '@media print': {
    boxShadow: 'none',
    padding: '0 !important',
  }
}));

const PrintButton = styled(Button)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  '@media print': {
    display: 'none',
  }
}));

const ContractHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  '& h4': {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
}));

interface ContractPreviewProps {
  formData?: ContractFormData;
  vehicle?: Vehicle | null;
}

const ContractPreview: React.FC<ContractPreviewProps> = ({ formData: propFormData, vehicle: propVehicle }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ContractFormData | null>(propFormData || null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(propVehicle || null);
  const theme = useTheme();
  const navigate = useNavigate();
  const isPrintMode = new URLSearchParams(window.location.search).get('print') === 'true';

  useEffect(() => {
    if (isPrintMode) {
      // Attendre que le contenu soit chargé
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isPrintMode]);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const contractDoc = await getDoc(doc(db, 'contracts', id));
          if (contractDoc.exists()) {
            const data = contractDoc.data();
            const convertedData = {
              ...data,
              startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
              endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
            } as ContractFormData;
            
            setFormData(convertedData);
            
            const vehicleId = data.vehicleId;
            if (vehicleId) {
              const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
              if (vehicleDoc.exists()) {
                setVehicle(vehicleDoc.data() as Vehicle);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching contract data:', error);
        }
      }
      setLoading(false);
    };

    if (!propFormData && id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, propFormData]);

  useEffect(() => {
    if (searchParams.get('print') === 'true') {
      window.print();
    }
  }, [searchParams]);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    try {
      return format(date instanceof Date ? date : new Date(date), 'PPP à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/contracts');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!formData || !vehicle) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          Contrat ou véhicule non trouvé
        </Typography>
      </Box>
    );
  }

  const calculateTotalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = formData.startDate instanceof Date ? formData.startDate : new Date(formData.startDate);
    const end = formData.endDate instanceof Date ? formData.endDate : new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!vehicle) return 0;
    const days = calculateTotalDays();
    const basePrice = vehicle.dailyRate * days;
    const discountAmount = (basePrice * formData.discount) / 100;
    const driverPrice = formData.withDriver ? formData.driverPrice * days : 0;
    return basePrice - discountAmount + driverPrice;
  };

  return (
    <Box>
      {!isPrintMode && (
        <Box className="no-print" sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
          >
            Retour à la liste
          </Button>
        </Box>
      )}
      
      <Box className="print-content">
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white' }}>
          <Typography variant="h4" align="center" gutterBottom>
            CONTRAT DE LOCATION
          </Typography>
          
          <Typography variant="subtitle1" color="textSecondary" gutterBottom align="center">
            N° {id?.slice(-6).toUpperCase()}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              1. INFORMATIONS CLIENT
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Nom complet:</strong> {formData.clientName}</Typography>
                <Typography variant="body1"><strong>Adresse:</strong> {formData.clientAddress}</Typography>
                <Typography variant="body1"><strong>Téléphone:</strong> {formData.clientPhone}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Email:</strong> {formData.clientEmail}</Typography>
                <Typography variant="body1"><strong>N° Permis:</strong> {formData.driverLicense}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              2. INFORMATIONS VÉHICULE
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Marque:</strong> {vehicle.brand}</Typography>
                <Typography variant="body1"><strong>Modèle:</strong> {vehicle.model}</Typography>
                <Typography variant="body1"><strong>Immatriculation:</strong> {vehicle.licensePlate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1"><strong>Année:</strong> {vehicle.year}</Typography>
                <Typography variant="body1"><strong>Kilométrage:</strong> {vehicle.mileage} km</Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Avec chauffeur:</strong> {formData.withDriver ? 'Oui' : 'Non'}
                  {formData.withDriver && (
                    <span> - {formData.driverPrice.toLocaleString()} DA/jour</span>
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              3. DÉTAILS DE LA LOCATION
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Date de début:</strong> {formatDate(formData.startDate)}
                </Typography>
                <Typography variant="body1">
                  <strong>Date de fin:</strong> {formatDate(formData.endDate)}
                </Typography>
                <Typography variant="body1">
                  <strong>Durée:</strong> {calculateTotalDays()} jours
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Tarif journalier:</strong> {vehicle?.dailyRate?.toLocaleString('fr-FR')} DA
                </Typography>
                <Typography variant="body1">
                  <strong>Remise:</strong> {formData.discount}%
                </Typography>
                <Typography variant="body1">
                  <strong>Caution:</strong> {(formData.deposit || 0).toLocaleString('fr-FR')} DA
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box mt={3} p={2} sx={{ backgroundColor: theme.palette.primary.main, color: 'white', borderRadius: 1 }}>
            <Typography variant="h5" align="center">
              TOTAL: {calculateTotal().toLocaleString('fr-FR')} DA
            </Typography>
          </Box>

          {formData.additionalNotes && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
                4. NOTES ADDITIONNELLES
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {formData.additionalNotes}
              </Typography>
            </Box>
          )}

          <Box mt={6}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography variant="body1" gutterBottom>Signature du client:</Typography>
                <Box sx={{ mt: 4, borderTop: '1px solid #000', width: '80%' }}></Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" gutterBottom>Signature de l'agence:</Typography>
                <Box sx={{ mt: 4, borderTop: '1px solid #000', width: '80%' }}></Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={4} pt={2} sx={{ borderTop: '1px dashed #ccc' }}>
            <Typography variant="caption" color="textSecondary">
              Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {!isPrintMode && (
        <Button
          className="no-print"
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
          }}
        >
          Imprimer
        </Button>
      )}
    </Box>
  );
};

export default ContractPreview;
