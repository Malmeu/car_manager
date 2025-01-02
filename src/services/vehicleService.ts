import { Vehicle } from '../models/Vehicle';
import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const COLLECTION_NAME = 'vehicles';

// Helper function to generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Get all vehicles for a specific user
export const getAllVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    console.log('Getting vehicles for user:', userId);
    if (!userId) {
      console.error('No userId provided to getAllVehicles');
      return [];
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No vehicles found for user:', userId);
      return [];
    }

    const vehicles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Vehicle[];

    console.log(`Found ${vehicles.length} vehicles for user:`, userId);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw error;
  }
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    console.log('Adding new vehicle:', vehicleData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), vehicleData);
    const newVehicle = { ...vehicleData, id: docRef.id };
    console.log('Added vehicle with ID:', docRef.id);
    return newVehicle;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// Update a vehicle
export const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  try {
    console.log('Updating vehicle:', id, vehicleData);
    const vehicleRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(vehicleRef, vehicleData);
    const updatedVehicle = { ...vehicleData, id } as Vehicle;
    console.log('Updated vehicle:', updatedVehicle);
    return updatedVehicle;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

// Delete a vehicle
export const deleteVehicle = async (id: string): Promise<void> => {
  try {
    const vehicleRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(vehicleRef);
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Get available vehicles for a specific user
export const getAvailableVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', '==', 'available')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Vehicle));
  } catch (error) {
    console.error('Error getting available vehicles:', error);
    throw error;
  }
};

export type { Vehicle } from '../models/Vehicle';
