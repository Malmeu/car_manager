import { VehicleTracking } from '../types/vehicleTracking';

export interface Notification {
  type: 'maintenance' | 'insurance' | 'receipt';
  message: string;
  dueDate: Date;
  severity: 'info' | 'warning' | 'error';
}

export const checkNotifications = (vehicleTracking: VehicleTracking): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // Vérifier les maintenances
  if (vehicleTracking?.maintenances) {
    vehicleTracking.maintenances.forEach(maintenance => {
      if (maintenance.nextMaintenanceDate) {
        const nextDate = new Date(maintenance.nextMaintenanceDate);
        if (nextDate <= now) {
          notifications.push({
            type: 'maintenance',
            message: `Maintenance ${maintenance.type} en retard`,
            dueDate: nextDate,
            severity: 'error'
          });
        } else if (nextDate <= sevenDaysFromNow) {
          notifications.push({
            type: 'maintenance',
            message: `Maintenance ${maintenance.type} prévue dans moins de 7 jours`,
            dueDate: nextDate,
            severity: 'warning'
          });
        } else if (nextDate <= thirtyDaysFromNow) {
          notifications.push({
            type: 'maintenance',
            message: `Maintenance ${maintenance.type} prévue dans moins de 30 jours`,
            dueDate: nextDate,
            severity: 'info'
          });
        }
      }
    });
  }

  // Vérifier les assurances
  if (vehicleTracking?.insurances) {
    vehicleTracking.insurances.forEach(insurance => {
      if (insurance.endDate) {
        const endDate = new Date(insurance.endDate);
        if (endDate <= now) {
          notifications.push({
            type: 'insurance',
            message: 'Assurance expirée',
            dueDate: endDate,
            severity: 'error'
          });
        } else if (endDate <= sevenDaysFromNow) {
          notifications.push({
            type: 'insurance',
            message: 'Assurance expire dans moins de 7 jours',
            dueDate: endDate,
            severity: 'warning'
          });
        } else if (endDate <= thirtyDaysFromNow) {
          notifications.push({
            type: 'insurance',
            message: 'Assurance expire dans moins de 30 jours',
            dueDate: endDate,
            severity: 'info'
          });
        }
      }
    });
  }

  // Vérifier les quittances
  if (vehicleTracking?.receipts) {
    vehicleTracking.receipts.forEach(receipt => {
      if (receipt.date) {  
        const dueDate = new Date(receipt.date);
        if (dueDate <= now) {
          notifications.push({
            type: 'receipt',
            message: 'Quittance en retard',
            dueDate: dueDate,
            severity: 'error'
          });
        } else if (dueDate <= sevenDaysFromNow) {
          notifications.push({
            type: 'receipt',
            message: 'Quittance à payer dans moins de 7 jours',
            dueDate: dueDate,
            severity: 'warning'
          });
        } else if (dueDate <= thirtyDaysFromNow) {
          notifications.push({
            type: 'receipt',
            message: 'Quittance à payer dans moins de 30 jours',
            dueDate: dueDate,
            severity: 'info'
          });
        }
      }
    });
  }

  return notifications;
};
