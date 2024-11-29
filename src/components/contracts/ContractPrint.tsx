import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  styled,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { Contract } from '../../types/contract';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PrintContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  '@media print': {
    margin: 0,
    padding: '20px',
    boxShadow: 'none',
  },
}));

const PrintButton = styled(Button)(({ theme }) => ({
  '@media print': {
    display: 'none',
  },
}));

interface ContractPrintProps {
  contract: Contract;
}

const ContractPrint: React.FC<ContractPrintProps> = ({ contract }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <PrintButton
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        sx={{ mb: 2 }}
      >
        Imprimer le contrat
      </PrintButton>

      <PrintContainer>
        <Typography variant="h4" align="center" gutterBottom>
          CONTRAT DE LOCATION DE VÉHICULE
        </Typography>

        <Typography variant="subtitle1" align="center" gutterBottom>
          N° {contract.id}
        </Typography>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Entre les soussignés :
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>LE BAILLEUR</strong>
              </Typography>
              <Typography>Nom : {contract.lessor.name}</Typography>
              <Typography>Adresse : {contract.lessor.address}</Typography>
              <Typography>Téléphone : {contract.lessor.phone}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>LE LOCATAIRE</strong>
              </Typography>
              <Typography>Nom : {contract.tenant.name}</Typography>
              <Typography>Adresse : {contract.tenant.address}</Typography>
              <Typography>Téléphone : {contract.tenant.phone}</Typography>
              <Typography>Permis de conduire : {contract.tenant.drivingLicense}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Article 1 : Objet du contrat
        </Typography>
        <Typography paragraph>
          Le présent contrat a pour objet la location du véhicule suivant :
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>
              Marque et Modèle : {contract.vehicle.brand} {contract.vehicle.model}
            </Typography>
            <Typography>
              Année : {contract.vehicle.year}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              Immatriculation : {contract.vehicle.registration}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Article 2 : Durée de la location
        </Typography>
        <Typography paragraph>
          La location est consentie pour une durée déterminée :
        </Typography>
        <Typography>
          Du : {formatDate(contract.rental.startDate)}
        </Typography>
        <Typography>
          Au : {formatDate(contract.rental.endDate)}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Article 3 : Conditions financières
        </Typography>
        <Typography>
          Montant total de la location : {formatCurrency(contract.rental.totalCost)}
        </Typography>
        <Typography>
          Dépôt de garantie : {formatCurrency(contract.rental.deposit)}
        </Typography>
        <Typography>
          Mode de paiement : {
            {
              cash: 'Espèces',
              bank_transfer: 'Virement bancaire',
              other: 'Autre'
            }[contract.rental.paymentMethod]
          }
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Article 4 : Obligations du locataire
        </Typography>
        <Typography paragraph>
          Le locataire s'engage à :
        </Typography>
        <ul>
          <li>Utiliser le véhicule en bon père de famille</li>
          <li>Ne pas effectuer de modification sur le véhicule</li>
          <li>Respecter le code de la route</li>
          <li>Restituer le véhicule dans l'état de la prise en charge</li>
          <li>Prendre en charge les frais de carburant</li>
        </ul>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Fait à {contract.wilaya}
          </Typography>
          <Typography>
            Le {formatDate(contract.createdAt)}
          </Typography>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={6}>
              <Typography gutterBottom>Le Bailleur</Typography>
              <Box sx={{ mt: 8 }}>
                <Typography>Signature :</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography gutterBottom>Le Locataire</Typography>
              <Box sx={{ mt: 8 }}>
                <Typography>Signature :</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PrintContainer>
    </Box>
  );
};

export default ContractPrint;
