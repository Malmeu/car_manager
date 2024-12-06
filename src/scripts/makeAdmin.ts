import { auth, db } from '../config/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const makeUserAdmin = async (email: string) => {
  try {
    // Trouver l'utilisateur dans Firebase Auth
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('Aucun utilisateur trouvé avec cet email');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    
    // Mettre à jour le document utilisateur avec les droits admin
    await updateDoc(doc(db, 'users', userDoc.id), {
      isAdmin: true,
      updatedAt: new Date().toISOString()
    });

    console.log('Utilisateur promu administrateur avec succès:', email);
  } catch (error) {
    console.error('Erreur lors de la promotion de l\'utilisateur:', error);
    throw error;
  }
};

// Pour utiliser le script, décommentez la ligne suivante et remplacez l'email
// makeUserAdmin('votre-email@example.com');
