import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  CardActions,
  Tooltip,
  Chip,
  Link,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import MaintenanceModal from './modals/MaintenanceModal';
import MileageModal from './modals/MileageModal';
import InsuranceModal from './modals/InsuranceModal';
import ReceiptModal from './modals/ReceiptModal';
import ConditionModal from './modals/ConditionModal';
import { VehicleTracking as IVehicleTracking, Maintenance, Condition, DamagePoint } from '../../types/vehicleTracking';
import { Vehicle } from '../../types/index';
import { getVehicleTracking, deleteMaintenance, addCondition, deleteCondition, deleteMileage } from '../../services/vehicleTrackingService';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  const uniqueId = `vehicle-tabpanel-${index}`;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={uniqueId}
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
};

const a11yProps = (index: number) => {
  return {
    id: `vehicle-tab-${index}`,
    'aria-controls': `vehicle-tabpanel-${index}`,
  };
};

const VehicleTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [openMaintenanceModal, setOpenMaintenanceModal] = useState(false);
  const [openMileageModal, setOpenMileageModal] = useState(false);
  const [openInsuranceModal, setOpenInsuranceModal] = useState(false);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [openConditionModal, setOpenConditionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleData, setVehicleData] = useState<IVehicleTracking | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [selectedMileage, setSelectedMileage] = useState<any>(null);
  const [baseMileage, setBaseMileage] = useState(0);
  const [totalMileage, setTotalMileage] = useState(0);
  const conditionsRef = useRef<HTMLDivElement>(null);
  const damagePointsRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date | string | number | { seconds: number, nanoseconds: number } | undefined) => {
    if (!date) return 'Non spécifiée';
    
    try {
      let parsedDate: Date;
      
      if (typeof date === 'object' && 'seconds' in date) {
        // Gestion des Timestamp Firestore
        parsedDate = new Date(date.seconds * 1000);
      } else if (typeof date === 'string') {
        parsedDate = new Date(date);
      } else if (typeof date === 'number') {
        parsedDate = new Date(date);
      } else {
        parsedDate = date as Date;
      }

      if (isValid(parsedDate)) {
        return format(parsedDate, 'dd/MM/yyyy', { locale: fr });
      }
      
      console.warn('Date invalide:', date);
      return 'Date invalide';
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, date);
      return 'Date invalide';
    }
  };

  const getDocumentUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://car-manager-server.onrender.com${path}`;
  };

  const renderDocument = (path: string) => {
    const url = getDocumentUrl(path);
    const fileName = path.split('/').pop() || 'Document';
    return (
      <Box key={path} sx={{ mt: 1 }}>
        <Button
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          variant="text"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          {fileName}
        </Button>
      </Box>
    );
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    console.warn('Failed to load image:', img.src);
  };

  const checkId = (id: string | undefined): id is string => {
    if (!id) {
      setError('ID du véhicule non spécifié');
      setLoading(false);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('VehicleTracking - Fetching data for ID:', id);
        if (!checkId(id)) return;

        // Fetch vehicle data
        const vehicleRef = doc(db, 'vehicles', id);
        const vehicleDoc = await getDoc(vehicleRef);
        if (!vehicleDoc.exists()) {
          console.error('VehicleTracking - Vehicle not found:', id);
          setError('Véhicule non trouvé');
          setLoading(false);
          return;
        }
        console.log('VehicleTracking - Vehicle data loaded:', vehicleDoc.data());
        setVehicle(vehicleDoc.data() as Vehicle);

        // Fetch tracking data
        const trackingData = await getVehicleTracking(id);
        if (!trackingData) {
          console.error('VehicleTracking - No tracking data found for vehicle:', id);
          setError('Données de suivi non trouvées');
          setLoading(false);
          return;
        }
        console.log('VehicleTracking - Tracking data loaded:', trackingData);
        setVehicleData(trackingData);
        setLoading(false);
      } catch (error) {
        console.error('VehicleTracking - Error fetching data:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    let isSubscribed = true;

    if (vehicle && vehicleData && isSubscribed) {
      const initialMileage = vehicle.baseMileage || 0;
      setBaseMileage(initialMileage);

      // Calculer la somme des relevés
      const mileageSum = vehicleData.mileages?.reduce((sum, mileage) => sum + (mileage.value || 0), 0) || 0;
      
      // Kilométrage total = kilométrage initial + somme des relevés
      setTotalMileage(initialMileage + mileageSum);
    }

    return () => {
      isSubscribed = false;
    };
  }, [vehicle, vehicleData]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleMaintenanceModalOpen = (maintenance?: Maintenance) => {
    setSelectedMaintenance(maintenance || null);
    setOpenMaintenanceModal(true);
  };

  const handleMaintenanceModalClose = () => {
    setSelectedMaintenance(null);
    setOpenMaintenanceModal(false);
  };

  const handleDeleteMaintenance = async (maintenanceId: string) => {
    if (!checkId(id)) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) {
      try {
        await deleteMaintenance(id, maintenanceId);
        await getVehicleTracking(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleAddCondition = async (condition: Omit<Condition, 'id'>) => {
    if (!checkId(id)) return;
    
    try {
      await addCondition(id, condition);
      setOpenConditionModal(false);
      await getVehicleTracking(id);
    } catch (error) {
      console.error('Error adding condition:', error);
      alert('Erreur lors de l\'ajout du constat');
    }
  };

  const handleDeleteCondition = async (conditionId: string) => {
    if (!checkId(id)) return;
    
    try {
      await deleteCondition(id, conditionId);
      await getVehicleTracking(id);
    } catch (error) {
      console.error('Error deleting condition:', error);
      alert('Erreur lors de la suppression du constat');
    }
  };

  const handleDeleteMileage = async (mileageId: string) => {
    if (!checkId(id)) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce relevé ?')) {
      try {
        await deleteMileage(id, mileageId);
        setTimeout(() => {
          if (id) getVehicleTracking(id);
        }, 500);
      } catch (error) {
        console.error('Error deleting mileage:', error);
        alert('Erreur lors de la suppression du relevé');
      }
    }
  };

  const generateConditionsPDF = async () => {
    if (!conditionsRef.current || !vehicleData?.conditions?.length) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Ajouter des styles personnalisés
    const addStyles = () => {
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(245, 245, 245);
    };

    // Fonction pour ajouter un en-tête stylisé
    const addHeader = (text: string, y: number) => {
      pdf.setFillColor(51, 51, 51);
      pdf.rect(margin, y - 6, contentWidth, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text(text, pageWidth / 2, y, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      return y + 10;
    };

    // Fonction pour ajouter une section avec un fond
    const addSection = (text: string, y: number) => {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y - 4, contentWidth, 8, 'F');
      pdf.setFontSize(12);
      pdf.text(text, margin + 2, y);
      return y + 8;
    };

    for (const condition of vehicleData.conditions) {
      // En-tête du constat
      let yPosition = addHeader(`Constat du ${formatDate(condition.date)}`, 20);
      yPosition += 10;

      // Informations principales
      pdf.setFontSize(11);
      pdf.setTextColor(51, 51, 51);
      
      // Section Gravité
      const severityColor = condition.severity === 'grave' 
        ? '#dc3545' 
        : condition.severity === 'moyen' 
        ? '#ffc107' 
        : '#28a745';
      pdf.setTextColor(51, 51, 51);
      pdf.text('Gravité:', margin, yPosition);
      pdf.setTextColor(severityColor);
      pdf.text(condition.severity.toUpperCase(), margin + 20, yPosition);
      yPosition += 8;

      // État
      pdf.setTextColor(51, 51, 51);
      pdf.text('État:', margin, yPosition);
      pdf.setTextColor(condition.repaired ? '#28a745' : '#dc3545');
      pdf.text(condition.repaired ? 'Réparé' : 'Non réparé', margin + 20, yPosition);
      yPosition += 8;

      // Description
      if (condition.description) {
        yPosition = addSection('Description', yPosition + 5);
        pdf.setTextColor(51, 51, 51);
        const splitDescription = pdf.splitTextToSize(condition.description, contentWidth - 4);
        pdf.text(splitDescription, margin + 2, yPosition + 5);
        yPosition += splitDescription.length * 6 + 8;
      }

      // Coût
      if (condition.cost) {
        yPosition = addSection('Coût de réparation', yPosition + 5);
        pdf.text(`${condition.cost.toLocaleString()} DA`, margin + 2, yPosition + 5);
        yPosition += 12;
      }

      // Points d'impact
      if (condition.damagePoints && Object.keys(condition.damagePoints).length > 0) {
        yPosition = addSection('Points d\'impact', yPosition + 5);
        yPosition += 5;

        for (const [view, points] of Object.entries(condition.damagePoints)) {
          if (points.length > 0) {
            const tempDiv = document.createElement('div');
            tempDiv.style.width = '1200px'; // Augmenter considérablement la taille pour une meilleure qualité
            tempDiv.style.height = '900px';
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '-9999px';
            tempDiv.style.backgroundColor = 'white';
            document.body.appendChild(tempDiv);

            const carImage = document.createElement('img');
            carImage.src = `/car-views/${view}.png`;
            carImage.style.width = '100%';
            carImage.style.height = '100%';
            carImage.style.objectFit = 'contain';
            carImage.crossOrigin = 'anonymous';
            
            await new Promise((resolve) => {
              carImage.onload = resolve;
              carImage.onerror = () => {
                console.error(`Erreur lors du chargement de l'image: ${carImage.src}`);
                resolve(null);
              };
            });

            tempDiv.appendChild(carImage);

            const pointsContainer = document.createElement('div');
            pointsContainer.style.position = 'absolute';
            pointsContainer.style.top = '0';
            pointsContainer.style.left = '0';
            pointsContainer.style.width = '100%';
            pointsContainer.style.height = '100%';
            tempDiv.appendChild(pointsContainer);

            points.forEach((point: DamagePoint) => {
              const damagePoint = document.createElement('div');
              damagePoint.style.position = 'absolute';
              damagePoint.style.width = '30px'; // Points plus grands pour la haute résolution
              damagePoint.style.height = '30px';
              damagePoint.style.borderRadius = '50%';
              damagePoint.style.backgroundColor = point.color || 'red';
              damagePoint.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)'; // Ombre plus prononcée
              damagePoint.style.border = '2px solid white'; // Bordure blanche
              damagePoint.style.left = `${point.x * 100}%`;
              damagePoint.style.top = `${point.y * 100}%`;
              pointsContainer.appendChild(damagePoint);
            });

            try {
              if (yPosition + 120 > pageHeight - margin) {
                pdf.addPage();
                yPosition = 20;
              }

              // Titre de la vue avec style
              yPosition = addSection(`Vue ${view}`, yPosition);
              yPosition += 5;

              const canvas = await html2canvas(tempDiv, {
                backgroundColor: 'white',
                scale: 4, // Augmenter la résolution
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 0
              });

              const imgData = canvas.toDataURL('image/png', 1.0);

              // Calculer les dimensions pour un meilleur ratio
              const imgRatio = canvas.width / canvas.height;
              const maxWidth = contentWidth;
              const maxHeight = 120; // Augmenter la hauteur maximale
              let imgWidth = maxWidth;
              let imgHeight = imgWidth / imgRatio;

              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * imgRatio;
              }

              // Centrer l'image
              const xOffset = margin + (contentWidth - imgWidth) / 2;

              pdf.addImage(
                imgData,
                'PNG',
                xOffset,
                yPosition,
                imgWidth,
                imgHeight,
                undefined,
                'MEDIUM' // Qualité moyenne pour un bon compromis
              );
              yPosition += imgHeight + 15; // Ajouter plus d'espace après l'image
            } catch (error) {
              console.error('Erreur lors de la capture des points d\'impact:', error);
            } finally {
              document.body.removeChild(tempDiv);
            }
          }
        }
      }

      // Ajouter une nouvelle page pour le prochain constat
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
      } else {
        // Ajouter une ligne de séparation entre les constats
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 20;
      }
    }

    // Sauvegarder le PDF
    pdf.save(`constats_vehicule_${id}.pdf`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/vehicles')}
          startIcon={<ArrowBackIcon />}
        >
          Retour à la liste des véhicules
        </Button>
      </Box>
    );
  }

  if (!vehicleData || !vehicle) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <Typography variant="h6" color="textSecondary">
          Aucune donnée disponible pour ce véhicule
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/vehicles')}
          startIcon={<ArrowBackIcon />}
        >
          Retour à la liste des véhicules
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 2 }}>
        <Typography variant="h5" component="h1">
          Suivi du véhicule
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/vehicles')}
        >
          Retour aux véhicules
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="vehicle tracking tabs">
          <Tab label="Kilométrage" {...a11yProps(0)} />
          <Tab label="Entretiens" {...a11yProps(1)} />
          <Tab label="Assurance" {...a11yProps(2)} />
          <Tab label="État du véhicule" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Box sx={{ mb: 4 }}>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Vue d'ensemble du kilométrage
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Kilométrage initial
                      </Typography>
                      <Typography variant="h5">
                        {baseMileage.toLocaleString()} km
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Kilométrage total
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {totalMileage.toLocaleString()} km
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenMileageModal(true)}
                sx={{ ml: 1, mb: 1 }}
              >
                Ajouter un relevé
              </Button>
            </CardActions>
          </Card>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Historique des relevés
          </Typography>
          <Grid container spacing={2}>
            {vehicleData?.mileages && vehicleData.mileages.length > 0 ? (
              vehicleData.mileages
                .sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  return dateB - dateA;
                })
                .map((mileage, index) => (
                  <Grid item xs={12} sm={6} md={4} key={mileage.id || index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary">
                              Date du relevé
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {formatDate(mileage.date)}
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary">
                              Valeur
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {mileage.value?.toLocaleString()} km
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              console.log('Deleting mileage with ID:', mileage.id); // Pour le debug
                              handleDeleteMileage(mileage.id);
                            }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        {mileage.notes && (
                          <>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                              Notes
                            </Typography>
                            <Typography variant="body2">
                              {mileage.notes}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" color="textSecondary" align="center">
                    Aucun relevé disponible
                  </Typography>
                </Grid>
              )}
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Button
          variant="contained"
          onClick={() => setOpenMaintenanceModal(true)}
          sx={{ mb: 2 }}
        >
          Ajouter une maintenance
        </Button>
        <Timeline>
          {vehicleData?.maintenances?.map((maintenance) => (
            <TimelineItem key={maintenance.id}>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {maintenance.type.charAt(0).toUpperCase() + maintenance.type.slice(1)}
                      </Typography>
                      <Box>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => handleMaintenanceModalOpen(maintenance)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteMaintenance(maintenance.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Date: {formatDate(maintenance.date)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Description: {maintenance.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Coût: {maintenance.cost} DA
                    </Typography>
                    {maintenance.garage && (
                      <Typography variant="body2" color="textSecondary">
                        Garage: {maintenance.garage}
                      </Typography>
                    )}
                    {maintenance.nextMaintenanceKm && (
                      <Typography variant="body2" color="textSecondary">
                        Prochain entretien: {maintenance.nextMaintenanceKm} km
                      </Typography>
                    )}
                    {maintenance.nextMaintenanceDate && (
                      <Typography variant="body2" color="textSecondary">
                        Prochaine maintenance: {formatDate(maintenance.nextMaintenanceDate)}
                      </Typography>
                    )}
                    {maintenance.documents && maintenance.documents.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Documents :
                        </Typography>
                        {maintenance.documents.map((doc) => renderDocument(doc))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </TabPanel>

      <TabPanel value={value} index={2}>
        <Button
          variant="contained"
          onClick={() => setOpenInsuranceModal(true)}
          sx={{ mb: 2 }}
        >
          Ajouter une assurance
        </Button>
        <Grid container spacing={2}>
          {vehicleData?.insurances?.map((insurance) => (
            <Grid item xs={12} md={6} key={insurance.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{insurance.company}</Typography>
                  <Typography color="text.secondary">
                    Du {formatDate(insurance.startDate)} au{' '}
                    {formatDate(insurance.endDate)}
                  </Typography>
                  <Typography>Type: {insurance.type}</Typography>
                  <Typography>N° Police: {insurance.policyNumber}</Typography>
                  <Typography>Coût: {insurance.cost} DA</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenConditionModal(true)}
          >
            Ajouter un constat
          </Button>
          {vehicleData?.conditions && vehicleData.conditions.length > 0 && (
            <Button
              variant="outlined"
              onClick={generateConditionsPDF}
              startIcon={<PictureAsPdfIcon />}
            >
              Télécharger PDF
            </Button>
          )}
        </Box>
        <div ref={conditionsRef}>
          {vehicleData?.conditions && vehicleData.conditions.length > 0 ? (
            <Grid container spacing={2}>
              {vehicleData.conditions.map((condition) => (
                <Grid item xs={12} md={6} key={condition.id}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      borderLeft: 6,
                      borderColor: condition.severity === 'grave' 
                        ? 'error.main'
                        : condition.severity === 'moyen'
                        ? 'warning.main'
                        : 'success.main'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Constat du {formatDate(condition.date)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                backgroundColor: condition.severity === 'grave'
                                  ? 'error.light'
                                  : condition.severity === 'moyen'
                                  ? 'warning.light'
                                  : 'success.light',
                                color: condition.severity === 'grave'
                                  ? 'error.dark'
                                  : condition.severity === 'moyen'
                                  ? 'warning.dark'
                                  : 'success.dark',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block'
                              }}
                            >
                              Gravité: {condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}
                            </Typography>
                            {condition.repaired && (
                              <Chip 
                                label="Réparé" 
                                color="success" 
                                size="small" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCondition(condition.id)}
                          color="error"
                          sx={{ mt: -1, mr: -1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Typography variant="body1" paragraph>
                        {condition.description}
                      </Typography>

                      {typeof condition.cost === 'number' && condition.cost > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Coût de réparation: {condition.cost.toLocaleString()} DA
                        </Typography>
                      )}

                      {condition.photos && condition.photos.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Photos
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {condition.photos.map((photo, index) => (
                              <Box
                                key={index}
                                component="img"
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                sx={{
                                  width: 100,
                                  height: 100,
                                  objectFit: 'cover',
                                  borderRadius: 1
                                }}
                                onError={handleImageError}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {condition.damagePoints && Object.entries(condition.damagePoints).some(([_, points]) => points && points.length > 0) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Points de dommages
                          </Typography>
                          {Object.entries(condition.damagePoints).map(([view, points]) => (
                            points && points.length > 0 && (
                              <Box key={view} sx={{ mb: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  Vue {view} ({points.length} point{points.length > 1 ? 's' : ''})
                                </Typography>
                              </Box>
                            )
                          ))}
                        </Box>
                      )}

                      {condition.documents && condition.documents.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Documents
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {condition.documents.map((doc, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Link
                                  href={getDocumentUrl(doc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                  <InsertDriveFileIcon fontSize="small" />
                                  Document {index + 1}
                                </Link>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="textSecondary">
                Aucun constat n'a été ajouté pour ce véhicule.
              </Typography>
            </Box>
          )}
        </div>
      </TabPanel>

      {id && (
        <>
          <MaintenanceModal
            open={openMaintenanceModal}
            onClose={handleMaintenanceModalClose}
            vehicleId={id}
            maintenance={selectedMaintenance}
            onSuccess={() => {
              handleMaintenanceModalClose();
              getVehicleTracking(id);
            }}
          />
          <MileageModal
            open={openMileageModal}
            onClose={() => setOpenMileageModal(false)}
            vehicleId={id}
            onSuccess={() => {
              setOpenMileageModal(false);
              getVehicleTracking(id);
            }}
            currentMileage={totalMileage}
          />
          <InsuranceModal
            open={openInsuranceModal}
            onClose={() => setOpenInsuranceModal(false)}
            vehicleId={id}
            onSuccess={() => {
              setOpenInsuranceModal(false);
              getVehicleTracking(id);
            }}
          />
          <ReceiptModal
            open={openReceiptModal}
            onClose={() => setOpenReceiptModal(false)}
            vehicleId={id}
            onSuccess={() => {
              setOpenReceiptModal(false);
              getVehicleTracking(id);
            }}
          />
          <ConditionModal
            open={openConditionModal}
            onClose={() => setOpenConditionModal(false)}
            onSave={handleAddCondition}
          />
        </>
      )}
    </Box>
  );
};

export default VehicleTracking;
