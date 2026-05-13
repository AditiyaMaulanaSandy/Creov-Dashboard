import { APP_TIME_ZONE, APP_TIME_ZONE_OFFSET } from '../constants/dashboard';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQJLmhvZl-k932BihUyOSi1hDgazskBQJAzi63TpgP5sjzbGebm-YQ08NEpENj978/exec';

const FIELD_ALIASES = {
  orderId: ['ORDER ID', 'Order ID', 'orderId'],
  nama: ['NAMA', 'Nama', 'nama'],
  pesanan: ['PESANAN', 'Pesanan', 'pesanan'],
  totalHarga: ['TOTAL HARGA', 'Total Harga', 'Total', 'total', 'TOTAL', 'JUMLAH', 'Jumlah', 'jumlah'],
  status: ['STATUS', 'Status', 'status'],
  waktu: ['WAKTU', 'Waktu', 'waktu', 'Timestamp', 'timestamp'],
  tanggal: ['TANGGAL', 'Tanggal', 'tanggal', 'DATE', 'Date', 'date'],
  jam: ['JAM', 'Jam', 'jam', 'TIME', 'Time', 'time'],
  linkWa: ['LINK NO WA', 'Link No WA', 'NO HP', 'LINK WA', 'Link WA', 'WA', 'Whatsapp', 'WHATSAPP', 'No WA', 'nomorHp', 'wa']
};

const getFirstValue = (row, keys, fallback = '') => {
  const key = keys.find(fieldName => row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '');
  return key ? row[key] : fallback;
};

const getRowsFromResult = (result, keys) => {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];

  const rows = keys
    .map(key => result[key])
    .find(value => Array.isArray(value));

  return rows || [];
};

const formatDateInAppZone = (value) => {
  if (!value) return '';

  const textValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(textValue)) return textValue;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const formatTimeInAppZone = (value) => {
  if (!value) return '00:00';

  const textValue = String(value).trim();
  const timeMatch = textValue.match(/^(\d{1,2})[:.](\d{2})/);
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '00:00';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.hour}:${values.minute}`;
};

const getOrderTimestamp = (row) => {
  const directTimestamp = getFirstValue(row, FIELD_ALIASES.waktu);
  if (directTimestamp) return directTimestamp;

  const dateValue = formatDateInAppZone(getFirstValue(row, FIELD_ALIASES.tanggal));
  if (!dateValue) return '';

  const timeValue = formatTimeInAppZone(getFirstValue(row, FIELD_ALIASES.jam));
  return `${dateValue}T${timeValue}:00${APP_TIME_ZONE_OFFSET}`;
};

const normalizeOrderRow = (row) => ({
  ...row,
  'ORDER ID': getFirstValue(row, FIELD_ALIASES.orderId),
  NAMA: getFirstValue(row, FIELD_ALIASES.nama),
  PESANAN: getFirstValue(row, FIELD_ALIASES.pesanan),
  'TOTAL HARGA': getFirstValue(row, FIELD_ALIASES.totalHarga, 0),
  STATUS: getFirstValue(row, FIELD_ALIASES.status, 'Pending'),
  WAKTU: getOrderTimestamp(row),
  'LINK NO WA': getFirstValue(row, FIELD_ALIASES.linkWa)
});

const EXPENSE_FIELD_ALIASES = {
  expenseId: ['EXPENSE ID', 'Expense ID', 'expenseId'],
  tanggal: ['TANGGAL', 'Tanggal', 'tanggal', 'DATE', 'Date'],
  kategori: ['KATEGORI', 'Kategori', 'kategori'],
  namaItem: ['NAMA ITEM', 'Nama Item', 'namaItem', 'ITEM', 'Item', 'item'],
  qty: ['QTY', 'Qty', 'qty'],
  hargaSatuan: ['HARGA SATUAN', 'Harga Satuan', 'hargaSatuan', 'HARGA', 'Harga', 'harga'],
  total: ['TOTAL', 'Total', 'total', 'JUMLAH', 'Jumlah', 'jumlah', 'NOMINAL', 'Nominal', 'nominal'],
  metode: ['METODE', 'Metode', 'metode', 'PEMBAYARAN', 'Pembayaran', 'pembayaran'],
  dibuatPada: ['DIBUAT PADA', 'Dibuat Pada', 'dibuatPada', 'CREATED AT', 'Created At', 'createdAt']
};

const normalizeExpenseRow = (row) => ({
  ...row,
  'EXPENSE ID': getFirstValue(row, EXPENSE_FIELD_ALIASES.expenseId),
  TANGGAL: getFirstValue(row, EXPENSE_FIELD_ALIASES.tanggal),
  KATEGORI: getFirstValue(row, EXPENSE_FIELD_ALIASES.kategori),
  'NAMA ITEM': getFirstValue(row, EXPENSE_FIELD_ALIASES.namaItem),
  QTY: getFirstValue(row, EXPENSE_FIELD_ALIASES.qty, 0),
  'HARGA SATUAN': getFirstValue(row, EXPENSE_FIELD_ALIASES.hargaSatuan, 0),
  TOTAL: getFirstValue(row, EXPENSE_FIELD_ALIASES.total, 0),
  METODE: getFirstValue(row, EXPENSE_FIELD_ALIASES.metode, 'Cash'),
  'DIBUAT PADA': getFirstValue(row, EXPENSE_FIELD_ALIASES.dibuatPada)
});

const keepLatestOrderPerId = (orders) => {
  const seenOrderIds = new Set();

  return orders.filter((order) => {
    const orderId = String(order['ORDER ID'] || '').trim();
    if (!orderId || seenOrderIds.has(orderId)) return false;

    seenOrderIds.add(orderId);
    return true;
  });
};

// Tarik Data
export const fetchOrders = async () => {
  const response = await fetch(SCRIPT_URL);
  if (!response.ok) throw new Error('Gagal menarik data pesanan');

  const result = await response.json();
  const rows = getRowsFromResult(result, ['data', 'rows', 'orders', 'pesanan']);

  const normalizedOrders = rows
    .map(normalizeOrderRow)
    .filter(row => row['ORDER ID'])
    .reverse();

  return keepLatestOrderPerId(normalizedOrders);
};

// Update Status
export const updateOrderStatusAPI = async (orderId, newStatus) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateStatus', orderId, status: newStatus })
  });
};

// Edit Pesanan
export const editOrderAPI = async (orderData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'editOrder', ...orderData })
  });
};

// Tambah Pesanan Baru
export const addOrderAPI = async (orderData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

export const fetchExpenses = async () => {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'getExpenses' })
  });
  if (!response.ok) throw new Error('Gagal menarik data pengeluaran');

  const result = await response.json();
  const rows = getRowsFromResult(result, ['data', 'rows', 'expenses', 'pengeluaran']);

  return rows
    .map(normalizeExpenseRow)
    .filter(row => row['EXPENSE ID'] || row['NAMA ITEM'])
    .reverse();
};

export const addExpenseAPI = async (expenseData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addExpense', ...expenseData })
  });
};

export const editExpenseAPI = async (expenseData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'editExpense', ...expenseData })
  });
};
