export interface SaleItem {
  id: string;
  fecha: string;
  producto: string;
  categoria: string;
  cantidad: number;
  costoUnitario: number;
  precioVentaUnit: number;
  piezasVendidas: number;
  ingresos: number;
  costoMercancia: number;
  otrosGastos: number;
  ganancia: number;
  margen: number; // percentage
  notas: string;
}

export interface PurchaseItem {
  id: string;
  fecha: string;
  proveedor: string;
  producto: string;
  categoria: string;
  cantidad: number;
  costoUnitario: number;
  totalInvertido: number;
  estado: string; // Recibido, Pendiente, En camino
  notas: string;
}

export interface ClientItem {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  totalCompras: number;
  ultimaCompra: string;
  notas: string;
}

export interface InventoryItem {
  id: string;
  producto: string;
  categoria: string;
  piezasCompradas: number;
  costoUnitario: number;
  inversion: number;
  piezasVendidas: number;
  piezasDisponible: number;
  precioVenta: number;
  gananciaPorPieza: number;
  gananciaPotencial: number;
}

export interface ExpenseItem {
  id: string;
  fecha: string;
  concepto: string;
  tipo: string; // Operativo, Insumos, Transporte, etc.
  monto: number;
  notas: string;
}

export interface DriveConfig {
  isConnected: boolean;
  accountEmail: string;
  spreadsheetId: string;
  lastSynced: string | null;
  autoSync: boolean;
}
