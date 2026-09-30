import React, { useState } from 'react';
import { PurchaseItem, InventoryItem } from '../types';
import { Truck, Plus, Trash2, Edit3, Search, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { normalizeText } from '../utils/antiRedundancy';

interface ComprasTabProps {
  purchases: PurchaseItem[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseItem[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const ComprasTab: React.FC<ComprasTabProps> = ({
  purchases,
  setPurchases,
  inventory,
  setInventory,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [proveedor, setProveedor] = useState('');
  const [producto, setProducto] = useState(inventory[0]?.producto || '');
  const [categoria, setCategoria] = useState('Cremas artesanales');
  const [cantidad, setCantidad] = useState(10);
  const [costoUnitario, setCostoUnitario] = useState(133.33);
  const [estado, setEstado] = useState('Recibido');
  const [notas, setNotas] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setProveedor('');
    const firstProd = inventory[0];
    setProducto(firstProd?.producto || '');
    setCategoria(firstProd?.categoria || 'Cremas artesanales');
    setCantidad(10);
    setCostoUnitario(firstProd?.costoUnitario || 133.33);
    setEstado('Recibido');
    setNotas('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: PurchaseItem) => {
    setEditingId(p.id);
    setFormError(null);
    setProveedor(p.proveedor);
    setProducto(p.producto);
    setCategoria(p.categoria);
    setCantidad(p.cantidad);
    setCostoUnitario(p.costoUnitario);
    setEstado(p.estado);
    setNotas(p.notas || '');
    setShowModal(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanProveedor = proveedor.trim();
    const cleanProducto = producto.trim();
    const cleanNotas = notas.trim();

    if (!cleanProveedor) {
      setFormError('Por favor ingrese el nombre del proveedor.');
      return;
    }
    if (!cleanProducto) {
      setFormError('Por favor ingrese el nombre del producto.');
      return;
    }
    if (cantidad <= 0) {
      setFormError('La cantidad comprada debe ser de al menos 1 pieza.');
      return;
    }
    if (costoUnitario <= 0) {
      setFormError('El costo unitario debe ser mayor a cero.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const totalInvertido = cantidad * costoUnitario;

    // Anti-redundancy check for new purchases: Warn if identical purchase registered today
    if (!editingId) {
      const duplicatePurchase = purchases.find(
        (p) =>
          p.fecha === todayStr &&
          normalizeText(p.proveedor) === normalizeText(cleanProveedor) &&
          normalizeText(p.producto) === normalizeText(cleanProducto) &&
          p.cantidad === cantidad &&
          Math.abs(p.costoUnitario - costoUnitario) < 0.01
      );

      if (duplicatePurchase) {
        setFormError(
          `⚠️ Posible orden de compra duplicada: Ya registró hoy una compra idéntica de ${cantidad} piezas de "${cleanProducto}" a "${cleanProveedor}" por un total de $${duplicatePurchase.totalInvertido}. Para evitar redundancia, edite la existente o verifique el número de factura.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    if (editingId) {
      const oldPurchase = purchases.find((p) => p.id === editingId);
      const qtyDiff = cantidad - (oldPurchase?.cantidad || 0);
      const invDiff = totalInvertido - (oldPurchase?.totalInvertido || 0);

      setPurchases(
        purchases.map((p) =>
          p.id === editingId
            ? {
                ...p,
                proveedor: cleanProveedor,
                producto: cleanProducto,
                categoria,
                cantidad,
                costoUnitario,
                totalInvertido,
                estado,
                notas: cleanNotas,
              }
            : p
        )
      );

      // Adjust inventory by difference if status is Recibido
      if (estado === 'Recibido' && qtyDiff !== 0) {
        setInventory((prev) =>
          prev.map((i) =>
            normalizeText(i.producto) === normalizeText(cleanProducto)
              ? {
                  ...i,
                  piezasCompradas: i.piezasCompradas + qtyDiff,
                  piezasDisponible: Math.max(0, i.piezasDisponible + qtyDiff),
                  inversion: i.inversion + invDiff,
                }
              : i
          )
        );
      }
      showToast('Orden de compra actualizada correctamente.');
    } else {
      const newPurchase: PurchaseItem = {
        id: `pur-${Date.now()}`,
        fecha: todayStr,
        proveedor: cleanProveedor,
        producto: cleanProducto,
        categoria,
        cantidad,
        costoUnitario,
        totalInvertido,
        estado,
        notas: cleanNotas,
      };

      setPurchases([newPurchase, ...purchases]);

      // Update inventory if status is Recibido
      if (estado === 'Recibido') {
        const existingInv = inventory.find(
          (i) => normalizeText(i.producto) === normalizeText(cleanProducto)
        );
        if (existingInv) {
          setInventory(
            inventory.map((i) =>
              i.id === existingInv.id
                ? {
                    ...i,
                    piezasCompradas: i.piezasCompradas + cantidad,
                    piezasDisponible: i.piezasDisponible + cantidad,
                    inversion: i.inversion + totalInvertido,
                    gananciaPotencial:
                      (i.piezasDisponible + cantidad) * (i.precioVenta - i.costoUnitario),
                  }
                : i
            )
          );
        } else {
          const newInvItem: InventoryItem = {
            id: `inv-${Date.now()}`,
            producto: cleanProducto,
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
      showToast(`¡Compra de ${cantidad} piezas registrada y sumada al Inventario!`);
    }

    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const purchaseToDelete = purchases.find((p) => p.id === id);
    if (
      confirm(
        `¿Desea anular esta compra de ${purchaseToDelete?.cantidad || ''} piezas a "${purchaseToDelete?.proveedor}"? Las piezas recibidas se descontarán del inventario para mantener coherencia.`
      )
    ) {
      if (purchaseToDelete && purchaseToDelete.estado === 'Recibido') {
        setInventory((prev) =>
          prev.map((item) =>
            normalizeText(item.producto) === normalizeText(purchaseToDelete.producto)
              ? {
                  ...item,
                  piezasCompradas: Math.max(0, item.piezasCompradas - purchaseToDelete.cantidad),
                  piezasDisponible: Math.max(0, item.piezasDisponible - purchaseToDelete.cantidad),
                  inversion: Math.max(0, item.inversion - purchaseToDelete.totalInvertido),
                }
              : item
          )
        );
      }
      setPurchases(purchases.filter((p) => p.id !== id));
      showToast('Compra eliminada e inventario ajustado.');
    }
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-stone-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Compras e Insumos</h2>
            <p className="text-xs text-stone-500">
              Registro de abastecimiento enlazado con inventario y protegido contra redundancias
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-md shadow-purple-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Anti-Redundancy Protection Badge */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-purple-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            <strong>Prevención de Redundancias:</strong> Detecta compras duplicadas accidentales al mismo proveedor y alimenta el stock de forma automática sin crear fichas redundantes en el catálogo.
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
                      <div className="text-xs text-stone-400">
                        {pur.fecha} {pur.notas ? `• ${pur.notas}` : ''}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{pur.producto}</td>
                    <td className="p-4 text-stone-600">{pur.cantidad} pzas</td>
                    <td className="p-4 text-stone-600">{formatCurrency(pur.costoUnitario)}</td>
                    <td className="p-4 font-bold text-purple-700">{formatCurrency(pur.totalInvertido)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{pur.estado}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(pur)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                          title="Editar Orden de Compra"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pur.id)}
                          className="p-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 rounded-xl transition"
                          title="Anular Compra"
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

      {/* Modal Add / Edit Purchase */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {editingId ? 'Editar Orden de Compra' : 'Registrar Nueva Compra'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {editingId
                ? 'Modifique los datos de la compra sin generar órdenes duplicadas.'
                : 'Seleccione o ingrese un producto. Se validará contra duplicados.'}
            </p>

            {formError && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Proveedor / Fabricante
                </label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  required
                  placeholder="Ej. Destilados del Valle S.A."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Producto (Seleccione del inventario o escriba uno nuevo)
                </label>
                <input
                  type="text"
                  list="inventory-products-list"
                  value={producto}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProducto(val);
                    const existing = inventory.find(
                      (i) => normalizeText(i.producto) === normalizeText(val)
                    );
                    if (existing) {
                      setCategoria(existing.categoria);
                      setCostoUnitario(existing.costoUnitario);
                    }
                  }}
                  required
                  placeholder="Ej. Crema de mezcal - Fresa"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <datalist id="inventory-products-list">
                  {inventory.map((i) => (
                    <option key={i.id} value={i.producto}>
                      Stock actual: {i.piezasDisponible} pzas • Costo: ${i.costoUnitario}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Cantidad Comprada
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
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
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Estado de Entrega
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Recibido">Recibido (Aumenta stock)</option>
                    <option value="Pendiente">Pendiente de entrega</option>
                    <option value="En camino">En camino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Total Invertido
                  </label>
                  <div className="px-4 py-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 font-bold text-sm">
                    {formatCurrency(cantidad * costoUnitario)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Notas / Factura / Lote
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Factura #45 con envío incluido"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
