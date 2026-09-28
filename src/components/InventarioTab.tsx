import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Trash2, Edit3, Search } from 'lucide-react';

interface InventarioTabProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const InventarioTab: React.FC<InventarioTabProps> = ({ inventory, setInventory }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [producto, setProducto] = useState('');
  const [categoria, setCategoria] = useState('Cremas artesanales');
  const [piezasCompradas, setPiezasCompradas] = useState(10);
  const [costoUnitario, setCostoUnitario] = useState(133.33);
  const [precioVenta, setPrecioVenta] = useState(180.00);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setProducto('');
    setCategoria('Cremas artesanales');
    setPiezasCompradas(10);
    setCostoUnitario(133.33);
    setPrecioVenta(180.00);
    setShowModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const inversion = piezasCompradas * costoUnitario;
    const gananciaPorPieza = precioVenta - costoUnitario;
    const piezasDisponible = piezasCompradas;
    const gananciaPotencial = piezasDisponible * gananciaPorPieza;

    if (editingId) {
      setInventory(inventory.map(item => item.id === editingId ? {
        ...item,
        producto,
        categoria,
        piezasCompradas,
        costoUnitario,
        inversion,
        piezasDisponible: piezasCompradas - item.piezasVendidas,
        precioVenta,
        gananciaPorPieza,
        gananciaPotencial: (piezasCompradas - item.piezasVendidas) * gananciaPorPieza,
      } : item));
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        producto,
        categoria,
        piezasCompradas,
        costoUnitario,
        inversion,
        piezasVendidas: 0,
        piezasDisponible: piezasCompradas,
        precioVenta,
        gananciaPorPieza,
        gananciaPotencial,
      };
      setInventory([...inventory, newItem]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este producto del inventario?')) {
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const filteredInventory = inventory.filter(i =>
    i.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-800 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Inventario</h2>
            <p className="text-xs text-stone-500">Gestión de stock, costos e inversión de productos</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto o categoría en inventario..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-sm"
        />
      </div>

      {/* Table view */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100 text-xs font-bold uppercase tracking-wider text-stone-700">
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Compradas</th>
                <th className="p-4">Costo U.</th>
                <th className="p-4">Inversión</th>
                <th className="p-4">Disponibles</th>
                <th className="p-4">Precio Venta</th>
                <th className="p-4">Ganancia P.</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    No hay productos en inventario.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4 font-bold text-stone-800">{item.producto}</td>
                    <td className="p-4 text-stone-600">
                      <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium">{item.categoria}</span>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{item.piezasCompradas}</td>
                    <td className="p-4 text-stone-600">{formatCurrency(item.costoUnitario)}</td>
                    <td className="p-4 font-bold text-amber-800">{formatCurrency(item.inversion)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.piezasDisponible > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.piezasDisponible} disp.
                      </span>
                    </td>
                    <td className="p-4 font-bold text-stone-800">{formatCurrency(item.precioVenta)}</td>
                    <td className="p-4 font-bold text-teal-700">{formatCurrency(item.gananciaPorPieza)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 rounded-xl transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Item */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Agregar Producto al Inventario</h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  required
                  placeholder="Ej. Crema de mezcal - Café"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Categoría</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Piezas Compradas</label>
                  <input
                    type="number"
                    min="1"
                    value={piezasCompradas}
                    onChange={(e) => setPiezasCompradas(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Precio de Venta ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                  required
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
                  className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
