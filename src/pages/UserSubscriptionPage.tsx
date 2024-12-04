import React from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import UserSubscriptionStatus from '../components/subscription/UserSubscriptionStatus';

const UserSubscriptionPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Mon Abonnement</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          Mon Abonnement
        </Typography>
        
        <UserSubscriptionStatus />
      </Box>
    </Container>
  );
};

export default UserSubscriptionPage;
