import React, { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { ResumenTab } from './components/ResumenTab';
import { VentasTab } from './components/VentasTab';
import { ComprasTab } from './components/ComprasTab';
import { InventarioTab } from './components/InventarioTab';
import { ClientesTab } from './components/ClientesTab';
import { GastosTab } from './components/GastosTab';
import { DriveSheetsTab } from './components/DriveSheetsTab';
import { initialSales, initialInventory, initialExpenses, initialPurchases, initialClients } from './data/initialData';
import { SaleItem, InventoryItem, ExpenseItem, PurchaseItem, ClientItem, DriveConfig, AdminCredentials } from './types';
import { deduplicateById } from './utils/antiRedundancy';
import {
  subscribeToCloudSync,
  pullInitialCloudState,
  pushStateToCloud,
  ConsolidatedAppData,
} from './services/firebase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  // Cloud sync status across PC and mobile
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // Ref to avoid cyclic echo pushes when receiving updates from remote devices
  const isRemoteSyncRef = useRef<boolean>(false);
  const lastSyncTimestampRef = useRef<string>('');

  const [sales, setSales] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem('app_sales_data');
    if (saved) {
      try { return deduplicateById(JSON.parse(saved)); } catch (e) {}
    }
    return deduplicateById(initialSales);
  });

  const [purchases, setPurchases] = useState<PurchaseItem[]>(() => {
    const saved = localStorage.getItem('app_purchases_data');
    if (saved) {
      try { return deduplicateById(JSON.parse(saved)); } catch (e) {}
    }
    return deduplicateById(initialPurchases);
  });

  const [clients, setClients] = useState<ClientItem[]>(() => {
    const saved = localStorage.getItem('app_clients_data');
    if (saved) {
      try { return deduplicateById(JSON.parse(saved)); } catch (e) {}
    }
    return deduplicateById(initialClients);
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('app_inventory_data');
    if (saved) {
      try { return deduplicateById(JSON.parse(saved)); } catch (e) {}
    }
    return deduplicateById(initialInventory);
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('app_expenses_data');
    if (saved) {
      try { return deduplicateById(JSON.parse(saved)); } catch (e) {}
    }
    return deduplicateById(initialExpenses);
  });

  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    const saved = localStorage.getItem('app_admin_credentials');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      username: 'admin',
      password: 'admin123',
      lastUpdated: 'Por defecto',
    };
  });

  const [driveConfig, setDriveConfig] = useState<DriveConfig>(() => {
    const saved = localStorage.getItem('app_drive_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      isConnected: false,
      accountEmail: '',
      spreadsheetId: '',
      spreadsheetUrl: '',
      folderUrl: '',
      rootFolderName: '',
      lastSynced: null,
      autoSync: true,
      foldersCreated: [],
    };
  });

  // Local storage synchronization as offline cache
  useEffect(() => {
    localStorage.setItem('app_sales_data', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('app_purchases_data', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('app_clients_data', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('app_inventory_data', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('app_expenses_data', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('app_admin_credentials', JSON.stringify(adminCredentials));
  }, [adminCredentials]);

  useEffect(() => {
    localStorage.setItem('app_drive_config', JSON.stringify(driveConfig));
  }, [driveConfig]);

  // Initial cloud synchronization: pull remote data or push local if cloud is uninitialized
  useEffect(() => {
    let isMounted = true;

    const initCloud = async () => {
      try {
        setCloudSyncStatus('syncing');
        const remoteData = await pullInitialCloudState();

        if (remoteData && remoteData.updatedAt) {
          // Cloud has existing state: apply it so PC & Mobile see the identical state
          isRemoteSyncRef.current = true;
          lastSyncTimestampRef.current = remoteData.updatedAt;

          if (remoteData.sales) setSales(deduplicateById(remoteData.sales));
          if (remoteData.purchases) setPurchases(deduplicateById(remoteData.purchases));
          if (remoteData.inventory) setInventory(deduplicateById(remoteData.inventory));
          if (remoteData.clients) setClients(deduplicateById(remoteData.clients));
          if (remoteData.expenses) setExpenses(deduplicateById(remoteData.expenses));
          if (remoteData.adminCredentials) setAdminCredentials(remoteData.adminCredentials);

          setLastCloudSync(remoteData.updatedAt);
          setCloudSyncStatus('synced');
        } else {
          // Cloud is empty: push initial/local state from this device to cloud
          const now = new Date().toISOString();
          lastSyncTimestampRef.current = now;
          await pushStateToCloud({
            sales,
            purchases,
            inventory,
            clients,
            expenses,
            adminCredentials,
          });
          setLastCloudSync(now);
          setCloudSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Error inicializando nube:', err);
        setCloudSyncStatus('offline');
      }
    };

    initCloud();

    // Listen for real-time changes pushed from other devices (e.g. from cell phone to PC or vice versa)
    const unsubscribe = subscribeToCloudSync(
      (remoteData: ConsolidatedAppData) => {
        if (!isMounted) return;

        // Only adopt if the update is newer and didn't originate from our own local push
        if (remoteData.updatedAt && remoteData.updatedAt !== lastSyncTimestampRef.current) {
          isRemoteSyncRef.current = true;
          lastSyncTimestampRef.current = remoteData.updatedAt;

          if (remoteData.sales) setSales(deduplicateById(remoteData.sales));
          if (remoteData.purchases) setPurchases(deduplicateById(remoteData.purchases));
          if (remoteData.inventory) setInventory(deduplicateById(remoteData.inventory));
          if (remoteData.clients) setClients(deduplicateById(remoteData.clients));
          if (remoteData.expenses) setExpenses(deduplicateById(remoteData.expenses));
          if (remoteData.adminCredentials) setAdminCredentials(remoteData.adminCredentials);

          setLastCloudSync(remoteData.updatedAt);
          setCloudSyncStatus('synced');
        }
      },
      () => {
        setCloudSyncStatus('offline');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Automatic push to cloud when local data changes (debounced by 800ms)
  useEffect(() => {
    // If the change came from the remote device, don't echo back
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setCloudSyncStatus('syncing');
      const now = new Date().toISOString();
      lastSyncTimestampRef.current = now;

      const success = await pushStateToCloud({
        sales,
        purchases,
        inventory,
        clients,
        expenses,
        adminCredentials,
      });

      if (success) {
        setLastCloudSync(now);
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [sales, purchases, inventory, clients, expenses, adminCredentials]);

  // Force manual cloud sync on demand
  const handleManualCloudSync = async () => {
    setCloudSyncStatus('syncing');
    const remoteData = await pullInitialCloudState();

    if (remoteData && remoteData.updatedAt) {
      isRemoteSyncRef.current = true;
      lastSyncTimestampRef.current = remoteData.updatedAt;

      if (remoteData.sales) setSales(deduplicateById(remoteData.sales));
      if (remoteData.purchases) setPurchases(deduplicateById(remoteData.purchases));
      if (remoteData.inventory) setInventory(deduplicateById(remoteData.inventory));
      if (remoteData.clients) setClients(deduplicateById(remoteData.clients));
      if (remoteData.expenses) setExpenses(deduplicateById(remoteData.expenses));
      if (remoteData.adminCredentials) setAdminCredentials(remoteData.adminCredentials);

      setLastCloudSync(remoteData.updatedAt);
      setCloudSyncStatus('synced');
    } else {
      const now = new Date().toISOString();
      lastSyncTimestampRef.current = now;
      await pushStateToCloud({
        sales,
        purchases,
        inventory,
        clients,
        expenses,
        adminCredentials,
      });
      setLastCloudSync(now);
      setCloudSyncStatus('synced');
    }
  };

  const handleLoginSuccess = (adminStatus: boolean) => {
    setIsAdmin(adminStatus);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} adminCredentials={adminCredentials} />;
  }

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-800 flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setIsLoggedIn(false)}
        driveConfig={driveConfig}
        cloudSyncStatus={cloudSyncStatus}
        lastCloudSync={lastCloudSync}
        onManualCloudSync={handleManualCloudSync}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'resumen' && (
          <ResumenTab
            sales={sales}
            inventory={inventory}
            expenses={expenses}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'ventas' && (
          <VentasTab
            sales={sales}
            setSales={setSales}
            inventory={inventory}
            setInventory={setInventory}
          />
        )}
        {activeTab === 'compras' && (
          <ComprasTab
            purchases={purchases}
            setPurchases={setPurchases}
            inventory={inventory}
            setInventory={setInventory}
          />
        )}
        {activeTab === 'inventario' && (
          <InventarioTab
            inventory={inventory}
            setInventory={setInventory}
            purchases={purchases}
            setPurchases={setPurchases}
          />
        )}
        {activeTab === 'clientes' && (
          <ClientesTab
            clients={clients}
            setClients={setClients}
          />
        )}
        {activeTab === 'gastos' && (
          <GastosTab
            expenses={expenses}
            setExpenses={setExpenses}
          />
        )}
        {activeTab === 'drive' && (
          <DriveSheetsTab
            driveConfig={driveConfig}
            setDriveConfig={setDriveConfig}
            sales={sales}
            purchases={purchases}
            inventory={inventory}
            clients={clients}
            expenses={expenses}
          />
        )}
      </main>
    </div>
  );
}
