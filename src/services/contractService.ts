import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  Timestamp,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { Contract, ContractFormData } from '../types/contract';

interface FirestoreContract extends Omit<Contract, 'id' | 'createdAt' | 'rental'> {
  rental: {
    startDate: Timestamp;
    endDate: Timestamp;
    totalCost: number;
    deposit: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'other';
  };
  createdAt: Timestamp;
}

export const createContract = async (contractData: ContractFormData): Promise<Contract> => {
  try {
    // First, check if customer already exists
    const customersRef = collection(db, 'customers');
    const q = query(
      customersRef,
      where('phone', '==', contractData.tenant.phone),
      where('drivingLicense', '==', contractData.tenant.drivingLicense)
    );
    const customerSnapshot = await getDocs(q);
    
    let customerId: string;
    
    if (customerSnapshot.empty) {
      // Create new customer if doesn't exist
      const customerData = {
        firstName: contractData.tenant.name.split(' ')[0],
        lastName: contractData.tenant.name.split(' ').slice(1).join(' '),
        phone: contractData.tenant.phone,
        address: contractData.tenant.address,
        drivingLicense: contractData.tenant.drivingLicense,
        email: '',  // Add a default empty email
        rentalsHistory: []  // Initialize empty rentals history
      };

      const customerRef = await addDoc(collection(db, 'customers'), customerData);
      customerId = customerRef.id;
      console.log('Created new customer:', customerId);
    } else {
      customerId = customerSnapshot.docs[0].id;
      console.log('Using existing customer:', customerId);
    }

    // Create the contract with the customer ID
    const contract = {
      ...contractData,
      customerId, // Add reference to the customer
      createdAt: Timestamp.now()
    };

    const contractRef = await addDoc(collection(db, 'contracts'), contract);
    console.log('Created new contract:', contractRef.id);
    
    // Update customer's rental history
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      rentalsHistory: arrayUnion(contractRef.id)
    });

    return {
      ...contract,
      id: contractRef.id
    };
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
};

export const getContract = async (id: string): Promise<Contract | null> => {
  try {
    const docRef = doc(db, 'contracts', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Contract;
    }
    return null;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};
