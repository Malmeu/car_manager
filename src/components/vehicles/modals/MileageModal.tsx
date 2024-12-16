import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import { addMileage } from '../../../services/vehicleTrackingService';

interface MileageModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onSuccess: () => void;
  currentMileage?: number;
}

const MileageModal: React.FC<MileageModalProps> = ({
  open,
  onClose,
  vehicleId,
  onSuccess,
  currentMileage = 0,
}) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    value: currentMileage,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addMileage(vehicleId, {
        date: formData.date,
        value: Number(formData.value) || 0,
        notes: formData.notes
      });
      
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        date: new Date(),
        value: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error adding mileage:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter un relevé kilométrique</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => setFormData({ ...formData, date: newValue || new Date() })}
              sx={{ width: '100%', mb: 2 }}
            />
          </LocalizationProvider>

          <TextField
            fullWidth
            label="Kilométrage"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            required
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <span style={{ marginLeft: 8 }}>km</span>,
            }}
          />

          <TextField
            fullWidth
            label="Notes (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MileageModal;
