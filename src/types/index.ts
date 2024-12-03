import { Timestamp } from 'firebase/firestore';

export interface Vehicle {
    id?: string;
    userId: string;
    brand: string;
    model: string;
    year: number;
    registration: string;
    status: 'available' | 'rented' | 'unavailable';
    dailyRate: number;
    mileage: number;
    kilometers: number;
    fuelType: string;
    lastMaintenance?: Date;
    imageUrl?: string;
    editingRental?: boolean;
    isAvailable?: boolean;
}

export interface Customer {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    drivingLicense: string;
    rentalsHistory: string[];
}

export interface Rental {
    id?: string;
    vehicleId: string;
    customerId: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'active' | 'completed' | 'cancelled';
    totalCost: number;
    paymentStatus: 'pending' | 'paid' | 'partial';
    paidAmount: number;
    wilaya: string;
    contractId: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'other';
}

export interface Expense {
    id: string;
    vehicleId?: string;
    type: 'maintenance' | 'consumable' | 'repair' | 'other';
    amount: number;
    date: Date;
    description: string;
}

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
