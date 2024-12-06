const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYkMNoQJm0L_AbLzz6h5qklpXuJ7oQRd0",
  authDomain: "car-rental-384323.firebaseapp.com",
  projectId: "car-rental-384323",
  storageBucket: "car-rental-384323.appspot.com",
  messagingSenderId: "1027474763970",
  appId: "1:1027474763970:web:0d420939a415af5d1a3040",
  measurementId: "G-VVEWZZXQDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const makeUserAdmin = async (email) => {
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

// Exécuter le script avec l'email spécifié
makeUserAdmin('darkvid3r@gmail.com')
  .then(() => {
    console.log('Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
