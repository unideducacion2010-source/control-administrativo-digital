import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SaleItem,
  PurchaseItem,
  InventoryItem,
  ClientItem,
  ExpenseItem,
  BackupFolder,
} from '../types';
import { deduplicateById } from '../utils/antiRedundancy';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export async function createDriveFolder(
  name: string,
  parentId?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa');

  const metadata: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} al crear carpeta en Google Drive`);
  }

  const data = await res.json();
  const webViewLink = data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`;
  return { id: data.id, name: data.name, webViewLink };
}

export async function createGoogleSpreadsheet(
  title: string,
  parentFolderId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa');

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Resumen General' } },
        { properties: { title: 'Ventas' } },
        { properties: { title: 'Compras' } },
        { properties: { title: 'Inventario' } },
        { properties: { title: 'Clientes' } },
        { properties: { title: 'Gastos' } },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} al crear libro en Google Sheets`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  if (parentFolderId && spreadsheetId) {
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${parentFolderId}&fields=id,parents`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (e) {
      console.warn('Could not move spreadsheet to folder:', e);
    }
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function syncAllDataToSheets(
  spreadsheetId: string,
  payload: {
    sales: SaleItem[];
    purchases: PurchaseItem[];
    inventory: InventoryItem[];
    clients: ClientItem[];
    expenses: ExpenseItem[];
  }
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa');

  const sales = deduplicateById(payload.sales || []);
  const purchases = deduplicateById(payload.purchases || []);
  const inventory = deduplicateById(payload.inventory || []);
  const clients = deduplicateById(payload.clients || []);
  const expenses = deduplicateById(payload.expenses || []);

  const totalVentas = sales.reduce((acc, s) => acc + (s.ingresos || 0), 0);
  const totalGanancia = sales.reduce((acc, s) => acc + (s.ganancia || 0), 0);
  const totalCompras = purchases.reduce((acc, p) => acc + (p.totalInvertido || 0), 0);
  const totalGastos = expenses.reduce((acc, e) => acc + (e.monto || 0), 0);
  const valorInventario = inventory.reduce((acc, i) => acc + (i.inversion || 0), 0);

  const batchData = [
    {
      range: 'Resumen General!A1:D10',
      values: [
        ['CONTROL ADMINISTRATIVO - RESUMEN GENERAL', '', '', ''],
        ['Última Sincronización', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],
        ['MÉTRICA CLAVE', 'VALOR ($)', 'REGISTROS', 'NOTAS'],
        ['Total Ventas', totalVentas, sales.length, 'Ingresos brutos acumulados'],
        ['Ganancia de Ventas', totalGanancia, sales.length, 'Margen acumulado en ventas'],
        ['Total Compras', totalCompras, purchases.length, 'Inversión en mercancía'],
        ['Total Gastos Operativos', totalGastos, expenses.length, 'Gastos y egresos'],
        ['Valor de Stock Actual', valorInventario, inventory.length, 'Costo total en inventario'],
        ['Total Clientes Registrados', clients.length, clients.length, 'Base de clientes'],
      ],
    },
    {
      range: 'Ventas!A1:N1',
      values: [
        [
          'ID',
          'Fecha',
          'Producto',
          'Categoría',
          'Cantidad',
          'Costo Unit.',
          'Precio Venta Unit.',
          'Piezas Vendidas',
          'Ingresos ($)',
          'Costo Mercancía ($)',
          'Otros Gastos ($)',
          'Ganancia ($)',
          'Margen (%)',
          'Notas',
        ],
      ],
    },
    ...(sales.length > 0
      ? [
          {
            range: `Ventas!A2:N${sales.length + 1}`,
            values: sales.map((s) => [
              s.id,
              s.fecha,
              s.producto,
              s.categoria,
              s.cantidad,
              s.costoUnitario,
              s.precioVentaUnit,
              s.piezasVendidas,
              s.ingresos,
              s.costoMercancia,
              s.otrosGastos,
              s.ganancia,
              `${s.margen}%`,
              s.notas || '',
            ]),
          },
        ]
      : []),
    {
      range: 'Compras!A1:J1',
      values: [
        [
          'ID',
          'Fecha',
          'Proveedor',
          'Producto',
          'Categoría',
          'Cantidad',
          'Costo Unit.',
          'Total Invertido ($)',
          'Estado',
          'Notas',
        ],
      ],
    },
    ...(purchases.length > 0
      ? [
          {
            range: `Compras!A2:J${purchases.length + 1}`,
            values: purchases.map((p) => [
              p.id,
              p.fecha,
              p.proveedor,
              p.producto,
              p.categoria,
              p.cantidad,
              p.costoUnitario,
              p.totalInvertido,
              p.estado,
              p.notas || '',
            ]),
          },
        ]
      : []),
    {
      range: 'Inventario!A1:K1',
      values: [
        [
          'ID',
          'Producto',
          'Categoría',
          'Piezas Compradas',
          'Costo Unit.',
          'Inversión ($)',
          'Piezas Vendidas',
          'Piezas Disponibles',
          'Precio Venta ($)',
          'Ganancia p/Pieza ($)',
          'Ganancia Potencial ($)',
        ],
      ],
    },
    ...(inventory.length > 0
      ? [
          {
            range: `Inventario!A2:K${inventory.length + 1}`,
            values: inventory.map((i) => [
              i.id,
              i.producto,
              i.categoria,
              i.piezasCompradas,
              i.costoUnitario,
              i.inversion,
              i.piezasVendidas,
              i.piezasDisponible,
              i.precioVenta,
              i.gananciaPorPieza,
              i.gananciaPotencial,
            ]),
          },
        ]
      : []),
    {
      range: 'Clientes!A1:H1',
      values: [
        [
          'ID',
          'Nombre',
          'Teléfono',
          'Correo Electrónico',
          'Dirección',
          'Total Compras ($)',
          'Última Compra',
          'Notas',
        ],
      ],
    },
    ...(clients.length > 0
      ? [
          {
            range: `Clientes!A2:H${clients.length + 1}`,
            values: clients.map((c) => [
              c.id,
              c.nombre,
              c.telefono,
              c.correo,
              c.direccion,
              c.totalCompras,
              c.ultimaCompra,
              c.notas || '',
            ]),
          },
        ]
      : []),
    {
      range: 'Gastos!A1:F1',
      values: [['ID', 'Fecha', 'Concepto', 'Tipo', 'Monto ($)', 'Notas']],
    },
    ...(expenses.length > 0
      ? [
          {
            range: `Gastos!A2:F${expenses.length + 1}`,
            values: expenses.map((e) => [
              e.id,
              e.fecha,
              e.concepto,
              e.tipo,
              e.monto,
              e.notas || '',
            ]),
          },
        ]
      : []),
  ];

  // Cleanly clear existing data rows so old deleted rows don't leave phantom records
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ranges: [
            'Resumen General!A1:D25',
            'Ventas!A2:Z2000',
            'Compras!A2:Z2000',
            'Inventario!A2:Z2000',
            'Clientes!A2:Z2000',
            'Gastos!A2:Z2000',
          ],
        }),
      }
    );
  } catch (e) {
    console.warn('batchClear non-fatal warning:', e);
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('La sesión de Google ha expirado por seguridad. Haga clic en renovar sesión para sincronizar sin perder ningún dato.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} al sincronizar datos con Google Sheets`);
  }

  return true;
}
