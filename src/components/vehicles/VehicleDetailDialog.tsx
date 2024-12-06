import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Vehicle } from '../../types';
import VehicleDetails from './VehicleDetails';
import VehicleFinancialSummary from './VehicleFinancialSummary';

interface VehicleDetailDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const VehicleDetailDialog: React.FC<VehicleDetailDialogProps> = ({
  open,
  onClose,
  vehicle,
}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Détails du Véhicule
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="vehicle details tabs">
            <Tab label="Informations" id="vehicle-tab-0" />
            <Tab label="Finances" id="vehicle-tab-1" />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <VehicleDetails vehicle={vehicle} />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <VehicleFinancialSummary vehicleId={vehicle.id || ''} />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailDialog;
