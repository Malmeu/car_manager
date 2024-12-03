import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const createAdminUser = async (email: string, password: string) => {
  try {
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ajouter les informations d'admin dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      isAdmin: true,
      isClient: false,
      createdAt: new Date().toISOString()
    });

    console.log('Admin user created successfully:', user.uid);
    return user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Exemple d'utilisation
// createAdminUser('admin@example.com', 'password123');

export { createAdminUser };
