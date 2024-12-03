import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Invoice, generateInvoiceNumber } from '../models/invoice';
import { Subscription } from '../models/subscription';

const INVOICES_COLLECTION = 'invoices';
const NOTIFICATIONS_COLLECTION = 'notifications';

export const invoiceService = {
  // Créer une nouvelle facture
  async createInvoice(subscription: Subscription): Promise<Invoice> {
    // Récupérer le dernier numéro de facture
    const lastInvoiceQuery = query(
      collection(db, INVOICES_COLLECTION),
      orderBy('number', 'desc'),
      limit(1)
    );
    const lastInvoiceSnapshot = await getDocs(lastInvoiceQuery);
    const lastInvoiceNumber = lastInvoiceSnapshot.empty ? 0 : 
      parseInt(lastInvoiceSnapshot.docs[0].data().number.split('-')[2]);

    const invoice: Omit<Invoice, 'id'> = {
      userId: subscription.userId,
      subscriptionId: subscription.id!,
      number: generateInvoiceNumber(lastInvoiceNumber),
      amount: subscription.price,
      status: 'pending',
      billingPeriod: subscription.billingPeriod,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      planName: subscription.planId
    };

    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
      ...invoice,
      issueDate: Timestamp.fromDate(invoice.issueDate),
      dueDate: Timestamp.fromDate(invoice.dueDate),
      createdAt: serverTimestamp()
    });

    // Créer une notification pour l'administrateur
    await this.createAdminNotification(
      'Nouvelle demande d\'abonnement',
      `Nouveau client pour le plan ${subscription.planId}. Facture ${invoice.number} en attente.`
    );

    return {
      id: docRef.id,
      ...invoice
    };
  },

  // Marquer une facture comme payée
  async markAsPaid(invoiceId: string): Promise<void> {
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await updateDoc(invoiceRef, {
      status: 'paid',
      paidDate: Timestamp.fromDate(new Date()),
      updatedAt: serverTimestamp()
    });
  },

  // Obtenir les factures d'un utilisateur
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, INVOICES_COLLECTION),
        where('userId', '==', userId),
        orderBy('issueDate', 'desc'),
        limit(50) // Limiter le nombre de factures récupérées
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        issueDate: (doc.data().issueDate as Timestamp).toDate(),
        dueDate: (doc.data().dueDate as Timestamp).toDate(),
        paidDate: doc.data().paidDate ? (doc.data().paidDate as Timestamp).toDate() : undefined
      })) as Invoice[];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      return [];
    }
  },

  // Créer une notification pour l'administrateur
  async createAdminNotification(title: string, message: string): Promise<void> {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      title,
      message,
      type: 'admin',
      read: false,
      createdAt: serverTimestamp()
    });
  },

  // Créer une notification pour l'utilisateur
  async createUserNotification(userId: string, title: string, message: string): Promise<void> {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      title,
      message,
      type: 'user',
      read: false,
      createdAt: serverTimestamp()
    });
  }
};
