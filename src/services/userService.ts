import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  isAdmin: boolean;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  createdAt: Date;
}

export const userService = {
  // Créer un nouvel utilisateur avec profil admin
  async createAdminUser(
    email: string,
    password: string,
    profile: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer le profil utilisateur dans Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        isAdmin: true,
        ...profile,
        createdAt: new Date(),
      };

      // Sauvegarder le profil dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
      });

      return userProfile;
    } catch (error: any) {
      console.error('Erreur lors de la création du compte admin:', error);
      throw error;
    }
  },

  // Mettre à jour un utilisateur existant en admin
  async makeUserAdmin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isAdmin: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des droits admin:', error);
      throw error;
    }
  },

  // Vérifier si un utilisateur est admin
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.data()?.isAdmin || false;
    } catch (error) {
      console.error('Erreur lors de la vérification des droits admin:', error);
      return false;
    }
  }
};
