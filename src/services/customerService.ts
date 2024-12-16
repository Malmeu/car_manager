import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

export const COLLECTION_NAME = 'customers';

export interface Customer {
  id?: string;
  userId: string;
  type: 'particular' | 'business';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  companyName?: string;
  rentalsHistory: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Migrate a client from 'clients' to 'customers'
export const migrateClient = async (clientId: string) => {
  try {
    // Get client from old collection
    const clientDoc = await getDoc(doc(db, 'clients', clientId));
    if (!clientDoc.exists()) {
      console.log('Client not found in old collection:', clientId);
      return null;
    }

    // Add to new collection
    const clientData = clientDoc.data();
    const newCustomer = await addDoc(collection(db, COLLECTION_NAME), {
      ...clientData,
      type: 'particular',
      companyName: undefined,
      migratedAt: new Date(),
      updatedAt: new Date()
    });

    // Delete from old collection
    await deleteDoc(doc(db, 'clients', clientId));

    return newCustomer.id;
  } catch (error) {
    console.error('Error migrating client:', error);
    return null;
  }
};

// Get customer by ID (checks both collections during migration period)
export const getCustomerById = async (id: string) => {
  try {
    // Check customers first
    let customerDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    
    if (!customerDoc.exists()) {
      // Check clients collection
      const clientDoc = await getDoc(doc(db, 'clients', id));
      if (clientDoc.exists()) {
        // Migrate client to customers
        const newId = await migrateClient(id);
        if (newId) {
          customerDoc = await getDoc(doc(db, COLLECTION_NAME, newId));
        }
      }
    }

    if (!customerDoc.exists()) {
      return null;
    }

    return { id: customerDoc.id, ...customerDoc.data() } as Customer;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
};

// Add new customer
export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      rentalsHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding customer:', error);
    return null;
  }
};

// Update customer
export const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, {
      ...customerData,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating customer:', error);
    return false;
  }
};

// Delete customer
export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
};

// Get all customers
export const getAllCustomers = async (userId?: string) => {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(customersRef);
      
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

// Search customers by name
export const searchCustomersByName = async (searchTerm: string): Promise<Customer[]> => {
  try {
    const customers = await getAllCustomers();
    const searchTermLower = searchTerm.toLowerCase();
    
    return customers.filter(customer => 
      customer.firstName.toLowerCase().includes(searchTermLower) ||
      customer.lastName.toLowerCase().includes(searchTermLower) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(searchTermLower))
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
};
