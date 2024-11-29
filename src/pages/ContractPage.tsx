import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ContractPrint from '../components/contracts/ContractPrint';
import { getContract } from '../services/contractService';
import { Contract } from '../types/contract';

const ContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      if (id) {
        try {
          const contractData = await getContract(id);
          setContract(contractData);
        } catch (error) {
          console.error('Error loading contract:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadContract();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        Contrat non trouvé
      </Box>
    );
  }

  return <ContractPrint contract={contract} />;
};

export default ContractPage;
