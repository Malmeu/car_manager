import { Timestamp } from 'firebase/firestore';

export const formatDate = (date: Timestamp | Date): string => {
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('fr-FR');
  }
  return date.toLocaleDateString('fr-FR');
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('fr-FR') + ' DA';
};
