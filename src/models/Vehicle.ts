export interface Vehicle {
  id?: string;
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
