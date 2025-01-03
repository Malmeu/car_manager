import { Timestamp } from 'firebase/firestore';

export type VehicleStatus = 'available' | 'rented' | 'unavailable' | 'maintenance' | 'reservation';

export interface Vehicle {
    id?: string;
    userId: string;
    brand: string;
    model: string;
    year: number;
    registration: string;
    status: VehicleStatus;
    dailyRate: number;
    baseMileage: number;  // Kilométrage initial
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

export interface RentalType {
    id?: string;
    vehicleId: string;
    customerId: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'active' | 'completed' | 'cancelled' | 'reservation';
    paymentStatus: 'pending' | 'paid' | 'partial';
    paidAmount: number;
    wilaya: string;
    contractId: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'other';
    userId: string;
    additionalFees: {
        description: string;
        amount: number;
    };
    totalCost: number;
}

// Alias pour la rétrocompatibilité
export type Rental = RentalType;

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

export interface Subscription {
  id?: string;
  userId: string;
  planId: string; // PlanType is not defined in the provided code, assuming it's a string
  status: 'trial' | 'pending' | 'active' | 'expired' | 'suspended';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  maxVehicles: number;
  maxExpenses: number;
  features: string[];
  price: number;
  billingPeriod: 'monthly' | 'annual';
}

export interface DashboardStats {
  totalVehicles: number;
  totalClients: number;
  activeRentals: number;
  availableVehicles: number;
  currentRevenue: number;
  unpaidAmount: number;
}
