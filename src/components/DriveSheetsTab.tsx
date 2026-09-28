import React, { useState, useEffect } from 'react';
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
  User as UserIcon,
  Eye,
  EyeOff,
  UserCheck,
  X,
  AlertTriangle
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  createDriveFolder,
  createGoogleSpreadsheet,
  syncAllDataToSheets,
  logoutGoogle,
  getAccessToken,
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';

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
  const [emailInput, setEmailInput] = useState(driveConfig.accountEmail || 'mexicoartesanal9@gmail.com');
  const [isCreating, setIsCreating] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  const [creationStepIndex, setCreationStepIndex] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(!driveConfig.isConnected);
  const [notification, setNotification] = useState<string | null>(null);

  // Confirmation modals for workspace operations
  const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);

  // Google Auth User
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Admin credentials modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState(adminCredentials?.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const currentAdminUser = adminCredentials?.username || 'admin';

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        if (user.email && !driveConfig.accountEmail) {
          setEmailInput(user.email);
        }
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [driveConfig.accountEmail]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleStartCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      showToast('Por favor ingrese un correo de Google válido (ejemplo: usuario@gmail.com)');
      return;
    }
    // Open confirmation dialog before creating resources in user's Google Drive
    setShowCreateConfirmModal(true);
  };

  const executeRealGoogleCreation = async () => {
    setShowCreateConfirmModal(false);
    setIsCreating(true);
    setCreationStepIndex(0);

    try {
      // Step 1: Ensure user is signed in with Google
      setCurrentStepText('1. Conectando con Google Workspace (concediendo permisos)...');
      setCreationStepIndex(1);

      let token = await getAccessToken();
      let user = currentUser;

      if (!token || !user) {
        const authResult = await googleSignIn();
        token = authResult.accessToken;
        user = authResult.user;
        setCurrentUser(user);
      }

      const activeEmail = user.email || emailInput.trim();

      // Step 2: Create root folder in Google Drive
      setCurrentStepText('2. Creando carpeta principal "📁 Control Administrativo - Respaldos" en Google Drive...');
      setCreationStepIndex(2);
      const rootFolder = await createDriveFolder(`Control Administrativo - Respaldos (${activeEmail})`);

      // Step 3: Create organized subfolders inside root folder
      setCurrentStepText('3. Generando subcarpetas de organización en Google Drive...');
      setCreationStepIndex(3);
      const sub1 = await createDriveFolder('01_Reportes_y_Tablas_Maestras', rootFolder.id);
      const sub2 = await createDriveFolder('02_Ventas_y_Recibos', rootFolder.id);
      const sub3 = await createDriveFolder('03_Compras_y_Facturas', rootFolder.id);
      const sub4 = await createDriveFolder('04_Inventario_y_Stock', rootFolder.id);
      const sub5 = await createDriveFolder('05_Gastos_Operativos', rootFolder.id);

      // Step 4: Create Google Spreadsheet with 6 tabs
      setCurrentStepText('4. Creando Libro de Google Sheets "📊 Control Administrativo - Tablas Maestras"...');
      setCreationStepIndex(4);
      const spreadsheet = await createGoogleSpreadsheet('Control Administrativo - Tablas Maestras', sub1.id);

      // Step 5: Sync current database records to the new sheets
      setCurrentStepText('5. Sincronizando registros actuales de Ventas, Compras, Inventario, Clientes y Gastos...');
      setCreationStepIndex(5);
      await syncAllDataToSheets(spreadsheet.spreadsheetId, {
        sales,
        purchases,
        inventory,
        clients,
        expenses,
      });

      // Step 6: Finalize state
      setCurrentStepText('6. ¡Estructura y archivos creados exitosamente en su Google Drive!');
      setCreationStepIndex(6);

      const generatedFolders: BackupFolder[] = [
        {
          id: rootFolder.id,
          name: rootFolder.name,
          type: 'folder',
          url: rootFolder.webViewLink,
          lastUpdated: new Date().toLocaleTimeString(),
          description: 'Carpeta principal contenedora en Google Drive.',
        },
        {
          id: sub1.id,
          name: sub1.name,
          type: 'folder',
          url: sub1.webViewLink,
          itemsCount: 1,
          lastUpdated: new Date().toLocaleTimeString(),
          description: 'Hojas de cálculo maestras y reportes automáticos.',
        },
        {
          id: sub2.id,
          name: sub2.name,
          type: 'folder',
          url: sub2.webViewLink,
          itemsCount: sales.length,
          lastUpdated: new Date().toLocaleTimeString(),
          description: 'Respaldos de ventas y recibos emitidos.',
        },
        {
          id: sub3.id,
          name: sub3.name,
          type: 'folder',
          url: sub3.webViewLink,
          itemsCount: purchases.length,
          lastUpdated: new Date().toLocaleTimeString(),
          description: 'Facturas de proveedores y compras registradas.',
        },
        {
          id: sub4.id,
          name: sub4.name,
          type: 'folder',
          url: sub4.webViewLink,
          itemsCount: inventory.length,
          lastUpdated: new Date().toLocaleTimeString(),
          description: 'Control de mercancías y catálogo de productos.',
        },
      ];

      setDriveConfig({
        isConnected: true,
        accountEmail: activeEmail,
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: spreadsheet.spreadsheetUrl,
        folderUrl: rootFolder.webViewLink,
        rootFolderName: rootFolder.name,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        autoSync: true,
        foldersCreated: generatedFolders,
      });

      setIsEditingEmail(false);
      showToast(`¡Carpetas y tablas de Google Sheets creadas exitosamente en ${activeEmail}!`);
    } catch (err: any) {
      console.error('Error al crear estructura en Google:', err);
      showToast(`Error al crear en Google: ${err.message || 'No se pudo completar la operación'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartManualSync = () => {
    if (!driveConfig.spreadsheetId) {
      showToast('Primero debe crear la estructura de Google Drive y Sheets.');
      return;
    }
    // Show confirmation modal before modifying spreadsheet data
    setShowSyncConfirmModal(true);
  };

  const executeRealSync = async () => {
    setShowSyncConfirmModal(false);
    setSyncing(true);
    setSyncSuccess(false);

    try {
      let token = await getAccessToken();
      if (!token) {
        const authResult = await googleSignIn();
        token = authResult.accessToken;
        setCurrentUser(authResult.user);
      }

      await syncAllDataToSheets(driveConfig.spreadsheetId, {
        sales,
        purchases,
        inventory,
        clients,
        expenses,
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDriveConfig((prev) => ({
        ...prev,
        lastSynced: timeStr,
      }));
      setSyncSuccess(true);
      showToast('¡Todas las hojas de Google Sheets han sido actualizadas con éxito!');
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error al sincronizar:', err);
      showToast(`Error al sincronizar: ${err.message || 'Revisa la conexión'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setDriveConfig((prev) => ({
      ...prev,
      isConnected: false,
      lastSynced: null,
      spreadsheetId: '',
      spreadsheetUrl: undefined,
      folderUrl: undefined,
    }));
    setIsEditingEmail(true);
    showToast('Cuenta de Google desvinculada.');
  };

  const downloadTableCSV = (tableName: string, data: any[]) => {
    if (!data || data.length === 0) {
      showToast(`No hay datos registrados en la tabla de ${tableName} para exportar.`);
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

  const handleOpenCredentialsModal = () => {
    setNewUsername(currentAdminUser);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newUsername.trim()) {
      setPasswordError('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('La contraseña debe contener al menos 4 caracteres.');
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
        lastUpdated: new Date().toISOString(),
      });
      showToast(`¡Credenciales actualizadas! Nuevo usuario: ${newUsername.trim()}`);
      setShowPasswordModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-stone-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive & Sheets Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sincronización en la Nube
            </h2>
            <p className="text-amber-100/80 text-xs sm:text-sm leading-relaxed">
              Cree automáticamente carpetas en su cuenta de Google Drive y libros de cálculo en Google Sheets vinculados a este sistema con sus datos de Ventas, Compras, Clientes e Inventario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCredentialsModal}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 font-bold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-sm"
              title="Cambiar usuario y contraseña del Administrador"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Cambiar Usuario / Contraseña</span>
            </button>

            <button
              onClick={downloadFullBackup}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-sm"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Copia JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Google Account & Creation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Vinculación con Cuenta de Google
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 pl-9">
              Ingrese su correo de Google y autorice la creación automática de sus carpetas en Drive y sus hojas en Google Sheets.
            </p>
          </div>

          {driveConfig.isConnected && !isEditingEmail && (
            <button
              onClick={() => setIsEditingEmail(true)}
              className="self-start md:self-auto px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>Cambiar Cuenta de Google</span>
            </button>
          )}
        </div>

        {/* Email Box Form */}
        {(!driveConfig.isConnected || isEditingEmail) ? (
          <form onSubmit={handleStartCreation} className="space-y-6">
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="googleEmail" className="font-bold text-stone-800 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-700" />
                  <span>Correo de Google (Gmail o Google Workspace)</span>
                </label>
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Conexión segura oficial de Google</span>
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
                  placeholder="ejemplo: mexicoartesanal9@gmail.com"
                  required
                  disabled={isCreating}
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 bg-white border-2 border-amber-300 hover:border-amber-400 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 rounded-2xl text-stone-800 text-sm sm:text-base font-medium transition shadow-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setEmailInput('mexicoartesanal9@gmail.com')}
                  disabled={isCreating}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs rounded-xl transition"
                  title="Usar mi cuenta"
                >
                  Usar mi cuenta
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="font-semibold text-stone-700">Sugerencias rápidas:</span>
                <button
                  type="button"
                  onClick={() => setEmailInput('mexicoartesanal9@gmail.com')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-semibold rounded-lg text-amber-900 transition"
                >
                  mexicoartesanal9@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => setEmailInput('unideducacion2010@gmail.com')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 transition"
                >
                  unideducacion2010@gmail.com
                </button>
              </div>
            </div>

            {/* Checklist of what will be generated */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Estructura que se creará de forma real en su cuenta de Google:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <p className="font-bold text-stone-800">2. Cinco Subcarpetas</p>
                    <p className="text-stone-500">Reportes, Ventas, Compras, Stock y Gastos</p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-800">3. Libro Google Sheets</p>
                    <p className="text-stone-500">6 pestañas con todos los registros sincronizados</p>
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
                    <span>Creando carpetas y hojas en Google Drive & Sheets...</span>
                  </span>
                  <span>{Math.round((creationStepIndex / 6) * 100)}%</span>
                </div>

                <div className="w-full bg-blue-200/60 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(10, Math.round((creationStepIndex / 6) * 100))}%` }}
                  />
                </div>

                <p className="text-xs text-blue-800 font-medium bg-white/70 p-3 rounded-xl border border-blue-100">
                  {currentStepText || 'Iniciando proceso...'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-3 active:scale-98"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Conectar con Google y Crear Estructura en mi Drive</span>
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
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-stone-900 text-base sm:text-lg">{driveConfig.accountEmail}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Conectado</span>
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
                href={driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <HardDrive className="w-4 h-4 text-blue-200" />
                <span>Abrir Carpeta en Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href={driveConfig.spreadsheetUrl || (driveConfig.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${driveConfig.spreadsheetId}/edit` : 'https://docs.google.com/spreadsheets')}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Abrir Hojas en Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={handleStartManualSync}
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
                ✅ ¡Todas las tablas de Google Sheets han sido actualizadas con las últimas ventas, compras, productos, clientes y gastos!
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
                <p className="text-xs text-stone-500">Organización creada en su cuenta</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              6 Carpetas
            </span>
          </div>

          <div className="space-y-3">
            {(driveConfig.foldersCreated && driveConfig.foldersCreated.length > 0
              ? driveConfig.foldersCreated
              : [
                  {
                    id: 'f1',
                    name: '📁 Control Administrativo - Respaldos',
                    description: `Carpeta Raíz en la cuenta (${driveConfig.accountEmail || emailInput || 'Google'})`,
                    url: driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive',
                  },
                  {
                    id: 'f2',
                    name: '📁 01_Reportes_y_Tablas_Maestras',
                    description: 'Hojas de cálculo maestras sincronizadas con Google Sheets',
                    url: driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive',
                  },
                  {
                    id: 'f3',
                    name: '📁 02_Ventas_y_Recibos',
                    description: 'Comprobantes y registros de ventas realizadas',
                    url: driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive',
                  },
                  {
                    id: 'f4',
                    name: '📁 03_Compras_y_Facturas',
                    description: 'Órdenes con proveedores y facturas de compras',
                    url: driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive',
                  },
                  {
                    id: 'f5',
                    name: '📁 04_Inventario_y_Stock',
                    description: 'Catálogo de mercancías y fichas de productos',
                    url: driveConfig.folderUrl || 'https://drive.google.com/drive/my-drive',
                  },
                ]
            ).map((folder, idx) => (
              <div
                key={folder.id || idx}
                className="p-3.5 bg-stone-50/80 hover:bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between gap-3 transition"
              >
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-stone-800">{folder.name}</p>
                  <p className="text-[11px] text-stone-500">{folder.description}</p>
                </div>
                {folder.url && (
                  <a
                    href={folder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-blue-50 text-blue-700 border border-stone-200 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-stone-500">Acceso directo desde cualquier dispositivo</span>
            <button
              onClick={() => showToast(`Las carpetas se encuentran en la cuenta: ${driveConfig.accountEmail || emailInput}`)}
              className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver estado de cuenta</span>
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
                <h3 className="text-base font-bold text-stone-800">Hojas en Google Sheets</h3>
                <p className="text-xs text-stone-500">Pestañas del libro sincronizadas</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              6 Hojas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            {[
              {
                sheet: '1. Resumen General',
                desc: 'Métricas financieras: Inversión, Ingresos y Ganancia Bruta',
                count: 'Totalizador',
                action: () => showToast('Métricas de Resumen sincronizadas en Google Sheets.'),
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
                  title="Descargar CSV local"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-xs text-stone-500">Sincronización directa con Google Sheets</span>
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
                Sus datos están vinculados directamente a su cuenta de Google. Puede sincronizarlos en cualquier momento.
              </p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 font-bold text-xs rounded-xl border border-stone-300 transition active:scale-95 shrink-0"
          >
            Desvincular o Cambiar de Cuenta
          </button>
        </div>
      )}

      {/* Confirmation Modal Before Creating Google Drive & Sheets Structure */}
      {showCreateConfirmModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200 relative">
            <button
              onClick={() => setShowCreateConfirmModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Crear Estructura en Google Drive & Sheets
                </h3>
                <p className="text-xs text-stone-500">Confirmación de creación de archivos</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-xs text-stone-600">
              <p className="text-sm font-semibold text-stone-800">
                Esta acción creará en su cuenta de Google ({emailInput}):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <li>
                  <strong>Carpeta Principal:</strong> "Control Administrativo - Respaldos" en la raíz de su Google Drive.
                </li>
                <li>
                  <strong>5 Subcarpetas organizativas:</strong> Reportes, Ventas, Compras, Stock y Gastos.
                </li>
                <li>
                  <strong>Libro de Google Sheets:</strong> "Control Administrativo - Tablas Maestras" con 6 hojas operativas.
                </li>
                <li>
                  <strong>Sincronización inicial:</strong> Subirá sus {sales.length} ventas, {purchases.length} compras, {inventory.length} productos y {clients.length} clientes.
                </li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Se abrirá una ventana de inicio de sesión de Google para autorizar a la aplicación a crear estos archivos en su Drive con su permiso.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateConfirmModal(false)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRealGoogleCreation}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/25 transition active:scale-95"
              >
                Confirmar y Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Syncing/Updating Sheets */}
      {showSyncConfirmModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200 relative">
            <button
              onClick={() => setShowSyncConfirmModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Sincronizar con Google Sheets
                </h3>
                <p className="text-xs text-stone-500">Actualizar datos de las hojas de cálculo</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              ¿Desea actualizar el libro de <strong>Google Sheets</strong> con los registros más recientes de Ventas, Compras, Inventario, Clientes y Gastos? Esta operación actualizará el contenido de las hojas de cálculo en su cuenta.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSyncConfirmModal(false)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRealSync}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/25 transition active:scale-95"
              >
                Confirmar Sincronización
              </button>
            </div>
          </div>
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
                  <UserIcon className="w-3.5 h-3.5 text-amber-700" />
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
