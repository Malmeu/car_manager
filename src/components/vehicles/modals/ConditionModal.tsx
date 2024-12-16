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
  FormControlLabel,
  Switch,
  Box,
  Tab,
  Tabs,
  SelectChangeEvent,
} from '@mui/material';
import { Condition } from '../../../types/vehicleTracking';
import CarDamageSelector from '../CarDamageSelector';

interface ConditionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (condition: Condition) => void;
  initialCondition?: Condition;
}

const initialCondition: Omit<Condition, 'id'> = {
  date: new Date(),
  description: '',
  severity: 'faible',
  repaired: false,
  damagePoints: {},
  cost: 0,
  photos: [],
  documents: []
};

const ConditionModal: React.FC<ConditionModalProps> = ({
  open,
  onClose,
  onSave,
  initialCondition: providedCondition,
}) => {
  const [condition, setCondition] = useState<Condition>(() => {
    if (providedCondition) {
      return providedCondition;
    }
    return {
      id: '',
      ...initialCondition
    };
  });
  const [currentView, setCurrentView] = useState('front');

  const handleChange = (field: keyof Condition) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent
  ) => {
    setCondition({
      ...condition,
      [field]: event.target.value,
    });
  };

  const handleSwitchChange = (field: keyof Condition) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCondition({
      ...condition,
      [field]: event.target.checked,
    });
  };

  const handleDamagePointsChange = (view: string, points: { x: number; y: number; color: string }[]) => {
    setCondition({
      ...condition,
      damagePoints: {
        ...condition.damagePoints,
        [view]: points
      }
    });
  };

  const handleSubmit = () => {
    onSave(condition);
    onClose();
  };

  const formatDate = (date: string | Date): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {providedCondition ? 'Modifier la condition' : 'Nouvelle condition'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={formatDate(condition.date)}
            onChange={handleChange('date')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Description"
            multiline
            rows={4}
            value={condition.description}
            onChange={handleChange('description')}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Sévérité</InputLabel>
            <Select<'faible' | 'moyen' | 'grave'>
              value={condition.severity}
              onChange={handleChange('severity') as (event: SelectChangeEvent<'faible' | 'moyen' | 'grave'>) => void}
              label="Sévérité"
            >
              <MenuItem value="faible">Faible</MenuItem>
              <MenuItem value="moyen">Moyen</MenuItem>
              <MenuItem value="grave">Grave</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={condition.repaired}
                onChange={handleSwitchChange('repaired')}
              />
            }
            label="Réparé"
          />

          <TextField
            label="Coût de réparation (DA)"
            type="number"
            value={condition.cost || ''}
            onChange={handleChange('cost')}
            fullWidth
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentView}
              onChange={(_, newValue) => setCurrentView(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Vue de face" value="front" />
              <Tab label="Vue arrière" value="back" />
              <Tab label="Vue gauche" value="left" />
              <Tab label="Vue droite" value="right" />
              <Tab label="Vue de dessus" value="top" />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2 }}>
            <CarDamageSelector
              view={currentView}
              points={condition.damagePoints?.[currentView] || []}
              onChange={(points) => handleDamagePointsChange(currentView, points)}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConditionModal;
