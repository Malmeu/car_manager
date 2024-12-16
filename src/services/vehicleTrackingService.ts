import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { 
  VehicleTracking, 
  Maintenance, 
  Mileage, 
  Insurance, 
  Receipt, 
  Condition as VehicleCondition,
  DamagePoint
} from '../types/vehicleTracking';
import axios from 'axios';
import { API_URL } from '../config/api';

// Fonction helper pour sauvegarder les fichiers localement
const saveFileLocally = async (file: File, vehicleId: string, type: string): Promise<string> => {
  try {
    console.log('Preparing to upload file:', { file, vehicleId, type });
    const formData = new FormData();
    // Important: L'ordre des append est important ici
    formData.append('vehicleId', vehicleId);
    formData.append('type', type);
    formData.append('file', file);
    
    console.log('FormData content:', {
      vehicleId: formData.get('vehicleId'),
      type: formData.get('type'),
      file: formData.get('file')
    });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Upload failed:', data);
      throw new Error(data.error || 'Failed to upload file');
    }
    
    console.log('Upload successful:', data);
    return data.path;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

const isFirestoreTimestamp = (value: any): value is FirestoreTimestamp => {
  return value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value;
};

const convertToDate = (date: string | Date | FirestoreTimestamp | any): Date => {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  if (isFirestoreTimestamp(date)) {
    return new Date(date.seconds * 1000);
  }
  return new Date();
};

// Maintenance
export const addMaintenance = async (vehicleId: string, maintenance: Omit<Maintenance, 'id'>, documents?: File[]) => {
  const maintenanceData = {
    ...maintenance,
    date: maintenance.date instanceof Date ? maintenance.date.toISOString() : maintenance.date,
    nextMaintenanceDate: maintenance.nextMaintenanceDate instanceof Date ? 
      maintenance.nextMaintenanceDate.toISOString() : 
      maintenance.nextMaintenanceDate,
  };
  
  if (documents) {
    const paths = await Promise.all(
      documents.map(file => 
        saveFileLocally(file, vehicleId, 'maintenance')
      )
    );
    maintenanceData.documents = paths;
  }
  
  const docRef = await addDoc(collection(db, `vehicles/${vehicleId}/maintenances`), maintenanceData);
  return { id: docRef.id, ...maintenanceData };
};

export const updateMaintenance = async (vehicleId: string, maintenanceId: string, maintenance: Omit<Maintenance, 'id'>, documents?: File[]) => {
  const maintenanceData = {
    ...maintenance,
    date: maintenance.date instanceof Date ? maintenance.date.toISOString() : maintenance.date,
    nextMaintenanceDate: maintenance.nextMaintenanceDate instanceof Date ? 
      maintenance.nextMaintenanceDate.toISOString() : 
      maintenance.nextMaintenanceDate,
  };
  
  if (documents) {
    const paths = await Promise.all(
      documents.map(file => 
        saveFileLocally(file, vehicleId, 'maintenance')
      )
    );
    maintenanceData.documents = [...(maintenance.documents || []), ...paths];
  }
  
  await updateDoc(doc(db, `vehicles/${vehicleId}/maintenances/${maintenanceId}`), maintenanceData);
  return { id: maintenanceId, ...maintenanceData };
};

export const deleteMaintenance = async (vehicleId: string, maintenanceId: string) => {
  await deleteDoc(doc(db, `vehicles/${vehicleId}/maintenances/${maintenanceId}`));
};

// Kilométrage
export const addMileage = async (vehicleId: string, mileage: Omit<Mileage, 'id'>) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (vehicleDoc.exists()) {
      const data = vehicleDoc.data();
      const newMileage = {
        ...mileage,
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        date: new Date(mileage.date).toISOString(),
      };
      
      const mileages = data.mileages || [];
      mileages.push(newMileage);
      
      // Calculer le nouveau kilométrage total
      const mileageSum = mileages.reduce((sum: number, m: any) => sum + (m.value || 0), 0);
      const baseMileage = data.baseMileage || 0;
      const totalMileage = baseMileage + mileageSum;

      await updateDoc(vehicleRef, {
        mileages: mileages,
        currentMileage: totalMileage
      });
      
      return newMileage;
    } else {
      const newMileage = {
        ...mileage,
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        date: new Date(mileage.date).toISOString(),
      };

      const newDoc = {
        mileages: [newMileage],
        currentMileage: mileage.value || 0,
        baseMileage: 0
      };
      
      await updateDoc(vehicleRef, newDoc);
      return newMileage;
    }
  } catch (error) {
    console.error('Error adding mileage:', error);
    throw error;
  }
};

