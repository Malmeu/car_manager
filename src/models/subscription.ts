export interface Subscription {
  id?: string;
  userId: string;
  planId: 'starter' | 'pro' | 'enterprise';
  status: 'starter' | 'trial' | 'pending' | 'active' | 'canceled' | 'expired' | 'suspended' | 'terminated' | 'paused' | 'reactivated';
  billingPeriod: 'monthly' | 'annual';
  startDate: Date;
  endDate: Date;
  maxVehicles: number;
  features: string[];
  lastBillingDate: Date;
  nextBillingDate: Date;
  price: number;
  renewalWarningShown?: boolean;
}

export interface Plan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  maxVehicles: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

export type PlanType = Plan['id'];

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    maxVehicles: 10,
    monthlyPrice: 2999,
    annualPrice: 29990,
    features: [
      'Gestion des locations',
      'Tableau de bord basique',
      'Support par email'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    maxVehicles: 25,
    monthlyPrice: 4999,
    annualPrice: 49990,
    features: [
      'Gestion des locations avancée',
      'Tableau de bord complet',
      'Support prioritaire',
      'Rapports personnalisés'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    maxVehicles: -1, // illimité
    monthlyPrice: 9999,
    annualPrice: 99990,
    features: [
      'Fonctionnalités complètes',
      'API personnalisée',
      'Support dédié 24/7',
      'Formation personnalisée'
    ]
  }
];
