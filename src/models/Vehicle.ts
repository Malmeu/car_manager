export interface Vehicle {
  id?: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  registration: string;
  status: 'available' | 'rented' | 'unavailable' | 'maintenance';
  dailyRate: number;
  baseMileage: number;  // Kilométrage initial
  fuelType: string;
  lastMaintenance?: Date;
  imageUrl?: string;
  editingRental?: boolean;
  isAvailable?: boolean;
}
