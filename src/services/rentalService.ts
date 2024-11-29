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
} from 'firebase/firestore';

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
}

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

    const docRef = await addDoc(collection(db, 'rentals'), rental);
    return docRef.id;
  } catch (error) {
    console.error('Error adding rental:', error);
    throw error;
  }
};

export const updateRental = async (id: string, rentalData: Partial<Rental>): Promise<void> => {
  try {
    const rentalRef = doc(db, 'rentals', id);
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

export const getAllRentals = async (): Promise<Rental[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'rentals'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
      } as Rental;
    });
  } catch (error) {
    console.error('Error getting rentals:', error);
    throw error;
  }
};

export const getRental = async (id: string): Promise<Rental | null> => {
  try {
    const docRef = doc(db, 'rentals', id);
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

export const deleteRental = async (id: string): Promise<void> => {
  try {
    const rentalRef = doc(db, 'rentals', id);
    await deleteDoc(rentalRef);
  } catch (error) {
    console.error('Error deleting rental:', error);
    throw error;
  }
};
