import { db } from '../config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const COLLECTIONS_TO_CLEAN = [
  'vehicles',
  'customers',
  'rentals',
  'expenses',
  'reports',
  'contracts',
  'notifications',
  'invoices'
];

export const sessionService = {
  // Initialiser une nouvelle session en supprimant toutes les données existantes
  async initializeNewSession(userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      let totalDeleted = 0;

      // Pour chaque collection
      for (const collectionName of COLLECTIONS_TO_CLEAN) {
        // Récupérer tous les documents de l'utilisateur
        const q = query(
          collection(db, collectionName),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);

        // Ajouter chaque suppression au batch
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          totalDeleted++;
        });
      }

      // Si des documents à supprimer
      if (totalDeleted > 0) {
        await batch.commit();
      }

      console.log(`Session initialisée pour l'utilisateur ${userId}: ${totalDeleted} documents supprimés`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la session:', error);
      throw error;
    }
  }
};
