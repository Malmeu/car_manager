import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TwoFactorSetupResult {
  secret: string;
  backupCodes: string[];
}

// Générer un code aléatoire de 6 chiffres
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Générer des codes de backup
const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateCode());
  }
  return codes;
};

export const setupTwoFactor = async (userId: string): Promise<TwoFactorSetupResult> => {
  try {
    const backupCodes = generateBackupCodes();
    const verificationCode = generateCode();
    
    // Sauvegarder dans Firestore
    await updateDoc(doc(db, 'users', userId), {
      twoFactorEnabled: false,
      twoFactorVerificationCode: verificationCode,
      twoFactorBackupCodes: backupCodes,
      twoFactorCodeExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    return {
      secret: verificationCode,
      backupCodes
    };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw new Error('Failed to setup two-factor authentication');
  }
};

export const verifyTwoFactorToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('User not found');
    }

    const isValidCode = token === userData.twoFactorVerificationCode;
    const isValidBackupCode = userData.twoFactorBackupCodes?.includes(token);
    const isNotExpired = Date.now() < userData.twoFactorCodeExpiry;

    if ((isValidCode || isValidBackupCode) && isNotExpired) {
      // Si c'est un code de backup, le retirer de la liste
      if (isValidBackupCode) {
        const updatedBackupCodes = userData.twoFactorBackupCodes.filter(
          (code: string) => code !== token
        );
        await updateDoc(doc(db, 'users', userId), {
          twoFactorBackupCodes: updatedBackupCodes
        });
      }

      // Activer la 2FA si ce n'est pas déjà fait
      if (!userData.twoFactorEnabled) {
        await updateDoc(doc(db, 'users', userId), {
          twoFactorEnabled: true
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    throw new Error('Failed to verify two-factor token');
  }
};

export const generateNewVerificationCode = async (userId: string): Promise<string> => {
  try {
    const newCode = generateCode();
    await updateDoc(doc(db, 'users', userId), {
      twoFactorVerificationCode: newCode,
      twoFactorCodeExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    return newCode;
  } catch (error) {
    console.error('Error generating new verification code:', error);
    throw new Error('Failed to generate new verification code');
  }
};

export const disableTwoFactor = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      twoFactorEnabled: false,
      twoFactorVerificationCode: null,
      twoFactorBackupCodes: [],
      twoFactorCodeExpiry: null
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw new Error('Failed to disable two-factor authentication');
  }
};

export const isTwoFactorEnabled = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.twoFactorEnabled || false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};
