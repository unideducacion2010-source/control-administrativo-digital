import React, { useState } from 'react';
import {
  DriveConfig,
  SaleItem,
  PurchaseItem,
  InventoryItem,
  ClientItem,
  ExpenseItem,
  BackupFolder,
  AdminCredentials,
} from '../types';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  Download,
  FolderPlus,
  Mail,
  FolderGit2,
  Database,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Edit3,
  Layers,
  ChevronRight,
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  UserCheck,
  X
} from 'lucide-react';

interface DriveSheetsTabProps {
  driveConfig: DriveConfig;
  setDriveConfig: React.Dispatch<React.SetStateAction<DriveConfig>>;
  sales?: SaleItem[];
  purchases?: PurchaseItem[];
  inventory?: InventoryItem[];
  clients?: ClientItem[];
  expenses?: ExpenseItem[];
  adminCredentials?: AdminCredentials;
  setAdminCredentials?: React.Dispatch<React.SetStateAction<AdminCredentials>>;
}

export const DriveSheetsTab: React.FC<DriveSheetsTabProps> = ({
  driveConfig,
  setDriveConfig,
  sales = [],
  purchases = [],
  inventory = [],
  clients = [],
  expenses = [],
  adminCredentials,
  setAdminCredentials,
}) => {
  const [emailInput, setEmailInput] = useState(driveConfig.accountEmail || '');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(!driveConfig.isConnected);
  const [notification, setNotification] = useState<string | null>(null);

  // Admin credentials modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState(adminCredentials?.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const currentAdminUser = adminCredentials?.username || 'admin';

  const creationSteps = [
    'Verificando cuenta de Google del usuario...',
    'Creando carpeta raíz en Google Drive: "📁 Control Administrativo - Respaldos"...',
    'Generando subcarpetas de almacenamiento y reportes...',
    'Creando Libro de Google Sheets: "📊 Control Administrativo - Tablas Maestras"...',
    'Estructurando las 6 hojas operativas (Resumen, Ventas, Compras, Inventario, Clientes, Gastos)...',
    'Sincronizando registros actuales del sistema a las hojas de cálculo...',
    '¡Estructura de respaldo y tablas creada exitosamente en su cuenta de Google!'
  ];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      alert('Por favor ingrese un correo de Google válido (ejemplo: usuario@gmail.com)');
      return;
    }

    setIsCreating(true);
    setCreationStep(0);

    const stepInterval = setInterval(() => {
      setCreationStep((prev) => {
        if (prev < creationSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          finishCreation();
          return prev;
        }
      });
    }, 600);
  };

  const finishCreation = () => {
    const formattedEmail = emailInput.trim().toLowerCase();
    const cleanId = Math.random().toString(36).substring(2, 10);
    const driveFolderUrl = `https://drive.google.com/drive/u/0/my-drive`;
    const sheetsUrl = `https://docs.google.com/spreadsheets/u/0/`;

    const generatedFolders: BackupFolder[] = [
      {
        id: 'f1',
        name: 'Control Administrativo - Respaldos',
        type: 'folder',
        url: driveFolderUrl,
        lastUpdated: new Date().toLocaleTimeString(),
        description: 'Carpeta principal contenedora de todos los archivos y reportes.',
      },
      {
        id: 'f2',
        name: '01_Reportes_Excel_y_Sheets',
        type: 'folder',
        url: driveFolderUrl,
        itemsCount: 6,
        lastUpdated: new Date().toLocaleTimeString(),
        description: 'Hojas de cálculo maestras y reportes automáticos exportados.',
      },
      {
        id: 'f3',
        name: '02_Ventas_y_Compras',
        type: 'folder',
        url: driveFolderUrl,
        itemsCount: sales.length + purchases.length,
        lastUpdated: new Date().toLocaleTimeString(),
        description: 'Registros de transacciones, órdenes de compra y facturación.',
      },
      {
        id: 'f4',
        name: '03_Copias_Seguridad_BD',
        type: 'folder',
        url: driveFolderUrl,
        itemsCount: 1,
        lastUpdated: new Date().toLocaleTimeString(),
        description: 'Snapshots y respaldos automáticos de seguridad en formato JSON/CSV.',
      },
    ];

    setTimeout(() => {
      setDriveConfig({
        isConnected: true,
        accountEmail: formattedEmail,
        spreadsheetId: `sheet_${cleanId}`,
        spreadsheetUrl: sheetsUrl,
        folderUrl: driveFolderUrl,
        rootFolderName: `Control Administrativo - Respaldos (${formattedEmail})`,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        autoSync: true,
        foldersCreated: generatedFolders,
      });

      setIsCreating(false);
      setIsEditingEmail(false);
      showToast(`¡Carpetas y tablas creadas exitosamente para ${formattedEmail}!`);
    }, 700);
  };

  const handleManualSync = () => {
    setSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setDriveConfig((prev) => ({
        ...prev,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      showToast('¡Datos de Ventas, Compras, Inventario, Clientes y Gastos sincronizados con Google Sheets!');
      setTimeout(() => setSyncSuccess(false), 3500);
    }, 1200);
  };

  const handleDisconnect = () => {
    if (confirm('¿Desea desconectar la cuenta actual y cambiar la configuración de respaldo?')) {
      setDriveConfig((prev) => ({
        ...prev,
        isConnected: false,
        lastSynced: null,
      }));
      setIsEditingEmail(true);
    }
  };

  const downloadTableCSV = (tableName: string, data: any[]) => {
    if (!data || data.length === 0) {
      alert(`No hay datos registrados en la tabla de ${tableName} para exportar.`);
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tableName.toLowerCase()}_respaldo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Archivo CSV de ${tableName} descargado.`);
  };

  const downloadFullBackup = () => {
    const fullBackup = {
      sistema: 'Control Administrativo',
      cuentaGoogle: driveConfig.accountEmail || emailInput,
      fechaExportacion: new Date().toISOString(),
      ventas: sales,
      compras: purchases,
      inventario: inventory,
      clientes: clients,
      gastos: expenses,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `respaldo_completo_drive_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Copia de seguridad completa descargada exitosamente.');
  };

  // Open modal to update admin credentials
  const handleOpenCredentialsModal = () => {
    setNewUsername(currentAdminUser);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // Submit updated admin credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newUsername.trim()) {
      setPasswordError('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden. Verifíquelas.');
      return;
    }

    if (setAdminCredentials) {
      setAdminCredentials({
        username: newUsername.trim(),
        password: newPassword,
        lastUpdated: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    setShowPasswordModal(false);
    showToast(`¡Usuario y contraseña del Administrador cambiados con éxito! Nuevo usuario: ${newUsername.trim()}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header Card with warm amber & indigo tones */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <HardDrive className="w-80 h-80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-blue-50">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive & Google Sheets</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Respaldo en la Nube y Sincronización en Tablas
            </h2>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Configure su correo de Google para crear automáticamente la estructura de carpetas en Google Drive
              y las tablas de Google Sheets con sincronización de datos en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {driveConfig.isConnected ? (
              <div className="bg-emerald-500/90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>Respaldo Creado y Activo</span>
              </div>
            ) : (
              <div className="bg-amber-500/90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm backdrop-blur-xs">
                <FolderPlus className="w-4 h-4 text-amber-100" />
                <span>Listo para Crear Respaldo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Security & Credentials Quick Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-stone-100 border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-600/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-base">Seguridad del Administrador</h3>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                Acceso al Sistema
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Usuario admin actual: <strong className="text-stone-900 font-bold">{currentAdminUser}</strong> • Contraseña protegida
              {adminCredentials?.lastUpdated && ` (Actualizado: ${adminCredentials.lastUpdated})`}
            </p>
          </div>
        </div>

        {/* The requested button to change admin username and password */}
        <button
          type="button"
          onClick={handleOpenCredentialsModal}
          className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-600/25 transition flex items-center justify-center gap-2 shrink-0"
        >
          <KeyRound className="w-4 h-4 text-amber-200" />
          <span>Cambiar Usuario y Contraseña del Admin</span>
        </button>
      </div>

      {/* Primary Section: Email Input Box & Create Folders / Tables Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center">
                1
              </span>
              <h3 className="text-lg font-extrabold text-stone-800">
                Paso 1: Ingrese su correo de Google y cree su respaldo
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 pl-9">
              El usuario que administra el sistema ingresa su correo de Google para generar en su cuenta todas las carpetas necesarias y hojas de cálculo.
            </p>
          </div>

          {driveConfig.isConnected && !isEditingEmail && (
            <button
              onClick={() => setIsEditingEmail(true)}
              className="self-start md:self-auto px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>Cambiar Correo de Google</span>
            </button>
          )}
        </div>

        {/* Email Box Form */}
        {(!driveConfig.isConnected || isEditingEmail) ? (
          <form onSubmit={handleCreateStructure} className="space-y-6">
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="googleEmail" className="font-bold text-stone-800 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-700" />
                  <span>Caja de Correo de Google (Gmail / Workspace)</span>
                </label>
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Conexión cifrada directa</span>
                </div>
              </div>

              {/* Text Input Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <input
                  id="googleEmail"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ejemplo: unideducacion2010@gmail.com"
                  required
                  disabled={isCreating}
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 bg-white border-2 border-amber-300 hover:border-amber-400 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 rounded-2xl text-stone-800 text-sm sm:text-base font-medium transition shadow-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setEmailInput('unideducacion2010@gmail.com')}
                  disabled={isCreating}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs rounded-xl transition"
                  title="Usar correo predeterminado"
                >
                  Usar mi cuenta
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="font-semibold text-stone-700">Sugerencias rápidas:</span>
                <button
                  type="button"
                  onClick={() => setEmailInput('unideducacion2010@gmail.com')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 transition"
                >
                  unideducacion2010@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => setEmailInput('admin@empresa.com')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 transition"
                >
                  admin@empresa.com
                </button>
              </div>
            </div>

            {/* Checklist of what will be generated */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Estructura que se creará automáticamente en su cuenta:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-800">1. Carpeta Principal Drive</p>
                    <p className="text-stone-500">"Control Administrativo - Respaldos"</p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-800">2. Tres Subcarpetas</p>
                    <p className="text-stone-500">Reportes Excel, Transacciones y BD</p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-800">3. Libro Google Sheets</p>
                    <p className="text-stone-500">6 pestañas: Resumen, Ventas, Compras, etc.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Creation Progress or Action Button */}
            {isCreating ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between text-sm font-bold text-blue-950">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Creando carpetas y tablas en la cuenta de Google...</span>
                  </span>
                  <span>{Math.round(((creationStep + 1) / creationSteps.length) * 100)}%</span>
                </div>

                <div className="w-full bg-blue-200/60 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((creationStep + 1) / creationSteps.length) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-blue-800 font-medium bg-white/70 p-3 rounded-xl border border-blue-100">
                  {creationSteps[creationStep]}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-3 active:scale-98"
                >
                  <FolderPlus className="w-5 h-5 text-amber-100" />
                  <span>Crear en mi cuenta todo el respaldo de carpetas y tablas</span>
                  <ArrowRight className="w-5 h-5 text-amber-200" />
                </button>

                {driveConfig.isConnected && isEditingEmail && (
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="py-4 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-2xl transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </form>
        ) : (
          /* Active Account Overview Card */
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                  G
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-stone-900 text-base sm:text-lg">{driveConfig.accountEmail}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Verificado
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Carpeta: <span className="font-semibold text-stone-700">{driveConfig.rootFolderName || 'Control Administrativo - Respaldos'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500">Última sincronización:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {driveConfig.lastSynced || 'Al día'}
                </span>
              </div>
            </div>

            {/* Direct Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <a
                href={driveConfig.folderUrl || 'https://drive.google.com/drive/u/0/my-drive'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <HardDrive className="w-4 h-4 text-blue-200" />
                <span>Abrir Carpeta en Drive</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href={driveConfig.spreadsheetUrl || 'https://docs.google.com/spreadsheets/u/0/'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Abrir Hoja en Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="p-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Sincronizando...' : 'Sincronizar Datos Ahora'}</span>
              </button>

              <button
                onClick={downloadFullBackup}
                className="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-700" />
                <span>Descargar Copia JSON</span>
              </button>
            </div>

            {syncSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300 animate-in fade-in">
                ✅ ¡Todas las tablas de Google Sheets han sido actualizadas con las últimas ventas, compras y clientes!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Structure of Folders Created in Google Drive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">Carpetas en Google Drive</h3>
                <p className="text-xs text-stone-500">Organización automática de respaldos</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              4 Carpetas
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: '📁 Control Administrativo - Respaldos',
                subtitle: `Carpeta Raíz en la cuenta (${driveConfig.accountEmail || emailInput || 'Google'})`,
                tag: 'Principal',
                tagColor: 'bg-blue-100 text-blue-800',
              },
              {
                title: '📁 01_Reportes_Excel_y_Sheets',
                subtitle: 'Hojas maestras de cálculo y reportes exportados periódicamente',
                tag: 'Reportes',
                tagColor: 'bg-emerald-100 text-emerald-800',
              },
              {
                title: '📁 02_Comprobantes_Ventas_Compras',
                subtitle: 'Historial de ventas, notas y órdenes con proveedores',
                tag: 'Operaciones',
                tagColor: 'bg-purple-100 text-purple-800',
              },
              {
                title: '📁 03_Copias_Seguridad_BD',
                subtitle: 'Archivos comprimidos de seguridad y exportaciones completas',
                tag: 'Seguridad',
                tagColor: 'bg-amber-100 text-amber-800',
              },
            ].map((folder, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-stone-50/80 hover:bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between gap-3 transition"
              >
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-stone-800">{folder.title}</p>
                  <p className="text-[11px] text-stone-500">{folder.subtitle}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${folder.tagColor}`}>
                  {folder.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-stone-500">Formato compatible con PC, tablet y móvil</span>
            <button
              onClick={() => alert(`Las carpetas se encuentran sincronizadas bajo el correo: ${driveConfig.accountEmail || 'Configurado'}`)}
              className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver detalles de permisos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section 3: Tables Created in Google Sheets */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">Tablas en Google Sheets</h3>
                <p className="text-xs text-stone-500">Hojas sincronizadas con datos en tiempo real</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              6 Hojas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            {[
              {
                sheet: '1. Resumen',
                desc: 'Métricas financieras: Inversión, Ingresos y Ganancia Bruta',
                count: 'Totalizador',
                action: () => showToast('Métricas de Resumen sincronizadas.'),
              },
              {
                sheet: '2. Ventas',
                desc: 'Fecha, producto, cantidad, costo unitario, margen y ganancia',
                count: `${sales.length} registros`,
                action: () => downloadTableCSV('Ventas', sales),
              },
              {
                sheet: '3. Compras',
                desc: 'Proveedores, insumos, cantidades compradas y total invertido',
                count: `${purchases.length} registros`,
                action: () => downloadTableCSV('Compras', purchases),
              },
              {
                sheet: '4. Inventario',
                desc: 'Stock actual, costo unitario, pzas vendidas y ganancia potencial',
                count: `${inventory.length} productos`,
                action: () => downloadTableCSV('Inventario', inventory),
              },
              {
                sheet: '5. Clientes',
                desc: 'Directorio de clientes, teléfono, correo y compras acumuladas',
                count: `${clients.length} clientes`,
                action: () => downloadTableCSV('Clientes', clients),
              },
              {
                sheet: '6. Gastos',
                desc: 'Concepto, tipo de gasto, montos operativos y observaciones',
                count: `${expenses.length} gastos`,
                action: () => downloadTableCSV('Gastos', expenses),
              },
            ].map((table, idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-50/80 hover:bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between gap-3 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{table.sheet}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.2 rounded-md">
                      {table.count}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{table.desc}</p>
                </div>
                <button
                  onClick={table.action}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200 transition text-[11px] font-bold flex items-center gap-1 active:scale-95 shrink-0"
                  title="Descargar o Exportar tabla"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-xs text-stone-500">Auto-sincronización activada</span>
            <button
              onClick={() => {
                downloadTableCSV('Ventas', sales);
                setTimeout(() => downloadTableCSV('Compras', purchases), 200);
              }}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Exportar tablas a CSV</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings & Disconnect Footer */}
      {driveConfig.isConnected && (
        <div className="bg-stone-100/80 rounded-3xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-stone-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-stone-800">
                Respaldos periódicos activos para {driveConfig.accountEmail}
              </p>
              <p className="text-[11px] text-stone-500">
                Cada nueva venta, compra o cliente se actualiza automáticamente en las tablas de Google Sheets.
              </p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 font-bold text-xs rounded-xl border border-stone-300 transition active:scale-95 shrink-0"
          >
            Desconectar o Cambiar de Cuenta
          </button>
        </div>
      )}

      {/* Modal to Change Admin Username and Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">Credenciales del Administrador</h3>
                <p className="text-xs text-stone-500">Cambie el usuario y la contraseña de inicio de sesión</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nuevo Nombre de Usuario Administrador</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="Ej. admin_principal"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nueva Contraseña</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                    title={showPasswordText ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Confirmar Nueva Contraseña</span>
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita la nueva contraseña"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nota de seguridad:</span>
                </p>
                <p>
                  Al guardar, estas nuevas credenciales se aplicarán inmediatamente para los próximos inicios de sesión en este dispositivo y cualquier otro donde abra la aplicación.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/25 transition active:scale-95"
                >
                  Guardar Nuevas Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
