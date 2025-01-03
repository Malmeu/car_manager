export interface Maintenance {
  id: string;
  date: string | Date;
  type: 'vidange' | 'revision' | 'reparation' | 'autre';
  description: string;
  cost: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: string | Date | null;
  garage?: string;
  documents?: string[];
}

export interface Mileage {
  id: string;
  date: Date;
  value: number;
  notes?: string;
}

export interface Insurance {
  id: string;
  startDate: Date;
  endDate: Date;
  company: string;
  policyNumber: string;
  cost: number;
  type: 'tous risques' | 'tiers' | 'autre';
  documents: string[]; // URLs des documents d'assurance
}

export interface Receipt {
  id: string;
  date: Date;
  type: 'vignette' | 'carte grise' | 'controle technique' | 'autre';
  amount: number;
  validUntil: Date;
  documents: string[]; // URLs des quittances
}

export interface DamagePoint {
  x: number;
  y: number;
  color: string;
}

export interface Condition {
  id: string;
  date: string | Date;
  description: string;
  severity: 'faible' | 'moyen' | 'grave';
  repaired: boolean;
  cost?: number;
  photos?: string[];
  documents?: string[];
  damagePoints?: Record<string, DamagePoint[]>;
}

export interface FuelRecord {
  id: string;
  date: Date;
  liters: number;
  cost: number;
  mileage: number;
  fuelType: string;
  fullTank: boolean;
  station?: string;
  notes?: string;
  receipt?: string; // URL du reçu
}

export interface VehicleTracking {
  vehicleId: string;
  maintenances: Maintenance[];
  mileages: Mileage[];
  insurances: Insurance[];
  receipts: Receipt[];
  conditions: Condition[];
  fuelRecords: FuelRecord[];
}
