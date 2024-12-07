import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const getAllClients = async (userId: string): Promise<Client[]> => {
  try {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};
