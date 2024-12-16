import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Contenu des articles
const articleContents: Record<string, {
  title: string;
  content: string[];
  imageUrl: string;
}> = {
  'utilisation': {
    title: 'Guide d\'utilisation de Car Manager',
    content: [
      'Car Manager est une solution complète pour la gestion de votre flotte de véhicules. Voici comment tirer le meilleur parti de notre plateforme :',
      '1. Gestion des véhicules',
      '• Ajoutez facilement vos véhicules avec leurs caractéristiques',
      '• Suivez leur disponibilité en temps réel',
      '• Gérez les documents associés (assurance, entretien)',
      '',
      '2. Gestion des locations',
      '• Créez des contrats de location en quelques clics',
      '• Suivez les paiements et les cautions',
      '• Gérez les retours et les états des lieux',
      '',
      '3. Suivi financier',
      '• Tableau de bord avec vos indicateurs clés',
      '• Rapports détaillés de rentabilité',
      '• Export des données pour votre comptabilité'
    ],
    imageUrl: '/images/guides/guide-utilisation.jpg'
  },
  'contrat': {
    title: 'Modèle de contrat de location',
    content: [
      'Un contrat de location bien rédigé est essentiel pour protéger vos intérêts. Notre modèle inclut :',
      '',
      '1. Informations essentielles',
      '• Identification des parties',
      '• Description détaillée du véhicule',
      '• Durée et conditions de la location',
      '',
      '2. Conditions financières',
      '• Prix de la location',
      '• Montant de la caution',
      '• Modalités de paiement',
      '',
      '3. Responsabilités',
      '• Obligations du locataire',
      '• Conditions d\'utilisation',
      '• Procédure en cas d\'accident'
    ],
    imageUrl: '/images/guides/contrat-location.jpg'
  },
  'devenir-loueur': {
    title: '4 étapes pour devenir loueur',
    content: [
      'Démarrer une activité de location de véhicules nécessite une bonne préparation. Voici les étapes clés :',
      '',
      '1. Étude de marché',
      '• Analysez la demande locale',
      '• Identifiez votre clientèle cible',
      '• Étudiez la concurrence',
      '',
      '2. Aspects juridiques',
      '• Choisissez votre structure juridique',
      '• Obtenez les autorisations nécessaires',
      '• Souscrivez aux assurances adaptées',
      '',
      '3. Flotte de véhicules',
      '• Sélectionnez les véhicules adaptés',
      '• Planifiez les financements',
      '• Organisez la maintenance',
      '',
      '4. Gestion opérationnelle',
      '• Mettez en place vos processus',
      '• Utilisez des outils adaptés',
      '• Formez votre équipe'
    ],
    imageUrl: '/images/guides/etapes-loueur.jpg'
  },
  'maintenance': {
    title: 'Maintenance préventive',
    content: [
      'Une maintenance régulière est cruciale pour la longévité de vos véhicules :',
      '',
      '1. Contrôles réguliers',
      '• Niveaux de fluides',
      '• Pression des pneus',
      '• État des freins',
      '',
      '2. Planning d\'entretien',
      '• Vidanges régulières',
      '• Changement des filtres',
      '• Révisions constructeur',
      '',
      '3. Suivi des interventions',
      '• Historique des réparations',
      '• Coûts de maintenance',
      '• Prévision des interventions futures'
    ],
    imageUrl: '/images/guides/maintenance.jpg'
  },
  'finance': {
    title: 'Gestion financière',
    content: [
      'Optimisez la rentabilité de votre activité :',
      '',
      '1. Calcul des coûts',
      '• Amortissement des véhicules',
      '• Frais d\'entretien',
      '• Assurances et taxes',
      '',
      '2. Tarification',
      '• Analyse du marché',
      '• Calcul du point mort',
      '• Stratégie de prix',
      '',
      '3. Suivi financier',
      '• Tableau de bord',
      '• Indicateurs de performance',
      '• Prévisions financières'
    ],
    imageUrl: '/images/guides/finance.jpg'
  },
  'legal': {
    title: 'Assurance et réglementation',
    content: [
      'Maîtrisez les aspects légaux de votre activité :',
      '',
      '1. Assurances obligatoires',
      '• Responsabilité civile',
      '• Assurance flotte',
      '• Protection juridique',
      '',
      '2. Réglementation',
      '• Obligations légales',
      '• Normes de sécurité',
      '• Conformité RGPD',
      '',
      '3. Documentation',
      '• Contrats types',
      '• Procédures internes',
      '• Registres obligatoires'
    ],
    imageUrl: '/images/guides/assurance.jpg'
  }
};

const GuideArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  
  const article = articleId ? articleContents[articleId] : null;

  if (!article) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4">Article non trouvé</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/guides')}
          sx={{ mt: 2 }}
        >
          Retour aux guides
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ background: '#FFFFFF', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/guides')}
          sx={{ mb: 4 }}
        >
          Retour aux guides
        </Button>

        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 6 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Box 
            component="img"
            src={article.imageUrl}
            alt={article.title}
            sx={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
              borderRadius: 1,
              mb: 4
            }}
          />

          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              color: 'primary.main',
              fontWeight: 700,
              mb: 4,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            {article.title}
          </Typography>

          {article.content.map((paragraph, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{
                mb: 2,
                lineHeight: 1.8,
                fontSize: '1.1rem',
                fontWeight: paragraph.startsWith('•') ? 400 : paragraph.match(/^\d\./) ? 600 : 400,
                pl: paragraph.startsWith('•') ? 3 : 0
              }}
            >
              {paragraph}
            </Typography>
          ))}
        </Paper>
      </Container>
    </Box>
  );
};

export default GuideArticlePage;
