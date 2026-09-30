import React, { useState } from 'react';
import { InventoryItem, PurchaseItem } from '../types';
import { Package, Plus, Trash2, Edit3, Search, Truck, ArrowUpRight, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { findDuplicateProduct } from '../utils/antiRedundancy';

interface InventarioTabProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  purchases?: PurchaseItem[];
  setPurchases?: React.Dispatch<React.SetStateAction<PurchaseItem[]>>;
}

export const InventarioTab: React.FC<InventarioTabProps> = ({
  inventory,
  setInventory,
  purchases = [],
  setPurchases,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showReabastecerModal, setShowReabastecerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new/edit product
  const [producto, setProducto] = useState('');
  const [categoria, setCategoria] = useState('Cremas artesanales');
  const [proveedor, setProveedor] = useState('Inventario Inicial');
  const [piezasCompradas, setPiezasCompradas] = useState(10);
  const [costoUnitario, setCostoUnitario] = useState(133.33);
  const [precioVenta, setPrecioVenta] = useState(180.00);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Reabastecer state
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockCost, setRestockCost] = useState(133.33);
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setProducto('');
    setCategoria('Cremas artesanales');
    setProveedor('Inventario Inicial');
    setPiezasCompradas(10);
    setCostoUnitario(133.33);
    setPrecioVenta(180.00);
    setShowModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormError(null);
    setProducto(item.producto);
    setCategoria(item.categoria);
    setProveedor('');
    setPiezasCompradas(item.piezasCompradas);
    setCostoUnitario(item.costoUnitario);
    setPrecioVenta(item.precioVenta);
    setShowModal(true);
  };

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedProductForRestock(item);
    setRestockQty(10);
    setRestockCost(item.costoUnitario);
    setRestockSupplier('');
    setRestockNotes(`Reabastecimiento de ${item.producto}`);
    setShowReabastecerModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanProducto = producto.trim();
    if (!cleanProducto) {
      setFormError('El nombre del producto no puede estar vacío.');
      return;
    }

    // Anti-redundancy protection
    const duplicate = findDuplicateProduct(inventory, cleanProducto, editingId);
    if (duplicate) {
      setFormError(
        `⚠️ Redundancia evitada: Ya existe el producto "${duplicate.producto}" en su catálogo (${duplicate.piezasDisponible} piezas en stock). Para evitar duplicidad de registros, reabastezca o edite el producto existente.`
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const inversion = piezasCompradas * costoUnitario;
    const gananciaPorPieza = precioVenta - costoUnitario;
    const piezasDisponible = piezasCompradas;
    const gananciaPotencial = piezasDisponible * gananciaPorPieza;

    if (editingId) {
      setInventory(
        inventory.map((item) =>
          item.id === editingId
            ? {
                ...item,
                producto: cleanProducto,
                categoria,
                piezasCompradas,
                costoUnitario,
                inversion,
                piezasDisponible: piezasCompradas - item.piezasVendidas,
                precioVenta,
                gananciaPorPieza,
                gananciaPotencial: (piezasCompradas - item.piezasVendidas) * gananciaPorPieza,
              }
            : item
        )
      );
      showToast(`Producto "${cleanProducto}" actualizado correctamente.`);
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        producto: cleanProducto,
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

      // Sincronización bidireccional automática: Registra la compra en el menú de Compras
      if (setPurchases && piezasCompradas > 0) {
        const newPurchase: PurchaseItem = {
          id: `pur-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          proveedor: proveedor.trim() || 'Inventario Inicial',
          producto: cleanProducto,
          categoria,
          cantidad: piezasCompradas,
          costoUnitario,
          totalInvertido: inversion,
          estado: 'Recibido',
          notas: 'Alta registrada automáticamente desde el módulo de Inventario',
        };
        setPurchases((prev) => [newPurchase, ...prev]);
        showToast(`¡Producto agregado al Inventario y registrado en Compras!`);
      } else {
        showToast(`Producto "${cleanProducto}" agregado al Inventario.`);
      }
    }
    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;

    const totalInvertido = restockQty * restockCost;

    // 1. Registrar en Compras
    if (setPurchases) {
      const newPurchase: PurchaseItem = {
        id: `pur-${Date.now()}`,
        fecha: new Date().toISOString().split('T')[0],
        proveedor: restockSupplier.trim() || 'Proveedor Recurrente',
        producto: selectedProductForRestock.producto,
        categoria: selectedProductForRestock.categoria,
        cantidad: restockQty,
        costoUnitario: restockCost,
        totalInvertido,
        estado: 'Recibido',
        notas: restockNotes || 'Reabastecimiento de stock',
      };
      setPurchases((prev) => [newPurchase, ...prev]);
    }

    // 2. Sumar stock en Inventario
    setInventory((prev) =>
      prev.map((i) =>
        i.id === selectedProductForRestock.id
          ? {
              ...i,
              piezasCompradas: i.piezasCompradas + restockQty,
              piezasDisponible: i.piezasDisponible + restockQty,
              inversion: i.inversion + totalInvertido,
              gananciaPotencial:
                (i.piezasDisponible + restockQty) * (i.precioVenta - i.costoUnitario),
            }
          : i
      )
    );

    showToast(`¡${restockQty} piezas añadidas al stock de ${selectedProductForRestock.producto} y registradas en Compras!`);
    setShowReabastecerModal(false);
  };

  const handleDelete = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (confirm(`¿Desea eliminar "${item?.producto || 'este producto'}" del inventario?`)) {
      setInventory(inventory.filter((i) => i.id !== id));
      showToast('Producto eliminado del inventario.');
    }
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-stone-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-800 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Inventario</h2>
            <p className="text-xs text-stone-500">
              Gestión de stock, costos e inversión enlazado directamente con Compras
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Synchronized Banner Tip */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-stone-700">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Sincronización Total:</strong> Todo producto que des de alta aquí se registra automáticamente en el menú de <strong>Compras</strong> para que nunca tengas descuadres de stock ni de inversión.
          </span>
        </div>
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
          placeholder="Buscar producto por nombre o categoría..."
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
                <th className="p-4">Ganancia/Pza</th>
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
                    <td className="p-4 text-stone-500">{item.categoria}</td>
                    <td className="p-4 font-semibold text-stone-800">{item.piezasCompradas}</td>
                    <td className="p-4 text-stone-600">{formatCurrency(item.costoUnitario)}</td>
                    <td className="p-4 font-bold text-amber-800">{formatCurrency(item.inversion)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.piezasDisponible > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.piezasDisponible} disp.
                      </span>
                    </td>
                    <td className="p-4 font-bold text-stone-800">{formatCurrency(item.precioVenta)}</td>
                    <td className="p-4 font-bold text-teal-700">{formatCurrency(item.gananciaPorPieza)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition font-semibold text-xs flex items-center gap-1"
                          title="Registrar nueva compra / reabastecer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Reabastecer</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
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

      {/* Modal Add / Edit Product */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {editingId ? 'Editar Producto' : 'Agregar Producto al Inventario'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {!editingId &&
                'Al guardar, se creará también el registro de compra inicial en el menú Compras.'}
            </p>

            {formError && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  required
                  placeholder="Ej. Crema de mezcal - Café"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                    placeholder="Ej. Bebidas artesanales"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Proveedor / Origen
                    </label>
                    <input
                      type="text"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      placeholder="Ej. Distribuidor Central o Inventario Inicial"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Piezas Compradas
                  </label>
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Costo Unitario ($)
                  </label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Precio de Venta ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Inversión total calculada:</span>
                  <span className="font-bold text-amber-900">
                    {formatCurrency(piezasCompradas * costoUnitario)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ganancia proyectada por pieza:</span>
                  <span className="font-bold text-emerald-800">
                    {formatCurrency(precioVenta - costoUnitario)} (
                    {Math.round(((precioVenta - costoUnitario) / precioVenta) * 100 || 0)}%)
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-600/20 transition active:scale-95"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar en Inventario y Compras'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reabastecer (Restock) */}
      {showReabastecerModal && selectedProductForRestock && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800">
                  Reabastecer / Registrar Compra
                </h3>
                <p className="text-xs text-stone-500">
                  Producto: <span className="font-bold text-stone-800">{selectedProductForRestock.producto}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="Ej. Distribuidora Oaxaca"
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Nuevas Piezas Compradas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Costo Unitario ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockCost}
                    onChange={(e) => setRestockCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Notas de Compra / Lote
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Ej. Lote recibido en buen estado"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="flex justify-between">
                  <span>Stock disponible actual:</span>
                  <span className="font-bold">{selectedProductForRestock.piezasDisponible} pzas</span>
                </div>
                <div className="flex justify-between">
                  <span>Nuevo stock disponible resultante:</span>
                  <span className="font-bold text-purple-800">
                    {selectedProductForRestock.piezasDisponible + restockQty} pzas
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total inversión de esta compra:</span>
                  <span className="font-bold text-purple-800">
                    {formatCurrency(restockQty * restockCost)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReabastecerModal(false)}
                  className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 transition active:scale-95"
                >
                  Guardar Compra y Sumar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
