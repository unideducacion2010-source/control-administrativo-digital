import React from 'react';
import { LayoutDashboard, ShoppingCart, Truck, Package, Users, Receipt, Cloud, LogOut, Menu, X, Smartphone, Monitor, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DriveConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  driveConfig: DriveConfig;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
  lastCloudSync?: string | null;
  onManualCloudSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  driveConfig,
  cloudSyncStatus = 'synced',
  lastCloudSync,
  onManualCloudSync,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { id: 'compras', label: 'Compras', icon: Truck },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'gastos', label: 'Gastos', icon: Receipt },
    { id: 'drive', label: 'Drive & Sheets', icon: Cloud },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-amber-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo / Title / Cloud Sync Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-800 leading-tight">
                  Control de Ganancias
                </h1>
                {/* Cloud Sync Status Badge */}
                <div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition bg-emerald-50 text-emerald-800 border-emerald-200"
                  title="Tus datos están enlazados en la nube entre tu PC y tu Celular en tiempo real"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <span>+</span>
                    <Smartphone className="w-3 h-3" />
                    <span className="ml-0.5">PC & Celular Sincronizados</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium truncate max-w-[180px] sm:max-w-xs">
                  {driveConfig.isConnected
                    ? `Google: ${driveConfig.accountEmail}`
                    : 'Nube activa en tiempo real'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Button Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/60 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs xl:text-sm transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-amber-800 shadow-sm font-semibold border border-amber-200/60'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onManualCloudSync && (
              <button
                onClick={onManualCloudSync}
                className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition border border-amber-200/80 active:scale-95"
                title="Forzar actualización con la nube"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-amber-700 ${
                    cloudSyncStatus === 'syncing' ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden md:inline">
                  {cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                </span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 font-medium text-sm flex items-center gap-2 transition border border-stone-200/80 active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-banner showing device link status */}
        <div className="sm:hidden pb-2 pt-0 flex items-center justify-between border-t border-amber-100/50 mt-1">
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Vinculado con PC en tiempo real</span>
          </div>
          {onManualCloudSync && (
            <button
              onClick={onManualCloudSync}
              className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Actualizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-amber-100 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-base transition ${
                  isActive
                    ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
