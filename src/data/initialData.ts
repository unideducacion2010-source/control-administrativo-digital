import { SaleItem, InventoryItem, ExpenseItem, PurchaseItem, ClientItem } from '../types';

export const initialInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    producto: 'Crema de mezcal - Fresa',
    categoria: 'Cremas artesanales',
    piezasCompradas: 9,
    costoUnitario: 133.33,
    inversion: 1199.97,
    piezasVendidas: 0,
    piezasDisponible: 9,
    precioVenta: 180.00,
    gananciaPorPieza: 46.67,
    gananciaPotencial: 420.03,
  },
  {
    id: 'inv-2',
    producto: 'Crema de mezcal - Chocolate',
    categoria: 'Cremas artesanales',
    piezasCompradas: 0,
    costoUnitario: 133.33,
    inversion: 0.00,
    piezasVendidas: 0,
    piezasDisponible: 0,
    precioVenta: 200.00,
    gananciaPorPieza: 66.67,
    gananciaPotencial: 0.00,
  },
  {
    id: 'inv-3',
    producto: 'Crema de mezcal - Otro',
    categoria: 'Cremas artesanales',
    piezasCompradas: 0,
    costoUnitario: 133.33,
    inversion: 0.00,
    piezasVendidas: 0,
    piezasDisponible: 0,
    precioVenta: 180.00,
    gananciaPorPieza: 46.67,
    gananciaPotencial: 0.00,
  },
];

export const initialSales: SaleItem[] = [
  {
    id: 'sale-1',
    fecha: new Date().toISOString().split('T')[0],
    producto: 'Crema de mezcal - Fresa',
    categoria: 'Cremas artesanales',
    cantidad: 1,
    costoUnitario: 133.33,
    precioVentaUnit: 180.00,
    piezasVendidas: 1,
    ingresos: 180.00,
    costoMercancia: 133.33,
    otrosGastos: 0.00,
    ganancia: 46.67,
    margen: 25.9,
    notas: 'Venta inicial de muestra',
  }
];

export const initialPurchases: PurchaseItem[] = [
  {
    id: 'pur-1',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: 'Destilados Artesanales S.A.',
    producto: 'Crema de mezcal - Fresa',
    categoria: 'Cremas artesanales',
    cantidad: 9,
    costoUnitario: 133.33,
    totalInvertido: 1199.97,
    estado: 'Recibido',
    notas: 'Lote inicial con botellas de vidrio',
  }
];

export const initialClients: ClientItem[] = [
  {
    id: 'cli-1',
    nombre: 'María González',
    telefono: '55 1234 5678',
    correo: 'maria.gonzalez@example.com',
    direccion: 'Av. Juárez #45, Centro',
    totalCompras: 1,
    ultimaCompra: new Date().toISOString().split('T')[0],
    notas: 'Cliente frecuente, prefiere sabor fresa',
  },
  {
    id: 'cli-2',
    nombre: 'Carlos Ramírez',
    telefono: '55 8765 4321',
    correo: 'carlos.ramirez@example.com',
    direccion: 'Calle Reforma #120',
    totalCompras: 0,
    ultimaCompra: '—',
    notas: 'Interesado en mayoreo',
  }
];

export const initialExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    fecha: new Date().toISOString().split('T')[0],
    concepto: 'Compra inicial de botellas y etiquetas',
    tipo: 'Insumos',
    monto: 250.00,
    notas: 'Materiales para empaque',
  }
];
