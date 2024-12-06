import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { WbSunny as SunIcon, Cloud as CloudIcon, Opacity as RainIcon } from '@mui/icons-material';
import axios from 'axios';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          setError("Impossible d'obtenir votre position");
          setLoading(false);
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;

      try {
        const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
        // Utilisation de l'API v2.5 qui est plus stable pour les nouvelles clés
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${apiKey}&mode=json`;
        
        console.log('Fetching weather data...');
        const response = await axios.get(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('Weather data received:', response.data);
        setWeather({
          temperature: Math.round(response.data.main.temp),
          condition: response.data.weather[0].main,
          humidity: response.data.main.humidity,
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Weather API Error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });
        setError(`Erreur API: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    if (location) {
      fetchWeather();
    }
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <SunIcon sx={{ fontSize: 40, color: '#FFD700' }} />;
      case 'rain':
        return <RainIcon sx={{ fontSize: 40, color: '#4682B4' }} />;
      default:
        return <CloudIcon sx={{ fontSize: 40, color: '#808080' }} />;
    }
  };

  if (loading) {
    return (
      <Card sx={{ minWidth: 300, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ minWidth: 300, height: '100%' }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 300, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Météo Locale
        </Typography>
        {weather && (
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
            {getWeatherIcon(weather.condition)}
            <Typography variant="h4">{weather.temperature}°C</Typography>
            <Typography variant="body1">Humidité: {weather.humidity}%</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
