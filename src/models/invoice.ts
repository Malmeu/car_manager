export interface Invoice {
  id?: string;
  userId: string;
  subscriptionId: string;
  number: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  billingPeriod: 'monthly' | 'annual';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  planName: string;
  companyDetails?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
  };
}

export const generateInvoiceNumber = (lastNumber?: number): string => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const sequence = (lastNumber ? lastNumber + 1 : 1).toString().padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};
