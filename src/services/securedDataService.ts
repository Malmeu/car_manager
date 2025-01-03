import { EncryptionService, EncryptedObject } from './encryptionService';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Types pour les données sensibles
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  drivingLicense: string;
  identityCard: string;
  bankDetails?: {
    iban: string;
    bic: string;
    accountHolder: string;
  };
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  insuranceDetails?: {
    policyNumber: string;
    provider: string;
    expiryDate: string;
  };
  maintenanceRecords?: {
    date: string;
    description: string;
    cost: number;
    provider: string;
  }[];
}

// Champs à chiffrer pour chaque type
const CUSTOMER_ENCRYPTED_FIELDS: (keyof Customer)[] = [
  'email',
  'phone',
  'address',
  'drivingLicense',
  'identityCard',
  'bankDetails'
];

const VEHICLE_ENCRYPTED_FIELDS: (keyof Vehicle)[] = [
  'vin',
  'insuranceDetails',
  'maintenanceRecords'
];

export class SecuredDataService {
  private static encryptionKey: string;

  /**
   * Initialise le service avec une clé de chiffrement
   * @param key La clé de chiffrement à utiliser
   */
  static initialize(key: string) {
    this.encryptionKey = key;
  }

  /**
   * Vérifie si le service a été initialisé
   */
  private static checkInitialization() {
    if (!this.encryptionKey) {
      throw new Error('SecuredDataService n\'a pas été initialisé. Appelez initialize() d\'abord.');
    }
  }

  /**
   * Enregistre un nouveau client avec les données sensibles chiffrées
   */
  static async createCustomer(customer: Customer): Promise<string> {
    this.checkInitialization();

    const encryptedCustomer = await EncryptionService.encryptFields(
      customer,
      CUSTOMER_ENCRYPTED_FIELDS,
      this.encryptionKey
    );

    const customerRef = doc(db, 'customers', customer.id);
    await setDoc(customerRef, encryptedCustomer);

    return customer.id;
  }

  /**
   * Récupère un client et déchiffre ses données sensibles
   */
  static async getCustomer(customerId: string): Promise<Customer | null> {
    this.checkInitialization();

    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      return null;
    }

    const encryptedCustomer = customerDoc.data() as EncryptedObject<Customer>;
    return await EncryptionService.decryptFields(
      encryptedCustomer,
      CUSTOMER_ENCRYPTED_FIELDS,
      this.encryptionKey
    );
  }

  /**
   * Met à jour les données d'un client
   */
  static async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    this.checkInitialization();

    const encryptedUpdates = await EncryptionService.encryptFields(
      updates,
      CUSTOMER_ENCRYPTED_FIELDS,
      this.encryptionKey
    );

    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, encryptedUpdates);
  }

  /**
   * Enregistre un nouveau véhicule avec les données sensibles chiffrées
   */
  static async createVehicle(vehicle: Vehicle): Promise<string> {
    this.checkInitialization();

    const encryptedVehicle = await EncryptionService.encryptFields(
      vehicle,
      VEHICLE_ENCRYPTED_FIELDS,
      this.encryptionKey
    );

    const vehicleRef = doc(db, 'vehicles', vehicle.id);
    await setDoc(vehicleRef, encryptedVehicle);

    return vehicle.id;
  }

  /**
   * Récupère un véhicule et déchiffre ses données sensibles
   */
  static async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    this.checkInitialization();

    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);

    if (!vehicleDoc.exists()) {
      return null;
    }

    const encryptedVehicle = vehicleDoc.data() as EncryptedObject<Vehicle>;
    return await EncryptionService.decryptFields(
      encryptedVehicle,
      VEHICLE_ENCRYPTED_FIELDS,
      this.encryptionKey
    );
  }

  /**
   * Met à jour les données d'un véhicule
   */
  static async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    this.checkInitialization();

    const encryptedUpdates = await EncryptionService.encryptFields(
      updates,
      VEHICLE_ENCRYPTED_FIELDS,
      this.encryptionKey
    );

    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, encryptedUpdates);
  }
}
