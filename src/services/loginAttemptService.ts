const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes

interface LoginAttempt {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | undefined;
}

const STORAGE_KEY_PREFIX = 'login_attempts_';

export const loginAttemptService = {
  getStorageKey(email: string): string {
    return `${STORAGE_KEY_PREFIX}${email}`;
  },

  getAttempts(email: string): LoginAttempt | null {
    const stored = localStorage.getItem(this.getStorageKey(email));
    if (!stored) return null;
    return JSON.parse(stored);
  },

  setAttempts(email: string, attempts: LoginAttempt): void {
    localStorage.setItem(this.getStorageKey(email), JSON.stringify(attempts));
  },

  async checkLoginAttempts(email: string): Promise<{ allowed: boolean; remainingAttempts: number; lockoutTime?: Date }> {
    const attempt = this.getAttempts(email);
    const now = Date.now();
    
    if (!attempt) {
      // Premier essai de connexion
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // Vérifier si le compte est verrouillé
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime: new Date(attempt.lockedUntil)
      };
    }

    // Si le compte était verrouillé mais que le temps est écoulé
    if (attempt.lockedUntil && attempt.lockedUntil <= now) {
      await this.resetAttempts(email);
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // Vérifier si les tentatives précédentes sont assez anciennes pour être réinitialisées
    const timeSinceLastAttempt = now - attempt.lastAttempt;
    if (timeSinceLastAttempt >= LOCKOUT_DURATION) {
      await this.resetAttempts(email);
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    return {
      allowed: attempt.attempts < MAX_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempt.attempts)
    };
  },

  async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    const attempt = this.getAttempts(email);
    const now = Date.now();

    if (!attempt) {
      // Première tentative
      this.setAttempts(email, {
        attempts: success ? 0 : 1,
        lastAttempt: now,
        lockedUntil: undefined
      });
      return;
    }

    if (success) {
      // Réinitialiser en cas de succès
      await this.resetAttempts(email);
      return;
    }

    const newAttempts = attempt.attempts + 1;
    const update: LoginAttempt = {
      attempts: newAttempts,
      lastAttempt: now,
      lockedUntil: undefined
    };

    // Verrouiller le compte si le nombre maximum de tentatives est atteint
    if (newAttempts >= MAX_ATTEMPTS) {
      update.lockedUntil = now + LOCKOUT_DURATION;
    }

    this.setAttempts(email, update);
  },

  async resetAttempts(email: string): Promise<void> {
    this.setAttempts(email, {
      attempts: 0,
      lastAttempt: Date.now(),
      lockedUntil: undefined
    });
  },

  getFormattedLockoutTime(lockoutTime: Date): string {
    const now = Date.now();
    const remainingTime = Math.max(0, lockoutTime.getTime() - now);
    const minutes = Math.ceil(remainingTime / (60 * 1000));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};
