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
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Vehicle));
  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw error;
  }
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), vehicleData);
    return { ...vehicleData, id: docRef.id };
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// Update a vehicle
export const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  try {
    const vehicleRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(vehicleRef, vehicleData);
    return { ...vehicleData, id } as Vehicle;
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
