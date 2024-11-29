import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const collections = ['vehicles', 'customers', 'rentals', 'expenses', 'reports'];

export const resetDatabase = async () => {
  try {
    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      console.log(`Collection ${collectionName} reset successfully`);
    }
    console.log('Database reset completed successfully');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};
