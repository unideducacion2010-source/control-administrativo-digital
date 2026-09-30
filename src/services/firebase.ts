import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SaleItem, PurchaseItem, InventoryItem, ClientItem, ExpenseItem, AdminCredentials } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface ConsolidatedAppData {
  updatedAt: string;
  deviceOrigin?: string;
  sales: SaleItem[];
  purchases: PurchaseItem[];
  inventory: InventoryItem[];
  clients: ClientItem[];
  expenses: ExpenseItem[];
  adminCredentials?: AdminCredentials;
}

const APP_STATE_DOC = 'main';

// Listen to real-time changes across PC and Mobile devices
export const subscribeToCloudSync = (
  onUpdate: (data: ConsolidatedAppData) => void,
  onError?: (err: any) => void
) => {
  const docRef = doc(db, 'app_state', APP_STATE_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ConsolidatedAppData;
        if (data && data.updatedAt) {
          onUpdate(data);
        }
      }
    },
    (error) => {
      console.warn('Error en suscripción en la nube:', error);
      if (onError) onError(error);
    }
  );
};

// Save state to cloud so any other device (PC, tablet, phone) updates in real-time
export const pushStateToCloud = async (payload: {
  sales: SaleItem[];
  purchases: PurchaseItem[];
  inventory: InventoryItem[];
  clients: ClientItem[];
  expenses: ExpenseItem[];
  adminCredentials?: AdminCredentials;
  deviceOrigin?: string;
}): Promise<boolean> => {
  try {
    const docRef = doc(db, 'app_state', APP_STATE_DOC);
    const dataToSave: ConsolidatedAppData = {
      updatedAt: new Date().toISOString(),
      deviceOrigin: payload.deviceOrigin || (window.innerWidth < 768 ? 'Móvil' : 'PC'),
      sales: payload.sales,
      purchases: payload.purchases,
      inventory: payload.inventory,
      clients: payload.clients,
      expenses: payload.expenses,
      ...(payload.adminCredentials ? { adminCredentials: payload.adminCredentials } : {}),
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return true;
  } catch (error) {
    console.error('Error guardando en Firestore:', error);
    return false;
  }
};

// Initial pull on startup to get the latest data across all devices
export const pullInitialCloudState = async (): Promise<ConsolidatedAppData | null> => {
  try {
    const docRef = doc(db, 'app_state', APP_STATE_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ConsolidatedAppData;
    }
  } catch (error) {
    console.warn('No se pudo obtener estado inicial de la nube:', error);
  }
  return null;
};
