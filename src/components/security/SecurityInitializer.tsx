import { useEffect } from 'react';
import { SecuredDataService } from '../../services/securedDataService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant qui initialise les services de sécurité au démarrage de l'application
 */
export default function SecurityInitializer() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Utiliser l'ID de l'utilisateur comme base pour la clé de chiffrement
      // Dans un environnement de production, vous devriez utiliser une clé plus sécurisée
      const encryptionKey = `${currentUser.uid}-${process.env.REACT_APP_ENCRYPTION_SALT || 'default-salt'}`;
      SecuredDataService.initialize(encryptionKey);
    }
  }, [currentUser]);

  return null; // Ce composant ne rend rien
}
