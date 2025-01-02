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
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { setupTwoFactor, verifyTwoFactorToken } from '../../services/twoFactorService';
import { useAuth } from '../../contexts/AuthContext';

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; backupCodes: string[] } | null>(null);

  const handleSetup = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await setupTwoFactor(currentUser.uid);
      setSetupData(result);
      setStep('verify');
    } catch (error) {
      setError('Erreur lors de la configuration de la 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyTwoFactorToken(currentUser.uid, verificationCode);
      if (isValid) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Code invalide. Veuillez réessayer.');
      }
    } catch (error) {
      setError('Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Configuration de la double authentification
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Double authentification activée avec succès !
          </Alert>
        )}
        
        {step === 'setup' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" gutterBottom>
              La double authentification ajoute une couche de sécurité supplémentaire à votre compte.
            </Typography>
            <Button
              variant="contained"
              onClick={handleSetup}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Configurer la 2FA'}
            </Button>
          </Box>
        )}
        
        {step === 'verify' && setupData && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              1. Notez votre code de vérification :
            </Typography>
            
            <Box sx={{ 
              my: 2, 
              p: 2, 
              bgcolor: 'background.paper',
              borderRadius: 1,
              textAlign: 'center'
            }}>
              <Typography variant="h4" component="div" sx={{ letterSpacing: 3 }}>
                {setupData.secret}
              </Typography>
            </Box>
            
            <Typography variant="body1" gutterBottom sx={{ mt: 3 }}>
              2. Codes de secours (à conserver en lieu sûr) :
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {setupData.backupCodes.map((code, index) => (
                <React.Fragment key={code}>
                  <ListItem>
                    <ListItemText 
                      primary={code}
                      secondary={`Code de secours ${index + 1}`}
                    />
                  </ListItem>
                  {index < setupData.backupCodes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            
            <Typography variant="body1" gutterBottom sx={{ mt: 3 }}>
              3. Entrez le code de vérification pour activer la 2FA :
            </Typography>
            
            <TextField
              fullWidth
              label="Code de vérification"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 6 }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        {step === 'verify' && (
          <Button
            onClick={handleVerify}
            disabled={loading || verificationCode.length !== 6}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Vérifier'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetup;
