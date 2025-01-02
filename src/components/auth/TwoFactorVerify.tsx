import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import { verifyTwoFactorToken, generateNewVerificationCode } from '../../services/twoFactorService';
import { RefreshRounded as RefreshIcon } from '@mui/icons-material';

interface TwoFactorVerifyProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  userId: string;
}

const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  open,
  onClose,
  onVerified,
  userId
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const isValid = await verifyTwoFactorToken(userId, verificationCode);
      if (isValid) {
        onVerified();
      } else {
        setError('Code invalide. Veuillez réessayer.');
      }
    } catch (error) {
      setError('Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    setRegeneratingCode(true);
    setError(null);

    try {
      await generateNewVerificationCode(userId);
      setVerificationCode('');
      setError('Un nouveau code a été généré. Veuillez vérifier vos notifications.');
    } catch (error) {
      setError('Erreur lors de la génération du nouveau code');
    } finally {
      setRegeneratingCode(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Vérification en deux étapes
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert 
            severity={error.includes('nouveau code') ? 'success' : 'error'} 
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            {showBackupCode 
              ? 'Entrez un de vos codes de secours :'
              : 'Entrez le code de vérification à 6 chiffres :'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              label={showBackupCode ? "Code de secours" : "Code de vérification"}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
              autoFocus
            />
            {!showBackupCode && (
              <IconButton 
                onClick={handleRegenerateCode} 
                disabled={regeneratingCode}
                sx={{ ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            )}
          </Box>

          <Button
            variant="text"
            onClick={() => setShowBackupCode(!showBackupCode)}
            sx={{ mt: 2 }}
          >
            {showBackupCode 
              ? 'Utiliser le code de vérification'
              : 'Utiliser un code de secours'}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          variant="contained"
        >
          {loading ? <CircularProgress size={24} /> : 'Vérifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorVerify;
