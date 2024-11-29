import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData } from 'firebase/firestore';

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
}

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
    return { id: docRef.id, ...vehicleData };
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// Get all vehicles
export const getAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    const vehiclesRef = collection(db, 'vehicles');
    console.log('Fetching vehicles from collection:', vehiclesRef.path);
    const querySnapshot = await getDocs(vehiclesRef);
    console.log('Number of vehicles found:', querySnapshot.size);
    const vehicles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Vehicle[];
    console.log('Processed vehicles:', vehicles);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw error;
  }
};

// Update a vehicle
export const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>) => {
  try {
    const vehicleRef = doc(db, 'vehicles', id);
    await updateDoc(vehicleRef, vehicleData);
    return { id, ...vehicleData };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

// Delete a vehicle
export const deleteVehicle = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'vehicles', id));
    return id;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Get available vehicles
export const getAvailableVehicles = async (): Promise<Vehicle[]> => {
  try {
    const q = query(
      collection(db, 'vehicles'),
      where('status', '==', 'available')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Vehicle[];
  } catch (error) {
    console.error('Error getting available vehicles:', error);
    throw error;
  }
};
