import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalGasStation as FuelIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { FuelRecord } from '../../types/vehicleTracking';
import {
  addFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
  getFuelRecords
} from '../../services/vehicleTrackingService';

interface FuelRecordFormData extends Omit<FuelRecord, 'id' | 'date'> {
  date: string;
}

const initialFormData: FuelRecordFormData = {
  date: new Date().toISOString().split('T')[0],
  liters: 0,
  cost: 0,
  mileage: 0,
  fuelType: '',
  fullTank: true,
  station: '',
  notes: '',
};

interface Props {
  vehicleId: string;
}

export const FuelRecordList: React.FC<Props> = ({ vehicleId }) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FuelRecordFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);

  useEffect(() => {
    loadFuelRecords();
  }, [vehicleId]);

  const loadFuelRecords = async () => {
    try {
      const data = await getFuelRecords(vehicleId);
      setRecords(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Error loading fuel records:', error);
    }
  };

  const handleOpen = (record?: FuelRecord) => {
    if (record) {
      setFormData({
        ...record,
        date: new Date(record.date).toISOString().split('T')[0],
      });
      setEditingId(record.id);
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
    setReceipt(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateFuelRecord(vehicleId, editingId, {
          ...formData,
          date: new Date(formData.date)
        }, receipt || undefined);
      } else {
        await addFuelRecord(vehicleId, {
          ...formData,
          date: new Date(formData.date)
        }, receipt || undefined);
      }
      handleClose();
      loadFuelRecords();
    } catch (error) {
      console.error('Error saving fuel record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce relevé ?')) {
      try {
        await deleteFuelRecord(vehicleId, id);
        loadFuelRecords();
      } catch (error) {
        console.error('Error deleting fuel record:', error);
      }
    }
  };

  const calculateConsumption = (record: FuelRecord, prevRecord?: FuelRecord) => {
    if (!prevRecord) return null;
    const distance = record.mileage - prevRecord.mileage;
    if (distance <= 0) return null;
    return ((record.liters / distance) * 100).toFixed(2);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Relevés de Carburant
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nouveau Relevé
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Kilométrage</TableCell>
              <TableCell>Litres</TableCell>
              <TableCell>Coût</TableCell>
              <TableCell>Consommation</TableCell>
              <TableCell>Station</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>{record.mileage} km</TableCell>
                <TableCell>{record.liters} L</TableCell>
                <TableCell>{record.cost} DA</TableCell>
                <TableCell>
                  {calculateConsumption(record, records[index + 1])}
                  {calculateConsumption(record, records[index + 1]) ? ' L/100km' : '-'}
                </TableCell>
                <TableCell>{record.station || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(record)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(record.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                  {record.receipt && (
                    <IconButton href={record.receipt} target="_blank" size="small">
                      <ReceiptIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Modifier le Relevé' : 'Nouveau Relevé'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kilométrage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Litres"
                type="number"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: Number(e.target.value) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Coût"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Type de Carburant"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Station"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.fullTank}
                    onChange={(e) => setFormData({ ...formData, fullTank: e.target.checked })}
                  />
                }
                label="Plein Complet"
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                id="receipt-file"
                type="file"
                onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              />
              <label htmlFor="receipt-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ReceiptIcon />}
                >
                  {receipt ? 'Reçu Sélectionné' : 'Ajouter un Reçu'}
                </Button>
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FuelRecordList;
