import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { Receipt, Plus, Trash2, Edit3, Search, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { normalizeText } from '../utils/antiRedundancy';

interface GastosTabProps {
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
}

export const GastosTab: React.FC<GastosTabProps> = ({ expenses, setExpenses }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [concepto, setConcepto] = useState('');
  const [tipo, setTipo] = useState('Insumos');
  const [monto, setMonto] = useState(100);
  const [notas, setNotas] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setConcepto('');
    setTipo('Insumos');
    setMonto(100);
    setNotas('');
    setShowModal(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingId(exp.id);
    setFormError(null);
    setConcepto(exp.concepto);
    setTipo(exp.tipo);
    setMonto(exp.monto);
    setNotas(exp.notas || '');
    setShowModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanConcepto = concepto.trim();
    if (!cleanConcepto) {
      setFormError('El concepto del gasto no puede estar vacío.');
      return;
    }

    if (monto <= 0) {
      setFormError('El monto del gasto debe ser mayor a cero.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Anti-redundancy check: Warn if an identical expense was recorded today
    if (!editingId) {
      const duplicateExpense = expenses.find(
        (exp) =>
          exp.fecha === todayStr &&
          normalizeText(exp.concepto) === normalizeText(cleanConcepto) &&
          Math.abs(exp.monto - monto) < 0.01 &&
          exp.tipo === tipo
      );

      if (duplicateExpense) {
        setFormError(
          `⚠️ Posible gasto duplicado: Ya registró hoy un gasto por "${duplicateExpense.concepto}" de $${duplicateExpense.monto} en la categoría "${duplicateExpense.tipo}". Para evitar redundancia, edite el existente o diferencie la descripción.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    if (editingId) {
      setExpenses(
        expenses.map((e) =>
          e.id === editingId
            ? {
                ...e,
                concepto: cleanConcepto,
                tipo,
                monto,
                notas: notas.trim(),
              }
            : e
        )
      );
      showToast(`Gasto "${cleanConcepto}" actualizado correctamente.`);
    } else {
      const newExpense: ExpenseItem = {
        id: `exp-${Date.now()}`,
        fecha: todayStr,
        concepto: cleanConcepto,
        tipo,
        monto,
        notas: notas.trim(),
      };
      setExpenses([newExpense, ...expenses]);
      showToast(`Gasto de $${monto} registrado exitosamente.`);
    }

    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (confirm(`¿Desea eliminar el gasto "${exp?.concepto || 'este gasto'}"?`)) {
      setExpenses(expenses.filter((e) => e.id !== id));
      showToast('Gasto eliminado.');
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const totalGastos = expenses.reduce((acc, e) => acc + e.monto, 0);

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
          <div className="p-3 bg-red-100 text-red-800 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Gastos</h2>
            <p className="text-xs text-stone-500">
              Registro de insumos, transporte y egresos con protección anti-duplicados
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <div className="text-right">
            <div className="text-xs text-stone-400 font-medium">Total Gastos</div>
            <div className="text-lg font-bold text-red-700">{formatCurrency(totalGastos)}</div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-md shadow-red-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Anti-Redundancy Protection Badge */}
      <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-red-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-red-700 shrink-0" />
          <span>
            <strong>Filtro Anti-Redundancia de Gastos:</strong> Previene registros dobles accidentales por doble clic o conceptos idénticos ingresados en el mismo día.
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
          placeholder="Buscar gasto por concepto, categoría o notas..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-sm"
        />
      </div>

      {/* Table view */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100 text-xs font-bold uppercase tracking-wider text-stone-700">
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Notas</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No hay gastos registrados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4 text-stone-500 text-xs font-semibold">{exp.fecha}</td>
                    <td className="p-4 font-bold text-stone-800">{exp.concepto}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-semibold">
                        {exp.tipo}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-red-600">{formatCurrency(exp.monto)}</td>
                    <td className="p-4 text-stone-500 text-xs">{exp.notas || '—'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                          title="Editar Gasto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 rounded-xl transition"
                          title="Eliminar Gasto"
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

      {/* Modal Add / Edit Expense */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {editingId ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {editingId
                ? 'Modifique los datos del gasto sin duplicar registros.'
                : 'Ingrese los detalles. El sistema detecta posibles duplicados.'}
            </p>

            {formError && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Concepto del Gasto
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                  placeholder="Ej. Etiquetas, Frascos, Combustible, etc."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Tipo / Categoría
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Insumos">Insumos y Envases</option>
                    <option value="Transporte">Transporte / Envíos</option>
                    <option value="Operativo">Gasto Operativo</option>
                    <option value="Publicidad">Marketing / Publicidad</option>
                    <option value="Servicios">Servicios / Mantenimiento</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Factura #123 o pago con tarjeta"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-red-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
