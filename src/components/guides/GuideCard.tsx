import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface GuideArticle {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  link: string;
}

interface GuideCardProps {
  article: GuideArticle;
}

const GuideCard: React.FC<GuideCardProps> = ({ article }) => {
  const navigate = useNavigate();

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={article.imageUrl}
        alt={article.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '1.2rem',
            mb: 2 
          }}
        >
          {article.title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}
        >
          {article.description}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => window.open(article.link, '_blank')}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 1.5
            }}
          >
            Lire le guide
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GuideCard;
