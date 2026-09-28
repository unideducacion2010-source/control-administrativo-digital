import React, { useState, useEffect } from 'react';
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
import { SaleItem, InventoryItem, ExpenseItem, PurchaseItem, ClientItem, DriveConfig } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  const [sales, setSales] = useState<SaleItem[]>(initialSales);
  const [purchases, setPurchases] = useState<PurchaseItem[]>(initialPurchases);
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
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

  useEffect(() => {
    localStorage.setItem('app_drive_config', JSON.stringify(driveConfig));
  }, [driveConfig]);

  const handleLoginSuccess = (adminStatus: boolean) => {
    setIsAdmin(adminStatus);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-800 flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setIsLoggedIn(false)}
        driveConfig={driveConfig}
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

      <footer className="bg-white border-t border-amber-100 py-4 text-center text-xs text-stone-500">
        Control Administrativo © 2026 Todos los derechos reservados.
      </footer>
    </div>
  );
}
