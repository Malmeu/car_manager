import { db } from '../config/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Fonction pour créer un abonnement de test qui expire bientôt
export const createTestSubscription = async (userId: string) => {
  try {
    // Créer un abonnement qui expire dans 6 jours
    const sixDaysFromNow = new Date();
    sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

    const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
      userId,
      planId: 'pro',
      status: 'active',
      billingPeriod: 'monthly',
      startDate: serverTimestamp(),
      endDate: sixDaysFromNow,
      maxVehicles: 50,
      features: ['feature1', 'feature2'],
      lastBillingDate: serverTimestamp(),
      nextBillingDate: sixDaysFromNow,
      price: 29.99,
      renewalWarningShown: false,
      createdAt: serverTimestamp()
    });

    // Créer une notification de test
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'subscription_expiring',
      message: 'Votre abonnement expire dans 6 jours',
      status: 'unread',
      createdAt: serverTimestamp()
    });

    console.log('Test subscription created successfully');
    return subscriptionRef.id;
  } catch (error) {
    console.error('Error creating test subscription:', error);
    throw error;
  }
};

// Fonction pour créer un abonnement expiré
export const createExpiredSubscription = async (userId: string) => {
  try {
    // Créer un abonnement qui a expiré hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
      userId,
      planId: 'pro',
      status: 'expired',
      billingPeriod: 'monthly',
      startDate: serverTimestamp(),
      endDate: yesterday,
      maxVehicles: 50,
      features: ['feature1', 'feature2'],
      lastBillingDate: serverTimestamp(),
      nextBillingDate: yesterday,
      price: 29.99,
      renewalWarningShown: true,
      createdAt: serverTimestamp()
    });

    // Créer une notification d'expiration
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'subscription_expired',
      message: 'Votre abonnement a expiré. Veuillez le renouveler pour continuer à utiliser nos services.',
      status: 'unread',
      createdAt: serverTimestamp()
    });

    console.log('Expired subscription created successfully');
    return subscriptionRef.id;
  } catch (error) {
    console.error('Error creating expired subscription:', error);
    throw error;
  }
};
