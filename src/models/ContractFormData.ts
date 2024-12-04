export interface ContractFormData {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  driverLicense: string;
  vehicleId: string;
  startDate: Date | null;
  endDate: Date | null;
  withDriver: boolean;
  discount: number;
  deposit: number;
  additionalNotes: string;
}
