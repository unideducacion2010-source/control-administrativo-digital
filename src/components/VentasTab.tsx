import React, { useState } from 'react';
import { SaleItem, InventoryItem } from '../types';
import { Plus, Trash2, Edit3, ShoppingCart, Search, FileSpreadsheet } from 'lucide-react';

interface VentasTabProps {
  sales: SaleItem[];
  setSales: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const VentasTab: React.FC<VentasTabProps> = ({ sales, setSales, inventory, setInventory }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState(inventory[0]?.producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [precioVentaUnit, setPrecioVentaUnit] = useState(inventory[0]?.precioVenta || 180);
  const [otrosGastos, setOtrosGastos] = useState(0);
  const [notas, setNotas] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setSelectedProduct(inventory[0]?.producto || '');
    setCantidad(1);
    setPrecioVentaUnit(inventory[0]?.precioVenta || 180);
    setOtrosGastos(0);
    setNotas('');
    setShowModal(true);
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    const invItem = inventory.find((i) => i.producto === selectedProduct);
    const costoUnit = invItem ? invItem.costoUnitario : 100;
    const categoria = invItem ? invItem.categoria : 'General';
    
    const ingresos = cantidad * precioVentaUnit;
    const costoMercancia = cantidad * costoUnit;
    const ganancia = ingresos - costoMercancia - otrosGastos;
    const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

    if (editingId) {
      setSales(sales.map(s => s.id === editingId ? {
        ...s,
        producto: selectedProduct,
        categoria,
        cantidad,
        costoUnitario: costoUnit,
        precioVentaUnit,
        piezasVendidas: cantidad,
        ingresos,
        costoMercancia,
        otrosGastos,
        ganancia,
        margen,
        notas,
      } : s));
    } else {
      const newSale: SaleItem = {
        id: `sale-${Date.now()}`,
        fecha: new Date().toISOString().split('T')[0],
        producto: selectedProduct,
        categoria,
        cantidad,
        costoUnitario: costoUnit,
        precioVentaUnit,
        piezasVendidas: cantidad,
        ingresos,
        costoMercancia,
        otrosGastos,
        ganancia,
        margen,
        notas,
      };
      setSales([newSale, ...sales]);

      // Update inventory stock
      if (invItem) {
        setInventory(inventory.map(i => i.producto === selectedProduct ? {
          ...i,
          piezasVendidas: i.piezasVendidas + cantidad,
          piezasDisponible: Math.max(0, i.piezasDisponible - cantidad),
        } : i));
      }
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setSales(sales.filter(s => s.id !== id));
  };

  const filteredSales = sales.filter(s => 
    s.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Registro de Ventas</h2>
            <p className="text-xs text-stone-500">Administre y registre todas las ventas del negocio</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-md shadow-amber-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar venta por producto, categoría o notas..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-sm"
        />
      </div>

      {/* Mobile Card View / Desktop Table View */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100 text-xs font-bold uppercase tracking-wider text-stone-700">
                <th className="p-4">Fecha / Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Cantidad</th>
                <th className="p-4">Precio U.</th>
                <th className="p-4">Ingresos</th>
                <th className="p-4">Ganancia</th>
                <th className="p-4">Margen</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No hay ventas registradas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-stone-800">{s.producto}</div>
                      <div className="text-xs text-stone-400">{s.fecha} {s.notas ? `• ${s.notas}` : ''}</div>
                    </td>
                    <td className="p-4 text-stone-600">
                      <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium">{s.categoria}</span>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{s.cantidad}</td>
                    <td className="p-4 text-stone-600">{formatCurrency(s.precioVentaUnit)}</td>
                    <td className="p-4 font-bold text-emerald-700">{formatCurrency(s.ingresos || s.cantidad * s.precioVentaUnit)}</td>
                    <td className="p-4 font-bold text-teal-700">{formatCurrency(s.ganancia || (s.cantidad * s.precioVentaUnit) - (s.cantidad * s.costoUnitario))}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold">
                        {s.margen ? s.margen.toFixed(1) : '20.0'}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 rounded-xl transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Registrar Nueva Venta</h3>
            
            <form onSubmit={handleSaveSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const inv = inventory.find(i => i.producto === e.target.value);
                    if (inv) setPrecioVentaUnit(inv.precioVenta);
                  }}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.producto}>
                      {inv.producto} (Disponible: {inv.piezasDisponible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Cantidad de Piezas</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Precio Venta Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={precioVentaUnit}
                    onChange={(e) => setPrecioVentaUnit(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Otros Gastos Asociados ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={otrosGastos}
                  onChange={(e) => setOtrosGastos(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Notas / Cliente</label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Venta al contado / Local"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
