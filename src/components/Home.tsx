import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ResetDatabase from './admin/ResetDatabase';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <DirectionsCarIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Gestion de Location de Voitures
        </Typography>
        
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Bienvenue dans votre application de gestion de location de voitures.
          Gérez facilement votre flotte, vos clients et vos locations.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/dashboard')}
        >
          Accéder au tableau de bord
        </Button>

        <Box sx={{ mt: 4 }}>
          <ResetDatabase />
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
