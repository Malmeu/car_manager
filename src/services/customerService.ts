import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData } from 'firebase/firestore';

export interface Customer {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  rentalsHistory: string[];
}

const COLLECTION_NAME = 'customers';

// Add a new customer
export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), customerData);
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Get all customers for a specific user
export const getAllCustomers = async (userId: string): Promise<Customer[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, customerData);
    return { id, ...customerData };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return id;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Search customers by name
export const searchCustomersByName = async (searchTerm: string): Promise<Customer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Customer)
      .filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};
