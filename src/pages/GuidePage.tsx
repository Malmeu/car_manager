import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import GuideCard, { GuideArticle } from '../components/guides/GuideCard';

const guides: GuideArticle[] = [
  {
    id: '1',
    title: 'Guide d\'utilisation de Car Manager',
    description: 'Apprenez à utiliser toutes les fonctionnalités de Car Manager pour gérer efficacement votre flotte de véhicules.',
    imageUrl: '/images/guides/guide-utilisation.jpg',
    category: 'Utilisation',
    link: '/guides/utilisation',
  },
  {
    id: '2',
    title: 'Modèle de contrat de location',
    description: 'Téléchargez notre modèle de contrat de location professionnel et personnalisable.',
    imageUrl: '/images/guides/contrat-location.jpg',
    category: 'Documents',
    link: '/guides/contrat',
  },
  {
    id: '3',
    title: '4 étapes pour devenir loueur',
    description: 'Guide complet pour démarrer votre activité de location de véhicules.',
    imageUrl: '/images/guides/etapes-loueur.jpg',
    category: 'Business',
    link: '/guides/devenir-loueur',
  },
  {
    id: '4',
    title: 'Maintenance préventive',
    description: 'Conseils et bonnes pratiques pour l\'entretien de vos véhicules.',
    imageUrl: '/images/guides/maintenance.jpg',
    category: 'Maintenance',
    link: '/guides/maintenance',
  },
  {
    id: '5',
    title: 'Gestion financière',
    description: 'Optimisez la rentabilité de votre activité de location.',
    imageUrl: '/images/guides/finance.jpg',
    category: 'Finance',
    link: '/guides/finance',
  },
  {
    id: '6',
    title: 'Assurance et réglementation',
    description: 'Tout ce que vous devez savoir sur les aspects légaux et assurantiels.',
    imageUrl: '/images/guides/assurance.jpg',
    category: 'Légal',
    link: '/guides/legal',
  },
];

const categories = ['Tous', 'Utilisation', 'Documents', 'Business', 'Maintenance', 'Finance', 'Légal'];

const GuidePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const filteredGuides = selectedCategory === 'Tous'
    ? guides
    : guides.filter(guide => guide.category === selectedCategory);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      pt: { xs: 4, md: 8 },
      pb: { xs: 8, md: 12 }
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          component="h1"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '2rem', md: '3rem' },
            textAlign: 'center'
          }}
        >
          Nos ressources gratuites
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: 'text.secondary',
            mb: 6,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            textAlign: 'center'
          }}
        >
          dédiées aux loueurs de véhicules
        </Typography>

        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
          <FormControl 
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'primary.main',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.dark',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          >
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              displayEmpty
              sx={{ 
                '&:focus': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={4}>
          {filteredGuides.map((guide) => (
            <Grid item xs={12} sm={6} md={4} key={guide.id}>
              <GuideCard article={guide} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default GuidePage;
