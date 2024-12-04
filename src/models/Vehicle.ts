export interface Vehicle {
  id?: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  registration: string;
  licensePlate: string;
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
