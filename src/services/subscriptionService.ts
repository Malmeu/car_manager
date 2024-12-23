import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subscription, Plan, PLANS, BillingPeriod } from '../models/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const PAYMENTS_COLLECTION = 'payments';
const ACTIVITIES_COLLECTION = 'activities';

// Fonction utilitaire pour mettre à jour le statut d'un abonnement
const updateSubscriptionStatus = async (subscriptionId: string, status: Subscription['status']): Promise<void> => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await updateDoc(subscriptionRef, { status });
};

export const subscriptionService = {
  // Créer un nouvel abonnement
  async createSubscription(
    userId: string,
    planId: Plan['id'],
    billingPeriod: BillingPeriod = 'monthly',
    isTrial: boolean = false
  ): Promise<Subscription> {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan invalide: ${planId}`);
    }

    const now = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + (billingPeriod === 'monthly' ? 1 : 12));

    const subscription: Omit<Subscription, 'id'> = {
      userId,
      planId,
      status: isTrial ? 'trial' : 'pending',
      startDate: now,
      endDate: nextBillingDate,
      billingPeriod,
      nextBillingDate,
      maxVehicles: plan.maxVehicles,
      maxExpenses: plan.maxExpenses || 0,
      features: plan.features,
      price: billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
    };

    // Créer l'abonnement dans Firestore
    const subscriptionRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscription);
    
    console.log('Creating notification for subscription:', subscriptionRef.id);
    // Créer une notification pour l'administrateur
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type: 'pending_subscription',
      userId,
      subscriptionId: subscriptionRef.id,
      status: 'unread',
      createdAt: serverTimestamp(),
      message: `Nouvelle demande d'abonnement ${plan.name} (${billingPeriod})`
    });
    console.log('Notification created with ID:', notificationRef.id);

    // Créer automatiquement un paiement associé
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      userId,
      subscriptionId: subscriptionRef.id,
      amount: subscription.price,
      date: Timestamp.now(),
      status: 'pending',
      method: 'CCP', // Méthode par défaut
      description: 'Paiement abonnement mensuel',
      createdAt: Timestamp.now()
    });

    // Ajouter une activité
    await addDoc(collection(db, ACTIVITIES_COLLECTION), {
      type: 'subscription',
      userId,
      message: 'Nouvel abonnement créé',
      date: Timestamp.now(),
      status: 'success'
    });

    return {
      ...subscription,
      id: subscriptionRef.id
    };
  },

  // Renouveler un abonnement
  async renewSubscription(subscriptionId: string, billingPeriod: BillingPeriod): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Abonnement non trouvé');
    }

    const subscription = subscriptionDoc.data() as Subscription;
    const plan = PLANS.find(p => p.id === subscription.planId);
    
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    const startDate = new Date();
    const endDate = new Date();
    const duration = billingPeriod === 'monthly' ? plan.duration : plan.duration * 12;
    endDate.setDate(endDate.getDate() + duration);

    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

    await updateDoc(subscriptionRef, {
      status: 'active',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      nextBillingDate: Timestamp.fromDate(endDate),
      billingPeriod,
      price
    });

    // Créer automatiquement un paiement associé
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      userId: subscription.userId,
      subscriptionId,
      amount: price,
      date: Timestamp.now(),
      status: 'pending',
      method: 'CCP', // Méthode par défaut
      description: 'Paiement abonnement mensuel',
      createdAt: Timestamp.now()
    });
  },

  // Mettre à niveau un abonnement
  async upgradePlan(subscriptionId: string, newPlanId: Exclude<Plan['id'], 'trial'>): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Abonnement non trouvé');
    }

    const subscription = subscriptionDoc.data() as Subscription;
    const newPlan = PLANS.find(p => p.id === newPlanId);
    
    if (!newPlan) {
      throw new Error('Nouveau plan non trouvé');
    }

    const price = subscription.billingPeriod === 'monthly' ? newPlan.monthlyPrice : newPlan.annualPrice;

    await updateDoc(subscriptionRef, {
      planId: newPlanId,
      price,
      maxVehicles: newPlan.maxVehicles,
      features: newPlan.features,
      status: 'active'
    });

    // Créer automatiquement un paiement associé
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      userId: subscription.userId,
      subscriptionId,
      amount: price,
      date: Timestamp.now(),
      status: 'pending',
      method: 'CCP', // Méthode par défaut
      description: 'Paiement abonnement mensuel',
      createdAt: Timestamp.now()
    });
  },

  // Vérifier le statut de l'abonnement
  async checkSubscriptionStatus(userId: string): Promise<{
    isValid: boolean;
    daysRemaining: number;
    status: string;
    message?: string;
  }> {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      
      if (!subscription) {
        return {
          isValid: false,
          daysRemaining: 0,
          status: 'no_subscription',
          message: 'Aucun abonnement actif'
        };
      }

      const now = new Date();
      const endDate = subscription.endDate;
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Mettre à jour le statut comme expiré
        await updateSubscriptionStatus(subscription.id!, 'expired');
        
        return {
          isValid: false,
          daysRemaining: 0,
          status: 'expired',
          message: 'Votre abonnement a expiré'
        };
      }

      // Avertissement pour l'essai gratuit
      if (subscription.status === 'trial' && daysRemaining <= 2) {
        return {
          isValid: true,
          daysRemaining,
          status: 'trial_ending',
          message: `Votre période d'essai se termine dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
        };
      }

      return {
        isValid: true,
        daysRemaining,
        status: subscription.status,
        message: subscription.status === 'pending' ? 'En attente d\'approbation' : undefined
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
  },

  // Obtenir l'abonnement actif
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const q = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where('userId', '==', userId),
        where('status', 'in', ['trial', 'active', 'pending'])
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        nextBillingDate: data.nextBillingDate.toDate()
      } as Subscription;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      throw error;
    }
  },

  // Vérifier si l'utilisateur peut ajouter plus de véhicules
  async canAddVehicle(userId: string, currentVehicleCount: number): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      if (!subscription) return false;
      
      // Si c'est un plan enterprise (-1), pas de limite
      if (subscription.maxVehicles === -1) return true;
      
      return currentVehicleCount < subscription.maxVehicles;
    } catch (error) {
      console.error('Error checking vehicle limit:', error);
      throw error;
    }
  },

  // Approuver un abonnement
  async approveSubscription(subscriptionId: string): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Abonnement non trouvé');
    }

    const subscription = subscriptionDoc.data() as Subscription;
    const now = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + (subscription.billingPeriod === 'monthly' ? 1 : 12));

    await updateDoc(subscriptionRef, {
      status: 'active',
      startDate: now,
      endDate: nextBillingDate,
      nextBillingDate
    });

    // Créer une notification pour l'utilisateur
    console.log('Creating notification for subscription approval:', subscriptionId);
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type: 'subscription_approved',
      userId: subscription.userId,
      subscriptionId,
      status: 'unread',
      createdAt: serverTimestamp(),
      message: 'Votre abonnement a été approuvé et est maintenant actif'
    });
    console.log('Notification created with ID:', notificationRef.id);

    // Créer automatiquement un paiement associé
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      userId: subscription.userId,
      subscriptionId,
      amount: subscription.price,
      date: Timestamp.now(),
      status: 'pending',
      method: 'CCP', // Méthode par défaut
      description: 'Paiement abonnement mensuel',
      createdAt: Timestamp.now()
    });
  },

  // Rejeter un abonnement
  async rejectSubscription(subscriptionId: string): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Abonnement non trouvé');
    }

    const subscription = subscriptionDoc.data() as Subscription;

    await updateDoc(subscriptionRef, {
      status: 'expired'
    });

    // Créer une notification pour l'utilisateur
    console.log('Creating notification for subscription rejection:', subscriptionId);
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      type: 'subscription_rejected',
      userId: subscription.userId,
      subscriptionId,
      status: 'unread',
      createdAt: serverTimestamp(),
      message: 'Votre demande d\'abonnement a été rejetée'
    });
    console.log('Notification created with ID:', notificationRef.id);
  }
};
