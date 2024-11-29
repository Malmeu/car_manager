import { Rental } from './index';
import { Timestamp } from 'firebase/firestore';

export interface Contract {
  id?: string;
  rentalId: string;
  lessor: {
    name: string;
    address: string;
    phone: string;
  };
  tenant: {
    name: string;
    address: string;
    phone: string;
    drivingLicense: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
  rental: {
    startDate: Timestamp;
    endDate: Timestamp;
    totalCost: number;
    deposit: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'other';
  };
  terms: string[];
  wilaya: string;
  createdAt: Timestamp;
}

export interface ContractFormData extends Omit<Contract, 'id' | 'createdAt'> {}
