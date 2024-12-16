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
  SelectChangeEvent,
} from '@mui/material';
import { Condition } from '../../types/vehicleTracking';

interface ConditionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (condition: Omit<Condition, 'id'>) => void;
}

export const ConditionModal: React.FC<ConditionModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Omit<Condition, 'id'>>({
    description: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'faible',
    repaired: false
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      description: '',
      date: new Date().toISOString().split('T')[0],
      severity: 'faible',
      repaired: false
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Condition</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={3}
            />

            <TextField
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControl fullWidth required>
              <InputLabel id="severity-label">Severity</InputLabel>
              <Select
                labelId="severity-label"
                name="severity"
                value={formData.severity}
                label="Severity"
                onChange={handleChange}
              >
                <MenuItem value="faible">Faible</MenuItem>
                <MenuItem value="moyen">Moyen</MenuItem>
                <MenuItem value="grave">Grave</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="repaired"
              label="Repaired"
              type="checkbox"
              value={formData.repaired}
              onChange={handleChange}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
