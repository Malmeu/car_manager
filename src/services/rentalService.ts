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
  status: 'active' | 'completed' | 'cancelled' | 'reservation';
  paymentStatus: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  wilaya: string;
  contractId: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  userId: string;
  additionalFees: {
    description: string;
    amount: number;
  };
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

    // Mettre à jour le statut du véhicule selon le type de location
    const vehicleRef = doc(db, 'vehicles', rental.vehicleId);
    await updateDoc(vehicleRef, {
      status: rental.status === 'active' ? 'rented' : 'reservation',
      editingRental: true
    });

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

    // Récupérer la location actuelle pour obtenir le vehicleId
    const currentRental = await getDoc(rentalRef);
    const rental = currentRental.data() as Rental;

    await updateDoc(rentalRef, updateData);

    // Si le statut change, mettre à jour le statut du véhicule
    if (rentalData.status && rental.vehicleId) {
      const vehicleRef = doc(db, 'vehicles', rental.vehicleId);
      
      // Si la location est terminée ou annulée, remettre le véhicule comme disponible
      if (rentalData.status === 'completed' || rentalData.status === 'cancelled') {
        await updateDoc(vehicleRef, {
          status: 'available',
          editingRental: false
        });
      }
      // Si la location devient active, marquer le véhicule comme loué
      else if (rentalData.status === 'active') {
        await updateDoc(vehicleRef, {
          status: 'rented',
          editingRental: true
        });
      }
    }
  } catch (error) {
    console.error('Error updating rental:', error);
    throw error;
  }
};

// Delete a rental
export const deleteRental = async (id: string): Promise<void> => {
  try {
    const rentalRef = doc(db, COLLECTION_NAME, id);
    
    // Récupérer les informations de la location avant de la supprimer
    const rentalSnap = await getDoc(rentalRef);
    if (rentalSnap.exists()) {
      const rentalData = rentalSnap.data() as Rental;
      
      // Mettre à jour le statut du véhicule à "available"
      const vehicleRef = doc(db, 'vehicles', rentalData.vehicleId);
      await updateDoc(vehicleRef, {
        status: 'available',
        editingRental: false
      });
    }
    
    // Supprimer la location
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
