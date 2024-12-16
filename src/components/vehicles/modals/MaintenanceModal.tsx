import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import { Maintenance } from '../../../types/vehicleTracking';
import { addMaintenance, updateMaintenance } from '../../../services/vehicleTrackingService';

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onSuccess: () => void;
  maintenance?: Maintenance | null;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  open,
  onClose,
  vehicleId,
  onSuccess,
  maintenance,
}) => {
  const [formData, setFormData] = useState({
    date: null as Date | null,
    type: 'vidange' as 'vidange' | 'revision' | 'reparation' | 'autre',
    description: '',
    cost: 0,
    nextMaintenanceKm: undefined as number | undefined,
    nextMaintenanceDate: null as Date | null,
    garage: '',
    documents: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (maintenance) {
      setFormData({
        date: maintenance.date ? new Date(maintenance.date) : null,
        type: maintenance.type,
        description: maintenance.description,
        cost: maintenance.cost,
        nextMaintenanceKm: maintenance.nextMaintenanceKm,
        nextMaintenanceDate: maintenance.nextMaintenanceDate ? new Date(maintenance.nextMaintenanceDate) : null,
        garage: maintenance.garage || '',
        documents: maintenance.documents || [],
      });
    } else {
      // Réinitialiser le formulaire
      setFormData({
        date: null,
        type: 'vidange',
        description: '',
        cost: 0,
        nextMaintenanceKm: undefined,
        nextMaintenanceDate: null,
        garage: '',
        documents: [],
      });
    }
  }, [maintenance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      return;
    }
    setLoading(true);

    try {
      const maintenanceData: Omit<Maintenance, 'id'> = {
        ...formData,
        date: formData.date,
        nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        documents: [],
      };

      if (maintenance) {
        await updateMaintenance(vehicleId, maintenance.id, maintenanceData, files);
      } else {
        await addMaintenance(vehicleId, maintenanceData, files);
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        date: null,
        type: 'vidange',
        description: '',
        cost: 0,
        nextMaintenanceKm: undefined,
        nextMaintenanceDate: null,
        garage: '',
        documents: [],
      });
      setFiles([]);
    } catch (error) {
      console.error('Error adding maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {maintenance ? 'Modifier l\'entretien' : 'Ajouter un entretien'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, date: newValue });
                  } else {
                    setFormData({ ...formData, date: null });
                  }
                }}
              />
            </LocalizationProvider>

            <FormControl fullWidth>
              <InputLabel>Type d'entretien</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'vidange' | 'revision' | 'reparation' | 'autre' })}
                label="Type d'entretien"
              >
                <MenuItem value="vidange">Vidange</MenuItem>
                <MenuItem value="revision">Révision</MenuItem>
                <MenuItem value="reparation">Réparation</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <TextField
              label="Coût"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              InputProps={{
                startAdornment: <Typography>€</Typography>,
              }}
            />

            <TextField
              label="Prochain entretien (km)"
              type="number"
              value={formData.nextMaintenanceKm || ''}
              onChange={(e) => setFormData({ ...formData, nextMaintenanceKm: parseInt(e.target.value) || undefined })}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date du prochain entretien"
                value={formData.nextMaintenanceDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, nextMaintenanceDate: newValue });
                  } else {
                    setFormData({ ...formData, nextMaintenanceDate: null });
                  }
                }}
              />
            </LocalizationProvider>

            <TextField
              label="Garage"
              value={formData.garage}
              onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
            />

            <Box>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="raised-button-file"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span">
                  Ajouter des documents
                </Button>
              </label>
              {files.length > 0 && (
                <Typography variant="caption" display="block">
                  {files.length} fichier(s) sélectionné(s)
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MaintenanceModal;
