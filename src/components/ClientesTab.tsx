import React, { useState } from 'react';
import { ClientItem } from '../types';
import { Users, Plus, Trash2, Edit3, Search, Phone, Mail, MapPin, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { findDuplicateClient } from '../utils/antiRedundancy';

interface ClientesTabProps {
  clients: ClientItem[];
  setClients: React.Dispatch<React.SetStateAction<ClientItem[]>>;
}

export const ClientesTab: React.FC<ClientesTabProps> = ({ clients, setClients }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setNombre('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setNotas('');
    setShowModal(true);
  };

  const handleOpenEdit = (client: ClientItem) => {
    setEditingId(client.id);
    setFormError(null);
    setNombre(client.nombre);
    setTelefono(client.telefono || '');
    setCorreo(client.correo || '');
    setDireccion(client.direccion || '');
    setNotas(client.notas || '');
    setShowModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanNombre = nombre.trim();
    const cleanTelefono = telefono.trim();
    const cleanCorreo = correo.trim();
    const cleanDireccion = direccion.trim();
    const cleanNotas = notas.trim();

    if (!cleanNombre) {
      setFormError('Por favor ingrese el nombre del cliente.');
      return;
    }

    // Anti-redundancy check
    const duplicateCheck = findDuplicateClient(
      clients,
      { nombre: cleanNombre, telefono: cleanTelefono, correo: cleanCorreo },
      editingId
    );

    if (duplicateCheck.isDuplicate) {
      setFormError(
        `⚠️ Redundancia evitada: ${duplicateCheck.reason} Para mantener su base de datos limpia y sin duplicados, edite la ficha existente.`
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    if (editingId) {
      setClients(
        clients.map((c) =>
          c.id === editingId
            ? {
                ...c,
                nombre: cleanNombre,
                telefono: cleanTelefono,
                correo: cleanCorreo,
                direccion: cleanDireccion,
                notas: cleanNotas,
              }
            : c
        )
      );
      showToast(`Cliente "${cleanNombre}" actualizado exitosamente.`);
    } else {
      const newClient: ClientItem = {
        id: `cli-${Date.now()}`,
        nombre: cleanNombre,
        telefono: cleanTelefono,
        correo: cleanCorreo,
        direccion: cleanDireccion,
        totalCompras: 0,
        ultimaCompra: '—',
        notas: cleanNotas,
      };
      setClients([newClient, ...clients]);
      showToast(`Cliente "${cleanNombre}" registrado exitosamente.`);
    }

    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (confirm(`¿Desea eliminar al cliente "${client?.nombre || 'este cliente'}"?`)) {
      setClients(clients.filter((c) => c.id !== id));
      showToast('Cliente eliminado del directorio.');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Directorio de Clientes</h2>
            <p className="text-xs text-stone-500">
              Gestión de contactos con protección anti-duplicados por teléfono, correo y nombre
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md shadow-teal-600/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Anti-Redundancy Protection Badge */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Filtro Anti-Redundancia Activo:</strong> El sistema previene automáticamente clientes repetidos verificando coincidencias en número telefónico, correo electrónico y razón social.
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
          placeholder="Buscar cliente por nombre, teléfono, correo o notas..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-sm"
        />
      </div>

      {/* Table view */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100 text-xs font-bold uppercase tracking-wider text-stone-700">
                <th className="p-4">Cliente</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Dirección</th>
                <th className="p-4">Total Compras</th>
                <th className="p-4">Última Venta</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No hay clientes registrados que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-stone-800">{client.nombre}</div>
                      {client.notas && (
                        <div className="text-xs text-stone-400 truncate max-w-xs">{client.notas}</div>
                      )}
                    </td>
                    <td className="p-4 text-stone-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>{client.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{client.correo || 'Sin correo'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-stone-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate max-w-xs">{client.direccion || 'No especificada'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-stone-800">
                      ${client.totalCompras?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                    </td>
                    <td className="p-4 text-xs font-semibold text-stone-500">
                      {client.ultimaCompra || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                          title="Editar Ficha"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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

      {/* Modal Add / Edit Client */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {editingId ? 'Editar Ficha del Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {editingId
                ? 'Actualice los datos de contacto sin generar registros duplicados.'
                : 'Ingrese los datos. El sistema verificará que no exista duplicidad.'}
            </p>

            {formError && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Nombre Completo / Razón Social
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej. Ana Pérez"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    placeholder="55 1234 5678"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    placeholder="ana@example.com"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Col. Centro, Calle 5"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Notas / Preferencias
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Prefiere entregas por la tarde"
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
                  className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Verificando...' : editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
