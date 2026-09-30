import React, { useState } from 'react';
import { SaleItem, InventoryItem } from '../types';
import { Plus, Trash2, Edit3, ShoppingCart, Search, FileSpreadsheet, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface VentasTabProps {
  sales: SaleItem[];
  setSales: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const VentasTab: React.FC<VentasTabProps> = ({ sales, setSales, inventory, setInventory }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState(inventory[0]?.producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [precioVentaUnit, setPrecioVentaUnit] = useState(inventory[0]?.precioVenta || 180);
  const [otrosGastos, setOtrosGastos] = useState(0);
  const [notas, setNotas] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    const firstProd = inventory[0];
    setSelectedProduct(firstProd?.producto || '');
    setCantidad(1);
    setPrecioVentaUnit(firstProd?.precioVenta || 180);
    setOtrosGastos(0);
    setNotas('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: SaleItem) => {
    setEditingId(s.id);
    setFormError(null);
    setSelectedProduct(s.producto);
    setCantidad(s.cantidad);
    setPrecioVentaUnit(s.precioVentaUnit);
    setOtrosGastos(s.otrosGastos);
    setNotas(s.notas || '');
    setShowModal(true);
  };

  const handleProductChange = (prodName: string) => {
    setSelectedProduct(prodName);
    const found = inventory.find((i) => i.producto === prodName);
    if (found) {
      setPrecioVentaUnit(found.precioVenta);
    }
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const invItem = inventory.find((i) => i.producto === selectedProduct);
    if (!invItem) {
      setFormError('Debe seleccionar un producto válido que exista en el Inventario.');
      return;
    }

    if (cantidad <= 0) {
      setFormError('La cantidad vendida debe ser de al menos 1 pieza.');
      return;
    }

    // Check stock available if new sale or increasing quantity
    if (!editingId && cantidad > invItem.piezasDisponible) {
      setFormError(
        `⚠️ Redundancia / Stock insuficiente: Solo cuenta con ${invItem.piezasDisponible} piezas disponibles de "${selectedProduct}". No se puede registrar una venta que exceda el stock real.`
      );
      return;
    }

    if (editingId) {
      const oldSale = sales.find((s) => s.id === editingId);
      const diff = cantidad - (oldSale?.cantidad || 0);
      if (diff > invItem.piezasDisponible) {
        setFormError(
          `⚠️ Stock insuficiente: Requiere ${diff} piezas adicionales, pero solo hay ${invItem.piezasDisponible} disponibles.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    const costoUnit = invItem.costoUnitario || 100;
    const categoria = invItem.categoria || 'General';
    
    const ingresos = cantidad * precioVentaUnit;
    const costoMercancia = cantidad * costoUnit;
    const ganancia = ingresos - costoMercancia - otrosGastos;
    const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

    if (editingId) {
      const oldSale = sales.find((s) => s.id === editingId);
      const qtyDiff = cantidad - (oldSale?.cantidad || 0);

      setSales(
        sales.map((s) =>
          s.id === editingId
            ? {
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
              }
            : s
        )
      );

      // Adjust inventory by difference
      if (qtyDiff !== 0) {
        setInventory(
          inventory.map((i) =>
            i.producto === selectedProduct
              ? {
                  ...i,
                  piezasVendidas: i.piezasVendidas + qtyDiff,
                  piezasDisponible: Math.max(0, i.piezasDisponible - qtyDiff),
                }
              : i
          )
        );
      }
      showToast('Venta actualizada y stock recalculado.');
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

      // Deduct stock cleanly
      setInventory(
        inventory.map((i) =>
          i.producto === selectedProduct
            ? {
                ...i,
                piezasVendidas: i.piezasVendidas + cantidad,
                piezasDisponible: Math.max(0, i.piezasDisponible - cantidad),
              }
            : i
        )
      );
      showToast(`¡Venta de ${cantidad} piezas registrada con éxito!`);
    }

    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const saleToDelete = sales.find((s) => s.id === id);
    if (
      confirm(
        `¿Desea anular esta venta de ${saleToDelete?.cantidad || ''} piezas de "${saleToDelete?.producto}"? Las piezas se restituirán automáticamente al inventario.`
      )
    ) {
      if (saleToDelete) {
        setInventory((prev) =>
          prev.map((item) =>
            item.producto === saleToDelete.producto
              ? {
                  ...item,
                  piezasVendidas: Math.max(0, item.piezasVendidas - saleToDelete.cantidad),
                  piezasDisponible: item.piezasDisponible + saleToDelete.cantidad,
                }
              : item
          )
        );
      }
      setSales(sales.filter((s) => s.id !== id));
      showToast('Venta anulada y existencias devueltas al inventario.');
    }
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

      {/* Anti-Redundancy Protection Badge */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Control de Stock & Anti-Duplicados:</strong> El sistema valida en tiempo real la disponibilidad en inventario para evitar ventas que superen el stock real. Al anular una venta, las piezas regresan a bodega automáticamente sin pérdidas ni redundancias.
          </span>
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
                          onClick={() => handleOpenEdit(s)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                          title="Editar Venta"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 rounded-xl transition"
                          title="Anular Venta"
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
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {editingId ? 'Editar Venta' : 'Registrar Nueva Venta'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {editingId
                ? 'Modifique los datos de la venta. El stock se ajustará según la diferencia.'
                : 'Seleccione el producto. El sistema verificará que exista stock suficiente.'}
            </p>

            {formError && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}
            
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
