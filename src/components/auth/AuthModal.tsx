import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  useTheme,
  styled,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
} from '@mui/icons-material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    padding: theme.spacing(3),
    maxWidth: 400,
    width: '100%',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#F7F9FC',
    height: 48,
    '&:hover': {
      backgroundColor: '#EFF3FA',
    },
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: 'transparent',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: '#6B7280',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '14px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  backgroundColor: '#18181B',
  color: '#FFFFFF',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#000000',
    boxShadow: 'none',
  },
}));

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
  selectedPlan?: 'basic' | 'pro' | 'enterprise';
  billingPeriod?: 'monthly' | 'annual';
}

const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  initialTab = 'login',
  selectedPlan,
  billingPeriod,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      onClose();
      if (selectedPlan) {
        navigate('/dashboard', { state: { selectedPlan, billingPeriod } });
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError('Email ou mot de passe incorrect');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      
      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: signupEmail,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        company: company,
        address: address,
        createdAt: new Date(),
        isAdmin: false,
        subscription: {
          status: 'pending',
          createdAt: new Date()
        }
      });

      onClose();
      
      // Attendre que Firebase confirme l'authentification
      setTimeout(() => {
        navigate('/subscription/plans');
      }, 1000);
    } catch (error: any) {
      setError("Erreur lors de l'inscription. Vérifiez vos informations.");
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ position: 'relative', p: 2 }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#18181B' }}>
            {initialTab === 'login' ? 'Connexion par email' : 'Créer un compte'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {initialTab === 'login' 
              ? 'Ravi de vous revoir ! Veuillez saisir vos identifiants.'
              : 'Créez un nouveau compte pour gérer votre flotte'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContent sx={{ p: 0 }}>
          {initialTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <StyledTextField
                fullWidth
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <StyledTextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Button
                  color="primary"
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    color: theme.palette.primary.main
                  }}
                >
                  Mot de passe oublié ?
                </Button>
              </Box>
              <StyledButton
                fullWidth
                type="submit"
              >
                Se connecter
              </StyledButton>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <StyledTextField
                  fullWidth
                  label="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <StyledTextField
                  fullWidth
                  label="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Box>
              <StyledTextField
                fullWidth
                label="Email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
              <StyledTextField
                fullWidth
                label="Téléphone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <StyledTextField
                fullWidth
                label="Entreprise"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <StyledTextField
                fullWidth
                label="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <StyledTextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <StyledTextField
                fullWidth
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
              />
              <StyledButton
                fullWidth
                type="submit"
              >
                Créer le compte
              </StyledButton>
            </form>
          )}
        </DialogContent>
      </Box>
    </StyledDialog>
  );
};

export default AuthModal;
