import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { Formik, Form, FormikHelpers, FormikProps } from 'formik';
import * as Yup from 'yup';
import { Customer, SecuredDataService } from '../../services/securedDataService';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onSubmit?: (customer: Customer) => void;
  initialData?: Partial<Customer>;
  isEdit?: boolean;
}

interface CustomerFormValues {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  identityCard: string;
  bankDetails: {
    iban: string;
    bic: string;
    accountHolder: string;
  };
}

const validationSchema = Yup.object({
  firstName: Yup.string().required('Le prénom est requis'),
  lastName: Yup.string().required('Le nom est requis'),
  email: Yup.string().email('Email invalide').required('L\'email est requis'),
  phone: Yup.string().required('Le téléphone est requis'),
  address: Yup.string().required('L\'adresse est requise'),
  drivingLicense: Yup.string().required('Le numéro de permis est requis'),
  identityCard: Yup.string().required('Le numéro de carte d\'identité est requis'),
  bankDetails: Yup.object({
    iban: Yup.string().required('L\'IBAN est requis'),
    bic: Yup.string().required('Le BIC est requis'),
    accountHolder: Yup.string().required('Le titulaire du compte est requis')
  })
});

export default function CustomerForm({ onSubmit, initialData, isEdit = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const initialValues: CustomerFormValues = {
    id: initialData?.id || uuidv4(),
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    drivingLicense: initialData?.drivingLicense || '',
    identityCard: initialData?.identityCard || '',
    bankDetails: {
      iban: initialData?.bankDetails?.iban || '',
      bic: initialData?.bankDetails?.bic || '',
      accountHolder: initialData?.bankDetails?.accountHolder || ''
    }
  };

  const handleSubmit = async (values: CustomerFormValues, { setSubmitting }: FormikHelpers<CustomerFormValues>) => {
    try {
      setError(null);
      setLoading(true);

      if (isEdit) {
        await SecuredDataService.updateCustomer(values.id, values);
      } else {
        await SecuredDataService.createCustomer(values as Customer);
      }

      onSubmit?.(values as Customer);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du client:', err);
      setError('Une erreur est survenue lors de l\'enregistrement du client');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEdit ? 'Modifier le client' : 'Nouveau client'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Formik<CustomerFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ 
          values, 
          errors, 
          touched, 
          handleChange, 
          handleBlur, 
          isSubmitting,
          handleSubmit
        }: FormikProps<CustomerFormValues>) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="Prénom"
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.firstName && Boolean(errors.firstName)}
                  helperText={touched.firstName && errors.firstName}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label="Nom"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.lastName && Boolean(errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Téléphone"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="Adresse"
                  multiline
                  rows={2}
                  value={values.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="drivingLicense"
                  label="Numéro de permis"
                  value={values.drivingLicense}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.drivingLicense && Boolean(errors.drivingLicense)}
                  helperText={touched.drivingLicense && errors.drivingLicense}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="identityCard"
                  label="Numéro de carte d'identité"
                  value={values.identityCard}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.identityCard && Boolean(errors.identityCard)}
                  helperText={touched.identityCard && errors.identityCard}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Informations bancaires
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="bankDetails.iban"
                  label="IBAN"
                  value={values.bankDetails.iban}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.bankDetails?.iban && 
                    Boolean(errors.bankDetails?.iban)
                  }
                  helperText={
                    touched.bankDetails?.iban && 
                    errors.bankDetails?.iban
                  }
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="bankDetails.bic"
                  label="BIC"
                  value={values.bankDetails.bic}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.bankDetails?.bic && 
                    Boolean(errors.bankDetails?.bic)
                  }
                  helperText={
                    touched.bankDetails?.bic && 
                    errors.bankDetails?.bic
                  }
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="bankDetails.accountHolder"
                  label="Titulaire du compte"
                  value={values.bankDetails.accountHolder}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.bankDetails?.accountHolder && 
                    Boolean(errors.bankDetails?.accountHolder)
                  }
                  helperText={
                    touched.bankDetails?.accountHolder && 
                    errors.bankDetails?.accountHolder
                  }
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {isEdit ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
