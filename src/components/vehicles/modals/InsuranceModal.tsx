import React, { useState } from 'react';
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
import { Insurance } from '../../../types/vehicleTracking';
import { addInsurance } from '../../../services/vehicleTrackingService';

interface InsuranceModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onSuccess: () => void;
}

const InsuranceModal: React.FC<InsuranceModalProps> = ({
  open,
  onClose,
  vehicleId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    company: '',
    policyNumber: '',
    cost: 0,
    type: 'tous risques' as 'tous risques' | 'tiers' | 'autre',
    documents: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const insuranceData: Omit<Insurance, 'id'> = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        documents: [],
      };

      await addInsurance(vehicleId, insuranceData, files);

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        startDate: new Date(),
        endDate: new Date(),
        company: '',
        policyNumber: '',
        cost: 0,
        type: 'tous risques',
        documents: [],
      });
      setFiles([]);
    } catch (error) {
      console.error('Error adding insurance:', error);
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
      <DialogTitle>Ajouter une assurance</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de début"
                value={formData.startDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, startDate: newValue });
                  }
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de fin"
                value={formData.endDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, endDate: newValue });
                  }
                }}
                minDate={formData.startDate}
              />
            </LocalizationProvider>

            <TextField
              label="Compagnie d'assurance"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />

            <TextField
              label="Numéro de police"
              value={formData.policyNumber}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
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

            <FormControl fullWidth>
              <InputLabel>Type d'assurance</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'tous risques' | 'tiers' | 'autre' })}
                label="Type d'assurance"
              >
                <MenuItem value="tous risques">Tous risques</MenuItem>
                <MenuItem value="tiers">Tiers</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <input
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                id="insurance-documents"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="insurance-documents">
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

export default InsuranceModal;
