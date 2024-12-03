import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subscription, Plan, PLANS } from '../models/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';

export const subscriptionService = {
  // Créer un nouvel abonnement
  async createSubscription(userId: string, planId: Plan['id'], billingPeriod: 'monthly' | 'annual', isTrial: boolean = false): Promise<Subscription> {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plan invalide');

    const startDate = new Date();
    const endDate = new Date();
    
    if (isTrial) {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + (billingPeriod === 'monthly' ? 1 : 12));
    }

    const price = isTrial ? 0 : (billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice);

    const subscription: Omit<Subscription, 'id'> = {
      userId,
      planId,
      status: isTrial ? 'trial' : 'pending',
      billingPeriod,
      startDate,
      endDate,
      maxVehicles: plan.maxVehicles,
      features: plan.features,
      lastBillingDate: startDate,
      nextBillingDate: endDate,
      price,
      renewalWarningShown: false
    };

    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
      ...subscription,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      lastBillingDate: Timestamp.fromDate(startDate),
      nextBillingDate: Timestamp.fromDate(endDate),
      createdAt: serverTimestamp()
    });

    // Créer une notification pour l'administrateur
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'new_subscription',
      message: `Nouvelle demande d'abonnement - Plan ${plan.name}`,
      status: 'unread',
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...subscription
    };
  },

  // Vérifier et gérer les abonnements expirés
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

      // Si l'abonnement expire dans moins de 7 jours et que l'avertissement n'a pas été montré
      if (daysRemaining <= 7 && daysRemaining > 0 && !subscription.renewalWarningShown) {
        try {
          // Créer une notification pour l'utilisateur
          await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            userId,
            type: 'subscription_expiring',
            message: `Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
            status: 'unread',
            createdAt: serverTimestamp()
          });

          // Marquer l'avertissement comme montré
          if (subscription.id) {
            const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);
            await updateDoc(subscriptionRef, {
              renewalWarningShown: true
            });
          }
        } catch (error) {
          console.error('Error updating subscription warning:', error);
        }
      }

      // Si l'abonnement est expiré
      if (daysRemaining <= 0) {
        try {
          // Mettre à jour le statut de l'abonnement
          if (subscription.id) {
            const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);
            await updateDoc(subscriptionRef, {
              status: 'expired',
              expiredAt: serverTimestamp()
            });
          }

          // Créer une notification pour l'utilisateur
          await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            userId,
            type: 'subscription_expired',
            message: 'Votre abonnement a expiré. Veuillez le renouveler pour continuer à utiliser nos services.',
            status: 'unread',
            createdAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating expired subscription:', error);
        }

        return {
          isValid: false,
          daysRemaining: 0,
          status: 'expired',
          message: 'Abonnement expiré'
        };
      }

      return {
        isValid: true,
        daysRemaining,
        status: subscription.status,
        message: daysRemaining <= 7 ? `Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}` : undefined
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return {
        isValid: false,
        daysRemaining: 0,
        status: 'error',
        message: 'Erreur lors de la vérification du statut'
      };
    }
  },

  // Renouveler un abonnement
  async renewSubscription(subscriptionId: string, billingPeriod: 'monthly' | 'annual'): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Abonnement non trouvé');
    }

    const subscription = subscriptionDoc.data();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingPeriod === 'monthly' ? 1 : 12));

    await updateDoc(subscriptionRef, {
      status: 'pending',
      billingPeriod,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      lastBillingDate: Timestamp.fromDate(startDate),
      nextBillingDate: Timestamp.fromDate(endDate),
      renewalWarningShown: false
    });

    // Créer une notification pour l'administrateur
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: subscription.userId,
      type: 'renewal_request',
      message: 'Demande de renouvellement d\'abonnement',
      status: 'unread',
      createdAt: serverTimestamp()
    });
  },

  // Obtenir l'abonnement actif d'un utilisateur
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const q = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trial']),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Vérifier que toutes les dates sont bien des Timestamps
      const startDate = data.startDate?.toDate?.() || new Date();
      const endDate = data.endDate?.toDate?.() || new Date();
      const lastBillingDate = data.lastBillingDate?.toDate?.() || new Date();
      const nextBillingDate = data.nextBillingDate?.toDate?.() || new Date();

      return {
        id: doc.id,
        userId: data.userId,
        planId: data.planId,
        status: data.status,
        billingPeriod: data.billingPeriod,
        startDate,
        endDate,
        maxVehicles: data.maxVehicles || 0,
        features: Array.isArray(data.features) ? data.features : [],
        lastBillingDate,
        nextBillingDate,
        price: data.price || 0,
        renewalWarningShown: data.renewalWarningShown || false
      } as Subscription;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return null;
    }
  },

  // Vérifier si un utilisateur peut ajouter plus de véhicules
  async canAddVehicle(userId: string, currentVehicleCount: number): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) return false;
    
    // -1 signifie illimité
    if (subscription.maxVehicles === -1) return true;
    
    return currentVehicleCount < subscription.maxVehicles;
  },

  // Annuler un abonnement
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'canceled',
      updatedAt: serverTimestamp()
    });
  },

  // Mettre à jour un abonnement (changement de plan)
  async upgradePlan(subscriptionId: string, newPlanId: Plan['id']): Promise<void> {
    const plan = PLANS.find(p => p.id === newPlanId);
    if (!plan) throw new Error('Plan invalide');

    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    const subscription = subscriptionDoc.data() as Subscription;

    const price = subscription.billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

    await updateDoc(subscriptionRef, {
      planId: newPlanId,
      maxVehicles: plan.maxVehicles,
      features: plan.features,
      price,
      updatedAt: serverTimestamp()
    });
  },

  // Approuver un abonnement
  async approveSubscription(subscriptionId: string): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'active',
      updatedAt: serverTimestamp()
    });
  },

  // Rejeter un abonnement
  async rejectSubscription(subscriptionId: string): Promise<void> {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
  }
};
