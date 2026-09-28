import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { Receipt, Plus, Trash2, Search } from 'lucide-react';

interface GastosTabProps {
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
}

export const GastosTab: React.FC<GastosTabProps> = ({ expenses, setExpenses }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [concepto, setConcepto] = useState('');
  const [tipo, setTipo] = useState('Insumos');
  const [monto, setMonto] = useState(100);
  const [notas, setNotas] = useState('');

  const handleOpenAdd = () => {
    setConcepto('');
    setTipo('Insumos');
    setMonto(100);
    setNotas('');
    setShowModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      concepto,
      tipo,
      monto,
      notas,
    };
    setExpenses([newExpense, ...expenses]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este gasto?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(e =>
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-800 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Control de Gastos</h2>
            <p className="text-xs text-stone-500">Registro de insumos, transporte y gastos operativos</p>
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

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar gasto por concepto, tipo o notas..."
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
                <th className="p-4">Tipo</th>
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
                    <td className="p-4 text-stone-600">{exp.fecha}</td>
                    <td className="p-4 font-bold text-stone-800">{exp.concepto}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium">{exp.tipo}</span>
                    </td>
                    <td className="p-4 font-bold text-red-700">{formatCurrency(exp.monto)}</td>
                    <td className="p-4 text-stone-500">{exp.notas || '—'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
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

      {/* Modal Add Expense */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Registrar Nuevo Gasto</h3>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                  placeholder="Ej. Compra de etiquetas y frascos"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Tipo de Gasto</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Insumos">Insumos</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Publicidad">Publicidad</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Notas Adicionales</label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Factura #102"
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
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
