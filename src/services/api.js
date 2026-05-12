const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQJLmhvZl-k932BihUyOSi1hDgazskBQJAzi63TpgP5sjzbGebm-YQ08NEpENj978/exec';

const FIELD_ALIASES = {
  orderId: ['ORDER ID', 'Order ID', 'orderId'],
  nama: ['NAMA', 'Nama', 'nama'],
  pesanan: ['PESANAN', 'Pesanan', 'pesanan'],
  totalHarga: ['TOTAL HARGA', 'Total Harga', 'Total', 'total'],
  status: ['STATUS', 'Status', 'status'],
  waktu: ['WAKTU', 'Waktu', 'waktu', 'Timestamp', 'timestamp'],
  linkWa: ['LINK NO WA', 'Link No WA', 'NO HP', 'LINK WA', 'Link WA', 'WA', 'Whatsapp', 'WHATSAPP', 'No WA', 'nomorHp', 'wa']
};

const getFirstValue = (row, keys, fallback = '') => {
  const key = keys.find(fieldName => row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '');
  return key ? row[key] : fallback;
};

const normalizeOrderRow = (row) => ({
  ...row,
  'ORDER ID': getFirstValue(row, FIELD_ALIASES.orderId),
  NAMA: getFirstValue(row, FIELD_ALIASES.nama),
  PESANAN: getFirstValue(row, FIELD_ALIASES.pesanan),
  'TOTAL HARGA': getFirstValue(row, FIELD_ALIASES.totalHarga, 0),
  STATUS: getFirstValue(row, FIELD_ALIASES.status, 'Pending'),
  WAKTU: getFirstValue(row, FIELD_ALIASES.waktu),
  'LINK NO WA': getFirstValue(row, FIELD_ALIASES.linkWa)
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

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  const normalizedOrders = data
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
