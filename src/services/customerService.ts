import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData } from 'firebase/firestore';

export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  rentalsHistory: string[];
}

// Add a new customer
export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), customerData);
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Get all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const customersRef = collection(db, 'customers');
    console.log('Fetching customers from collection:', customersRef.path);
    const querySnapshot = await getDocs(customersRef);
    console.log('Number of customers found:', querySnapshot.size);
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
    console.log('Processed customers:', customers);
    return customers;
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
  try {
    const customerRef = doc(db, 'customers', id);
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
    await deleteDoc(doc(db, 'customers', id));
    return id;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Search customers by name
export const searchCustomersByName = async (searchTerm: string): Promise<Customer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
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
