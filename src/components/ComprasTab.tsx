import React, { useState } from 'react';
import { PurchaseItem, InventoryItem } from '../types';
import { Truck, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';

interface ComprasTabProps {
  purchases: PurchaseItem[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseItem[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const ComprasTab: React.FC<ComprasTabProps> = ({ purchases, setPurchases, inventory, setInventory }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [proveedor, setProveedor] = useState('');
  const [producto, setProducto] = useState(inventory[0]?.producto || '');
  const [categoria, setCategoria] = useState('Cremas artesanales');
  const [cantidad, setCantidad] = useState(10);
  const [costoUnitario, setCostoUnitario] = useState(133.33);
  const [estado, setEstado] = useState('Recibido');
  const [notas, setNotas] = useState('');

  const handleOpenAdd = () => {
    setProveedor('');
    setProducto(inventory[0]?.producto || '');
    setCategoria('Cremas artesanales');
    setCantidad(10);
    setCostoUnitario(133.33);
    setEstado('Recibido');
    setNotas('');
    setShowModal(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const totalInvertido = cantidad * costoUnitario;

    const newPurchase: PurchaseItem = {
      id: `pur-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      proveedor,
      producto,
      categoria,
      cantidad,
      costoUnitario,
      totalInvertido,
      estado,
      notas,
    };

    setPurchases([newPurchase, ...purchases]);

    // Update inventory if status is Recibido
    if (estado === 'Recibido') {
      const existingInv = inventory.find(i => i.producto === producto);
      if (existingInv) {
        setInventory(inventory.map(i => i.producto === producto ? {
          ...i,
          piezasCompradas: i.piezasCompradas + cantidad,
          piezasDisponible: i.piezasDisponible + cantidad,
          inversion: i.inversion + totalInvertido,
          gananciaPotencial: (i.piezasDisponible + cantidad) * (i.precioVenta - i.costoUnitario),
        } : i));
      } else {
        const newInvItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          producto,
          categoria,
          piezasCompradas: cantidad,
          costoUnitario,
          inversion: totalInvertido,
          piezasVendidas: 0,
          piezasDisponible: cantidad,
          precioVenta: costoUnitario * 1.35,
          gananciaPorPieza: costoUnitario * 0.35,
          gananciaPotencial: cantidad * (costoUnitario * 0.35),
        };
        setInventory([...inventory, newInvItem]);
      }
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de compra?')) {
      setPurchases(purchases.filter(p => p.id !== id));
    }
  };

  const filteredPurchases = purchases.filter(p =>
    p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Compras e Insumos</h2>
            <p className="text-xs text-stone-500">Registro de proveedores, lotes de compra y abastecimiento</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-md shadow-purple-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Compra</span>
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
          placeholder="Buscar compra por proveedor, producto o notas..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-sm"
        />
      </div>

      {/* Table view */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100 text-xs font-bold uppercase tracking-wider text-stone-700">
                <th className="p-4">Fecha / Proveedor</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Cantidad</th>
                <th className="p-4">Costo U.</th>
                <th className="p-4">Total Invertido</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-stone-800">{pur.proveedor}</div>
                      <div className="text-xs text-stone-400">{pur.fecha} {pur.notas ? `• ${pur.notas}` : ''}</div>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{pur.producto}</td>
                    <td className="p-4 text-stone-600">{pur.cantidad} pzas</td>
                    <td className="p-4 text-stone-600">{formatCurrency(pur.costoUnitario)}</td>
                    <td className="p-4 font-bold text-purple-700">{formatCurrency(pur.totalInvertido)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {pur.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(pur.id)}
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

      {/* Modal Add Purchase */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Registrar Nueva Compra</h3>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Proveedor / Fabricante</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  required
                  placeholder="Ej. Destilados del Valle S.A."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Producto</label>
                <input
                  type="text"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  required
                  placeholder="Ej. Crema de mezcal - Fresa"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Cantidad Comprada</label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Notas / Factura</label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Lote #45 con envío incluido"
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
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
