import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Contract } from '../../types';
import { getContract } from '../../services/contractService';
import { formatDate, formatCurrency } from '../../utils/formatters';

const ContractView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      if (!id) return;
      try {
        const contractData = await getContract(id);
        setContract(contractData);
      } catch (error) {
        console.error('Error loading contract:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box p={3}>
        <Typography>Contrat non trouvé</Typography>
      </Box>
    );
  }

  return (
    <Box component={Paper} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Détails du Contrat
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Informations du Bailleur
          </Typography>
          <Typography>Nom : {contract.lessor.name}</Typography>
          <Typography>Adresse : {contract.lessor.address}</Typography>
          <Typography>Téléphone : {contract.lessor.phone}</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Informations du Locataire
          </Typography>
          <Typography>Nom : {contract.tenant.name}</Typography>
          <Typography>Adresse : {contract.tenant.address}</Typography>
          <Typography>Téléphone : {contract.tenant.phone}</Typography>
          <Typography>Permis de conduire : {contract.tenant.drivingLicense}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Informations du Véhicule
          </Typography>
          <Typography>
            Marque et Modèle : {contract.vehicle.brand} {contract.vehicle.model}
          </Typography>
          <Typography>Année : {contract.vehicle.year}</Typography>
          <Typography>Immatriculation : {contract.vehicle.registration}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Détails de la Location
          </Typography>
          <Typography>Date de début : {formatDate(contract.rental.startDate)}</Typography>
          <Typography>Date de fin : {formatDate(contract.rental.endDate)}</Typography>
          <Typography>Coût total : {formatCurrency(contract.rental.totalCost)}</Typography>
          <Typography>Caution : {formatCurrency(contract.rental.deposit)}</Typography>
          <Typography>
            Mode de paiement : {
              contract.rental.paymentMethod === 'cash' ? 'Espèces' :
              contract.rental.paymentMethod === 'bank_transfer' ? 'Virement bancaire' :
              'Autre'
            }
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Conditions
          </Typography>
          {contract.terms.map((term, index) => (
            <Typography key={index} paragraph>
              {term}
            </Typography>
          ))}
        </Grid>

        <Grid item xs={12}>
          <Typography>Wilaya : {contract.wilaya}</Typography>
          <Typography>
            Date de création : {contract.createdAt ? formatDate(contract.createdAt) : 'Non spécifié'}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractView;
