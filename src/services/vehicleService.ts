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
  editingRental?: boolean;
  isAvailable?: boolean;
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
    console.log(`Mise à jour du véhicule ${id} avec les données:`, vehicleData);
    const vehicleRef = doc(db, 'vehicles', id);
    
    // Récupérer les données actuelles du véhicule
    const vehicles = await getAllVehicles();
    const currentVehicle = vehicles.find(v => v.id === id);
    if (!currentVehicle) {
      throw new Error(`Véhicule ${id} non trouvé`);
    }
    
    // Fusionner les données actuelles avec les nouvelles données
    const updatedData = {
      ...currentVehicle,
      ...vehicleData
    };
    console.log(`Données complètes pour la mise à jour:`, updatedData);
    
    // Mettre à jour avec les données fusionnées
    await updateDoc(vehicleRef, updatedData);
    console.log(`Véhicule ${id} mis à jour avec succès`);
    
    // Vérifier l'état après la mise à jour
    const updatedVehicles = await getAllVehicles();
    const updatedVehicle = updatedVehicles.find(v => v.id === id);
    console.log(`État du véhicule après mise à jour:`, updatedVehicle);
    
    return updatedVehicle || { id, ...updatedData };
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
    const vehicles = await getAllVehicles();
    console.log('Tous les véhicules avant filtrage:', vehicles);
    
    // Filtrer les véhicules qui sont réellement disponibles
    const availableVehicles = vehicles.filter(vehicle => {
      const isAvailable = vehicle.status === 'available';
      console.log(`Véhicule ${vehicle.id} (${vehicle.brand} ${vehicle.model}): status=${vehicle.status}, isAvailable=${isAvailable}`);
      return isAvailable;
    });
    
    console.log('Véhicules disponibles après filtrage:', availableVehicles);
    return availableVehicles;
  } catch (error) {
    console.error('Error getting available vehicles:', error);
    throw error;
  }
};
