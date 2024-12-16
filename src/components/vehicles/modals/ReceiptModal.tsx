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
import { Receipt } from '../../../types/vehicleTracking';
import { addReceipt } from '../../../services/vehicleTrackingService';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onSuccess: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  open,
  onClose,
  vehicleId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    type: 'vignette' as 'vignette' | 'carte grise' | 'controle technique' | 'autre',
    amount: 0,
    validUntil: new Date(),
    documents: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const receiptData: Omit<Receipt, 'id'> = {
        ...formData,
        date: formData.date,
        validUntil: formData.validUntil,
        documents: [],
      };

      await addReceipt(vehicleId, receiptData, files);

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        date: new Date(),
        type: 'vignette',
        amount: 0,
        validUntil: new Date(),
        documents: [],
      });
      setFiles([]);
    } catch (error) {
      console.error('Error adding receipt:', error);
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
      <DialogTitle>Ajouter une quittance</DialogTitle>
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
                  }
                }}
              />
            </LocalizationProvider>

            <FormControl fullWidth>
              <InputLabel>Type de quittance</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Receipt['type'] })}
                label="Type de quittance"
              >
                <MenuItem value="vignette">Vignette</MenuItem>
                <MenuItem value="carte grise">Carte grise</MenuItem>
                <MenuItem value="controle technique">Contrôle technique</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Montant"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              InputProps={{
                startAdornment: <Typography>€</Typography>,
              }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Valide jusqu'au"
                value={formData.validUntil}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormData({ ...formData, validUntil: newValue });
                  }
                }}
                minDate={formData.date}
              />
            </LocalizationProvider>

            <Box>
              <input
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                id="receipt-documents"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="receipt-documents">
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

export default ReceiptModal;
