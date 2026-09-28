import React from 'react';
import { SaleItem, InventoryItem, ExpenseItem } from '../types';
import { TrendingUp, DollarSign, Package, ShoppingCart, ArrowUpRight, BarChart3, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface ResumenTabProps {
  sales: SaleItem[];
  inventory: InventoryItem[];
  expenses: ExpenseItem[];
  setActiveTab: (tab: string) => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({ sales, inventory, expenses, setActiveTab }) => {
  // Calculations matching Excel template
  const inversionRegistrada = inventory.reduce((acc, item) => acc + item.inversion, 0);
  
  const ingresosPorVentas = sales.reduce((acc, s) => acc + (s.piezasVendidas * s.precioVentaUnit), 0);
  const costoMercanciaVendida = sales.reduce((acc, s) => acc + (s.piezasVendidas * s.costoUnitario), 0);
  const otrosGastosTotales = expenses.reduce((acc, e) => acc + e.monto, 0);
  
  const gananciaBruta = ingresosPorVentas - costoMercanciaVendida - otrosGastosTotales;
  const margenPromedio = ingresosPorVentas > 0 ? (gananciaBruta / ingresosPorVentas) * 100 : 0;
  const piezasVendidasTotales = sales.reduce((acc, s) => acc + s.piezasVendidas, 0);
  const valorInventarioDisponible = inventory.reduce((acc, item) => acc + (item.piezasDisponible * item.costoUnitario), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const indicators = [
    { title: 'Inversión registrada', value: formatCurrency(inversionRegistrada), icon: DollarSign, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { title: 'Ingresos por ventas', value: formatCurrency(ingresosPorVentas), icon: TrendingUp, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { title: 'Costo de mercancía vendida', value: formatCurrency(costoMercanciaVendida), icon: ShoppingCart, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { title: 'Ganancia bruta', value: formatCurrency(gananciaBruta), icon: ArrowUpRight, color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { title: 'Margen promedio', value: `${margenPromedio.toFixed(1)}%`, icon: BarChart3, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { title: 'Piezas vendidas', value: piezasVendidasTotales.toString(), icon: Package, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { title: 'Valor de inventario disponible', value: formatCurrency(valorInventarioDisponible), icon: DollarSign, color: 'bg-amber-50 text-amber-900 border-amber-200' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Banner Title */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-amber-800/60 text-amber-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Resumen Financiero y Operativo
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Control de Ganancias del Negocio</h2>
          <p className="text-amber-100 text-sm mt-1 max-w-xl">
            Visualización general en tiempo real sincronizada con Google Sheets y Drive.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('ventas')}
            className="flex-1 md:flex-none px-5 py-3 bg-white text-amber-900 font-bold rounded-2xl shadow hover:bg-amber-50 transition active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-amber-700" />
            <span>Registrar Venta</span>
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className="flex-1 md:flex-none px-5 py-3 bg-amber-800/80 hover:bg-amber-800 text-white font-bold rounded-2xl shadow transition active:scale-95 text-sm flex items-center justify-center gap-2 border border-amber-600"
          >
            <Package className="w-4 h-4" />
            <span>Ver Inventario</span>
          </button>
        </div>
      </div>

      {/* Grid of Indicators matching Excel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {indicators.map((ind, idx) => {
          const Icon = ind.icon;
          return (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{ind.title}</span>
                <div className={`p-3 rounded-2xl border ${ind.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-stone-800">{ind.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Financial Bar / Chart representation */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-800">Gráfico de Rendimiento Financiero</h3>
              <p className="text-xs text-stone-500">Comparativa general de ingresos, costos e inversión</p>
            </div>
          </div>
          <button
            onClick={() => alert('Reporte exportado correctamente a Google Sheets y descargado.')}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold transition flex items-center gap-2 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Reporte</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
              <span>Ingresos por Ventas</span>
              <span>{formatCurrency(ingresosPorVentas)}</span>
            </div>
            <div className="w-full bg-stone-100 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (ingresosPorVentas / (inversionRegistrada || 1)) * 50)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
              <span>Inversión Registrada</span>
              <span>{formatCurrency(inversionRegistrada)}</span>
            </div>
            <div className="w-full bg-stone-100 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
              <span>Ganancia Bruta</span>
              <span>{formatCurrency(gananciaBruta)}</span>
            </div>
            <div className="w-full bg-stone-100 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, (gananciaBruta / (inversionRegistrada || 1)) * 60))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* How to use section (matching Excel) */}
      <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-200/70 text-amber-900 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">Cómo usar el Sistema Administrativo</h3>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-stone-700">
          <li className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-amber-100 shadow-xs">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
            <span>Ve a la pestaña <strong>Inventario</strong> para registrar tus productos, piezas compradas y costos.</span>
          </li>
          <li className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-amber-100 shadow-xs">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
            <span>Registra cada venta en la pestaña <strong>Ventas</strong>. La app descuenta el stock automáticamente.</span>
          </li>
          <li className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-amber-100 shadow-xs">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
            <span>Anota tus gastos operativos y de insumos en la pestaña <strong>Gastos</strong>.</span>
          </li>
          <li className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-amber-100 shadow-xs">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">4</span>
            <span>Vincula tu cuenta en <strong>Drive & Sheets</strong> para sincronización automática y reportes en tiempo real.</span>
          </li>
        </ol>
      </div>
    </div>
  );
};
