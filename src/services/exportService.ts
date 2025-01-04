import { RentalType, Vehicle, Customer } from '../types';
import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction utilitaire pour formater les dates
const formatDate = (date: Date) => {
  return format(date, 'dd MMMM yyyy', { locale: fr });
};

// Export vers Excel
export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSXUtils.json_to_sheet(data);
  const wb = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(wb, ws, 'Sheet1');
  const excelBuffer = XLSXWrite(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(dataBlob, `${fileName}.xlsx`);
};

// Export vers CSV
export const exportToCSV = (data: any[], fileName: string) => {
  const ws = XLSXUtils.json_to_sheet(data);
  const csv = XLSXUtils.sheet_to_csv(ws);
  const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(dataBlob, `${fileName}.csv`);
};

// Préparation des données des locations pour l'export
export const prepareRentalsForExport = (rentals: RentalType[], vehicles: Vehicle[], customers: Customer[]) => {
  return rentals.map(rental => {
    const vehicle = vehicles.find(v => v.id === rental.vehicleId);
    const customer = customers.find(c => c.id === rental.customerId);
    
    return {
      'Date de début': formatDate(rental.startDate.toDate()),
      'Date de fin': formatDate(rental.endDate.toDate()),
      'Véhicule': vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Inconnu',
      'Immatriculation': vehicle?.registration || 'Inconnue',
      'Client': customer ? `${customer.firstName} ${customer.lastName}` : 'Inconnu',
      'Téléphone Client': customer?.phone || 'Inconnu',
      'Coût Total': `${rental.totalCost} DA`,
      'Montant Payé': `${rental.paidAmount} DA`,
      'Reste à Payer': `${rental.totalCost - rental.paidAmount} DA`,
      'Statut': rental.status === 'active' ? 'En cours' : 
                rental.status === 'completed' ? 'Terminée' : 
                rental.status === 'reservation' ? 'Réservation' : 'Annulée',
      'Wilaya': rental.wilaya,
      'Mode de Paiement': rental.paymentMethod === 'cash' ? 'Espèces' : 
                         rental.paymentMethod === 'bank_transfer' ? 'Virement' : 'Autre'
    };
  });
};

// Préparation des données des véhicules pour l'export
export const prepareVehiclesForExport = (vehicles: Vehicle[]) => {
  return vehicles.map(vehicle => ({
    'Marque': vehicle.brand,
    'Modèle': vehicle.model,
    'Année': vehicle.year,
    'Immatriculation': vehicle.registration,
    'Kilométrage Initial': `${vehicle.baseMileage} km`,
    'Type de Carburant': vehicle.fuelType,
    'Tarif Journalier': `${vehicle.dailyRate} DA`,
    'Statut': vehicle.status === 'available' ? 'Disponible' : 
              vehicle.status === 'rented' ? 'En location' : 
              vehicle.status === 'reservation' ? 'Réservé' : 
              vehicle.status === 'maintenance' ? 'En maintenance' : 'Indisponible'
  }));
};

// Préparation des données des clients pour l'export
export const prepareCustomersForExport = (customers: Customer[]) => {
  return customers.map(customer => ({
    'Nom': customer.lastName,
    'Prénom': customer.firstName,
    'Email': customer.email,
    'Téléphone': customer.phone,
    'Adresse': customer.address,
    'Permis de conduire': customer.drivingLicense
  }));
};
