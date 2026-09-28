import React, { useState } from 'react';
import { ClientItem } from '../types';
import { Users, Plus, Trash2, Search, Phone, Mail, MapPin } from 'lucide-react';

interface ClientesTabProps {
  clients: ClientItem[];
  setClients: React.Dispatch<React.SetStateAction<ClientItem[]>>;
}

export const ClientesTab: React.FC<ClientesTabProps> = ({ clients, setClients }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const handleOpenAdd = () => {
    setNombre('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setNotas('');
    setShowModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: ClientItem = {
      id: `cli-${Date.now()}`,
      nombre,
      telefono,
      correo,
      direccion,
      totalCompras: 0,
      ultimaCompra: '—',
      notas,
    };
    setClients([newClient, ...clients]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const filteredClients = clients.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.notas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Directorio de Clientes</h2>
            <p className="text-xs text-stone-500">Gestión de contactos, historial de compras y preferencias</p>
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
                <th className="p-4">Compras</th>
                <th className="p-4">Notas</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-4 font-bold text-stone-800">{client.nombre}</td>
                    <td className="p-4 text-stone-600 space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{client.telefono}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{client.correo}</span>
                      </div>
                    </td>
                    <td className="p-4 text-stone-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{client.direccion}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold">
                        {client.totalCompras} regs
                      </span>
                    </td>
                    <td className="p-4 text-stone-500 text-xs">{client.notas || '—'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(client.id)}
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

      {/* Modal Add Client */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Registrar Nuevo Cliente</h3>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej. Ana Pérez"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    placeholder="55 1234 5678"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Correo Electrónico</label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                  placeholder="Ej. Col. Centro, Calle 5"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Notas / Preferencias</label>
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
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
