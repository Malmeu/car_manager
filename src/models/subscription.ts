export type BillingPeriod = 'monthly' | 'annual';

export interface Subscription {
  id?: string;
  userId: string;
  planId: 'trial' | 'basic' | 'pro' | 'enterprise';
  status: 'trial' | 'pending' | 'active' | 'expired' | 'suspended';
  startDate: Date;
  endDate: Date;
  maxVehicles: number;
  maxExpenses: number;
  features: string[];
  price: number;
  billingPeriod: BillingPeriod;
  nextBillingDate: Date;
  userName?: string;
}

export interface Plan {
  id: 'trial' | 'basic' | 'pro' | 'enterprise';
  name: string;
  maxVehicles: number;
  maxExpenses: number;
  monthlyPrice: number;
  annualPrice: number;
  duration: number; // en jours
  features: string[];
}

export type PlanType = 'trial' | 'basic' | 'pro' | 'enterprise';

export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Essai Gratuit',
    maxVehicles: 5,
    maxExpenses: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    duration: 7,
    features: [
      'Accès à toutes les fonctionnalités',
      'Limité à 5 véhicules',
      'Durée de 7 jours'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    maxVehicles: 20,
    maxExpenses: 50,
    monthlyPrice: 5000,
    annualPrice: 50000,
    duration: 30,
    features: [
      'Toutes les fonctionnalités',
      'Jusqu\'à 20 véhicules',
      'Mises à jour à vie',
      'Support standard'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    maxVehicles: 50,
    maxExpenses: 100,
    monthlyPrice: 10000,
    annualPrice: 100000,
    duration: 30,
    features: [
      'Toutes les fonctionnalités',
      'Jusqu\'à 50 véhicules',
      'Mises à jour à vie',
      'Support prioritaire'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    maxVehicles: -1, // illimité
    maxExpenses: -1, // illimité
    monthlyPrice: -1, // sur devis
    annualPrice: -1, // sur devis
    duration: 30,
    features: [
      'Toutes les fonctionnalités',
      'Véhicules illimités',
      'Mises à jour à vie',
      'Support prioritaire',
      'Configuration personnalisée'
    ]
  }
];
