import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';

const COLLECTION_NAME = 'rentals';

export interface Rental {
  id?: string;
  vehicleId: string;
  customerId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalCost: number;
  status: 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  wilaya: string;
  contractId: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  userId: string;
}

// Get all rentals for a specific user
export const getAllRentals = async (userId: string): Promise<Rental[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Rental));
  } catch (error) {
    console.error('Error getting rentals:', error);
    throw error;
  }
};

// Add a new rental
export const addRental = async (rentalData: Omit<Rental, 'id'>): Promise<string> => {
  try {
    // Ensure we're working with Timestamps
    const rental = {
      ...rentalData,
      startDate: rentalData.startDate instanceof Timestamp 
        ? rentalData.startDate 
        : Timestamp.fromDate(new Date(rentalData.startDate)),
      endDate: rentalData.endDate instanceof Timestamp 
        ? rentalData.endDate 
        : Timestamp.fromDate(new Date(rentalData.endDate)),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), rental);
    return docRef.id;
  } catch (error) {
    console.error('Error adding rental:', error);
    throw error;
  }
};

// Update a rental
export const updateRental = async (id: string, rentalData: Partial<Rental>): Promise<void> => {
  try {
    const rentalRef = doc(db, COLLECTION_NAME, id);
    const updateData: Partial<Rental> = { ...rentalData };

    // Convert dates to Timestamps if they exist
    if (rentalData.startDate) {
      updateData.startDate = rentalData.startDate instanceof Timestamp
        ? rentalData.startDate
        : Timestamp.fromDate(new Date(rentalData.startDate));
    }
    
    if (rentalData.endDate) {
      updateData.endDate = rentalData.endDate instanceof Timestamp
        ? rentalData.endDate
        : Timestamp.fromDate(new Date(rentalData.endDate));
    }

    await updateDoc(rentalRef, updateData);
  } catch (error) {
    console.error('Error updating rental:', error);
    throw error;
  }
};

// Delete a rental
export const deleteRental = async (id: string): Promise<void> => {
  try {
    const rentalRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(rentalRef);
  } catch (error) {
    console.error('Error deleting rental:', error);
    throw error;
  }
};

// Get active rentals for a specific user
export const getActiveRentals = async (userId: string): Promise<Rental[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Rental));
  } catch (error) {
    console.error('Error getting active rentals:', error);
    throw error;
  }
};

// Get a rental
export const getRental = async (id: string): Promise<Rental | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
      } as Rental;
    }
    return null;
  } catch (error) {
    console.error('Error getting rental:', error);
    throw error;
  }
};
