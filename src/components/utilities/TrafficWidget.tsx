import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Traffic as TrafficIcon, Warning as WarningIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface TrafficIncident {
  id: string;
  type: string;
  description: string;
  location: LatLngTuple;
  severity: 'low' | 'medium' | 'high';
}

const TrafficWidget: React.FC = () => {
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          // Simulate traffic incidents around user location
          const mockIncidents: TrafficIncident[] = [
            {
              id: '1',
              type: 'Accident',
              description: 'Accident mineur, circulation ralentie',
              location: [position.coords.latitude + 0.01, position.coords.longitude + 0.01],
              severity: 'medium',
            },
            {
              id: '2',
              type: 'Travaux',
              description: 'Travaux de voirie en cours',
              location: [position.coords.latitude - 0.01, position.coords.longitude - 0.01],
              severity: 'low',
            },
          ];
          setIncidents(mockIncidents);
          setLoading(false);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      default:
        return 'info.main';
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
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrafficIcon /> État du Trafic
        </Typography>
        {userLocation && (
          <>
            <Box sx={{ height: 300, width: '100%', mb: 2 }}>
              <MapContainer
                center={userLocation || [51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {incidents.map((incident) => (
                  <Marker key={incident.id} position={incident.location}>
                    <Popup>
                      <Typography variant="subtitle2">{incident.type}</Typography>
                      <Typography variant="body2">{incident.description}</Typography>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Incidents à proximité:
              </Typography>
              {incidents.map((incident) => (
                <Box
                  key={incident.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <WarningIcon sx={{ color: getSeverityColor(incident.severity) }} />
                  <Typography variant="body2">
                    {incident.type}: {incident.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficWidget;
