import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import ClientForm from './ClientForm';

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Ajouter un client</DialogTitle>
      <DialogContent>
        <ClientForm onSuccess={() => {
          onSuccess();
          onClose();
        }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCustomerDialog;
