import { makeUserAdmin } from './makeAdmin';

// Remplacez 'votre.email@example.com' par votre email d'administrateur
const adminEmail = 'darkvid3r@gmail.com';

makeUserAdmin(adminEmail)
  .then(() => console.log('Script terminé avec succès'))
  .catch((error) => console.error('Erreur:', error));