export const deleteMileage = async (vehicleId: string, mileageId: string) => {
  try {
    console.log('Deleting mileage:', { vehicleId, mileageId }); // Debug log
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (vehicleDoc.exists()) {
      const data = vehicleDoc.data();
      const mileages = data.mileages || [];
      console.log('Current mileages:', mileages); // Debug log
      
      const updatedMileages = mileages.filter((m: any) => {
        console.log('Comparing:', { currentId: m.id, targetId: mileageId }); // Debug log
        return m.id !== mileageId;
      });
      
      console.log('Updated mileages:', updatedMileages); // Debug log
      
      // Mettre à jour à la fois les mileages et le kilométrage total
      const mileageSum = updatedMileages.reduce((sum: number, m: any) => sum + (m.value || 0), 0);
      const baseMileage = data.baseMileage || 0;
      const totalMileage = baseMileage + mileageSum;

      await updateDoc(vehicleRef, {
        mileages: updatedMileages,
        currentMileage: totalMileage
      });
      
      console.log('Mileage deleted successfully'); // Debug log
      return true;
    }
    
    console.log('Vehicle document not found'); // Debug log
    return false;
  } catch (error) {
    console.error('Error in deleteMileage:', error);
    throw error;
  }
};

export const calculateTotalMileage = (baseMileage: number, mileages: Mileage[]): number => {
  // Calculer la somme des relevés
  const mileageSum = mileages.reduce((sum, mileage) => sum + (mileage.value || 0), 0);
  
  // Retourner le kilométrage total (initial + somme des relevés)
  return baseMileage + mileageSum;
};

// Assurance
export const addInsurance = async (vehicleId: string, insurance: Omit<Insurance, 'id'>, documents?: File[]) => {
  const insuranceData = {
    ...insurance,
    startDate: insurance.startDate instanceof Date ? insurance.startDate.toISOString() : insurance.startDate,
    endDate: insurance.endDate instanceof Date ? insurance.endDate.toISOString() : insurance.endDate,
  };
  
  if (documents) {
    const paths = await Promise.all(
      documents.map(file => 
        saveFileLocally(file, vehicleId, 'insurance')
      )
    );
    insuranceData.documents = paths;
  }
  
  const docRef = await addDoc(collection(db, `vehicles/${vehicleId}/insurances`), insuranceData);
  return { id: docRef.id, ...insuranceData };
};

// Quittance
export const addReceipt = async (vehicleId: string, receipt: Omit<Receipt, 'id'>, documents?: File[]) => {
  const receiptData = {
    ...receipt,
    date: receipt.date instanceof Date ? receipt.date.toISOString() : receipt.date,
    validUntil: receipt.validUntil instanceof Date ? receipt.validUntil.toISOString() : receipt.validUntil,
  };
  
  if (documents) {
    const paths = await Promise.all(
      documents.map(file => 
        saveFileLocally(file, vehicleId, 'receipt')
      )
    );
    receiptData.documents = paths;
  }
  
  const docRef = await addDoc(collection(db, `vehicles/${vehicleId}/receipts`), receiptData);
  return { id: docRef.id, ...receiptData };
};

// État et constat
interface Condition {
  id: string;
  date: string | Date;
  description: string;
  severity: 'faible' | 'moyen' | 'grave';
  repaired: boolean;
  cost?: number;
  documents?: string[];
  damagePoints?: Record<string, DamagePoint[]>;
  photos?: string[];
}

interface VehicleData {
  id: string;
  conditions: Condition[];
}

export const addCondition = async (vehicleId: string, condition: Omit<Condition, 'id'>): Promise<Condition> => {
  try {
    console.log('Adding condition for vehicle:', vehicleId, condition);
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      throw new Error('Vehicle not found');
    }

    const newCondition = {
      ...condition,
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      date: new Date(condition.date)
    };
    
    // Récupérer les conditions existantes
    const data = vehicleDoc.data();
    const conditions = Array.isArray(data.conditions) ? data.conditions : [];
    
    // Ajouter la nouvelle condition
    conditions.push(newCondition);
    
    // Mettre à jour le document avec le nouveau tableau de conditions
    await updateDoc(vehicleRef, {
      conditions: conditions
    });
    
    console.log('Condition added successfully:', newCondition);
    return newCondition;
  } catch (error) {
    console.error('Error adding condition:', error);
    throw error;
  }
};

