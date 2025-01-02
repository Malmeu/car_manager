interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  // Critères de validation
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Vérification de la longueur
  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }
  
  // Vérification des caractères requis
  if (!hasUpperCase) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!hasLowerCase) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!hasNumbers) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!hasSpecialChar) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour vérifier si le mot de passe est compromis (à implémenter avec une API comme HaveIBeenPwned)
export const isPasswordCompromised = async (password: string): Promise<boolean> => {
  // TODO: Implémenter la vérification avec HaveIBeenPwned API
  return false;
};

// Fonction pour générer un mot de passe fort
export const generateStrongPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Assurer au moins un caractère de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Remplir le reste du mot de passe
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
