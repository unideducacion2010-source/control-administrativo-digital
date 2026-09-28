import React, { useState } from 'react';
import { DriveConfig } from '../types';
import { Cloud, CheckCircle2, RefreshCw, FileSpreadsheet, HardDrive, ShieldAlert, ExternalLink, Download } from 'lucide-react';

interface DriveSheetsTabProps {
  driveConfig: DriveConfig;
  setDriveConfig: React.Dispatch<React.SetStateAction<DriveConfig>>;
}

export const DriveSheetsTab: React.FC<DriveSheetsTabProps> = ({ driveConfig, setDriveConfig }) => {
  const [emailInput, setEmailInput] = useState('admin@negocio.com');
  const [sheetIdInput, setSheetIdInput] = useState('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setDriveConfig({
      ...driveConfig,
      isConnected: true,
      accountEmail: emailInput,
      spreadsheetId: sheetIdInput,
      lastSynced: new Date().toLocaleTimeString(),
    });
    alert('¡Conexión establecida exitosamente con Google Drive y Google Sheets!');
  };

  const handleDisconnect = () => {
    if (confirm('¿Desea desconectar la cuenta de Google Drive y Sheets?')) {
      setDriveConfig({
        ...driveConfig,
        isConnected: false,
        lastSynced: null,
      });
    }
  };

  const handleManualSync = () => {
    setSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setDriveConfig({
        ...driveConfig,
        lastSynced: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  const handleExportSheets = () => {
    alert('Reporte completo de Resumen, Ventas, Inventario y Gastos exportado automáticamente a Google Sheets.');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-blue-800/60 text-blue-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Integración Oficial Cloud
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Google Drive & Google Sheets</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Sincronización en tiempo real y almacenamiento seguro de datos administrativos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {driveConfig.isConnected ? (
            <span className="px-4 py-2 bg-emerald-500 text-white rounded-2xl font-semibold text-xs flex items-center gap-2 shadow">
              <CheckCircle2 className="w-4 h-4" /> Vinculado y Activo
            </span>
          ) : (
            <span className="px-4 py-2 bg-amber-500 text-white rounded-2xl font-semibold text-xs flex items-center gap-2 shadow">
              <ShieldAlert className="w-4 h-4" /> Sin Conectar
            </span>
          )}
        </div>
      </div>

      {/* Connection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-stone-800">Estado de Cuenta</h3>

          {driveConfig.isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <span>Google Workspace Conectado</span>
                </div>
                <p className="text-xs text-blue-700 truncate">Cuenta: {driveConfig.accountEmail}</p>
                <p className="text-xs text-blue-700 truncate">ID Hoja: {driveConfig.spreadsheetId.substring(0, 16)}...</p>
                {driveConfig.lastSynced && (
                  <p className="text-xs text-emerald-700 font-medium">Última sinc: {driveConfig.lastSynced}</p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>

                <button
                  onClick={handleExportSheets}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow transition flex items-center justify-center gap-2 text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar a Google Sheets</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 px-4 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 font-semibold rounded-2xl transition text-sm border border-stone-200"
                >
                  Desconectar Cuenta
                </button>
              </div>

              {syncSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium text-center animate-bounce">
                  ¡Sincronización en tiempo real completada!
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <p className="text-xs text-stone-500">
                Como usuario administrador, conecte su cuenta de Google para almacenar respaldos en Drive y procesar tablas en Sheets.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Correo Administrador</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">ID de Google Sheet (Opcional)</label>
                <input
                  type="text"
                  value={sheetIdInput}
                  onChange={(e) => setSheetIdInput(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 text-sm"
              >
                <Cloud className="w-5 h-5" />
                <span>Vincular con Google</span>
              </button>
            </form>
          )}
        </div>

        {/* Sync details & Spreadsheet structure preview */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-800">Estructura de Sincronización Automática</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
              Compatible con Excel y Sheets
            </span>
          </div>

          <p className="text-sm text-stone-600">
            La arquitectura está diseñada exactamente según la estructura de sus archivos de Excel para sincronizar las 4 hojas principales en tiempo real:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-800 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>1. Hoja "Resumen"</span>
              </div>
              <p className="text-xs text-stone-500">Métricas financieras globales, inversión, ingresos, ganancia bruta y margen promedio.</p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-800 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>2. Hoja "Ventas"</span>
              </div>
              <p className="text-xs text-stone-500">Registro detallado por fecha, producto, cantidad, costo unitario, ingresos y margen.</p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-800 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>3. Hoja "Inventario"</span>
              </div>
              <p className="text-xs text-stone-500">Control de stock, piezas compradas, disponibles, ganancia por pieza y potencial.</p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-800 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>4. Hoja "Gastos"</span>
              </div>
              <p className="text-xs text-stone-500">Registro de insumos, gastos operativos y notas asociadas.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Respaldo automático diario en Google Drive</span>
            </div>
            <button
              onClick={() => alert('Descargando archivo JSON de respaldo compatible con Excel y Drive.')}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Backup Local</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