export const deleteCondition = async (vehicleId: string, conditionId: string): Promise<void> => {
  try {
    console.log('Deleting condition:', vehicleId, conditionId);
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      throw new Error('Vehicle not found');
    }

    const data = vehicleDoc.data();
    const conditions = Array.isArray(data.conditions) ? data.conditions : [];
    const updatedConditions = conditions.filter((c: Condition) => c.id !== conditionId);
    
    await updateDoc(vehicleRef, {
      conditions: updatedConditions
    });
    
    console.log('Condition deleted successfully');
  } catch (error) {
    console.error('Error deleting condition:', error);
    throw error;
  }
};

export const addConditionFirestore = async (
  vehicleId: string, 
  condition: Omit<Condition, 'id'>, 
  photos?: File[], 
  documents?: File[]
): Promise<Condition> => {
  const conditionData: Omit<Condition, 'id'> = {
    ...condition,
    date: condition.date instanceof Date ? condition.date.toISOString() : condition.date,
    photos: [],
    documents: []
  };

  if (photos) {
    const photoPaths = await Promise.all(
      photos.map(photo => 
        saveFileLocally(photo, vehicleId, 'condition-photo')
      )
    );
    conditionData.photos = photoPaths;
  }

  if (documents) {
    const documentPaths = await Promise.all(
      documents.map(doc => 
        saveFileLocally(doc, vehicleId, 'condition-document')
      )
    );
    conditionData.documents = documentPaths;
  }
  
  const docRef = await addDoc(collection(db, `vehicles/${vehicleId}/conditions`), conditionData);
  return { id: docRef.id, ...conditionData };
};

export const getVehicleData = async (vehicleId: string): Promise<VehicleData> => {
  try {
    console.log('Getting vehicle data:', vehicleId);
    const response = await axios.get(`${API_URL}/vehicles/${vehicleId}`);
    console.log('Vehicle data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting vehicle data:', error);
    throw error;
  }
};

export const migrateConditions = async (vehicleId: string): Promise<void> => {
  try {
    console.log('Starting conditions migration for vehicle:', vehicleId);
    
    // Récupérer le document du véhicule
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      console.log('Vehicle not found');
      return;
    }

    const vehicleData = vehicleDoc.data();
    
    // Récupérer les anciennes conditions de la sous-collection
    const conditionsRef = collection(db, `vehicles/${vehicleId}/conditions`);
    const conditionsSnapshot = await getDocs(conditionsRef);
    
    const oldConditions = conditionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Condition));
    
    console.log('Found old conditions:', oldConditions);
    
    // Fusionner avec les conditions existantes dans le document principal
    const existingConditions = Array.isArray(vehicleData.conditions) 
      ? vehicleData.conditions.map(c => ({ ...c } as Condition))
      : [];
    
    // Créer un Map pour dédupliquer par ID
    const conditionsMap = new Map<string, Condition>();
    
    // Ajouter d'abord les conditions existantes
    existingConditions.forEach((condition: Condition) => {
      conditionsMap.set(condition.id, {
        ...condition,
        date: convertToDate(condition.date),
        severity: condition.severity || 'faible',
        repaired: condition.repaired || false,
        cost: typeof condition.cost === 'number' ? condition.cost : 0,
        documents: Array.isArray(condition.documents) ? condition.documents : [],
        photos: Array.isArray(condition.photos) ? condition.photos : [],
        damagePoints: condition.damagePoints || {}
      });
    });
    
    // Ajouter/mettre à jour avec les anciennes conditions
    oldConditions.forEach((condition: Condition) => {
      conditionsMap.set(condition.id, {
        ...condition,
        date: convertToDate(condition.date),
        severity: condition.severity || 'faible',
        repaired: condition.repaired || false,
        cost: typeof condition.cost === 'number' ? condition.cost : 0,
        documents: Array.isArray(condition.documents) ? condition.documents : [],
        photos: Array.isArray(condition.photos) ? condition.photos : [],
        damagePoints: condition.damagePoints || {}
      });
    });
    
    // Convertir le Map en tableau
    const mergedConditions = Array.from(conditionsMap.values());
    
    console.log('Merged conditions:', mergedConditions);
    
    // Mettre à jour le document avec toutes les conditions
    await updateDoc(vehicleRef, {
      conditions: mergedConditions
    });
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during conditions migration:', error);
    throw error;
  }
};

// Récupérer toutes les données de suivi pour un véhicule
export const getVehicleTracking = async (vehicleId: string): Promise<VehicleTracking | null> => {
  try {
    console.log('Fetching vehicle tracking data for ID:', vehicleId);
    
    // Migrer les conditions si nécessaire
    await migrateConditions(vehicleId);
    
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicle tracking data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle tracking:', error);
    return null;
  }
};

export const uploadDocument = async (file: File, vehicleId: string, type: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', vehicleId);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    const data = await response.json();
    return data.path;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};
