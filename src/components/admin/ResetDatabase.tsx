import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { resetDatabase } from '../../utils/resetDatabase';

const ResetDatabase: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleReset = async () => {
    try {
      await resetDatabase();
      setSnackbar({
        open: true,
        message: 'Base de données réinitialisée avec succès',
        severity: 'success'
      });
      handleClose();
      // Recharger la page pour actualiser les données
      window.location.reload();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la réinitialisation de la base de données',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        onClick={handleClickOpen}
        sx={{ mt: 2 }}
      >
        Réinitialiser la base de données
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>Confirmer la réinitialisation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir réinitialiser la base de données ? Cette action supprimera toutes les données existantes et ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ResetDatabase;
