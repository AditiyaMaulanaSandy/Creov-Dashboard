import { formatRupiah } from './formatters';
import {
  APP_TIME_ZONE,
  PRODUCT_OPTIONS,
  PRODUCT_PRICING,
  STATUS_OPTIONS
} from '../constants/dashboard';

export const getTemplateItemTotal = (productName, qty) => {
  const quantity = Math.max(1, Number(qty) || 1);
  const pricing = PRODUCT_PRICING[productName];

  if (!pricing) return 0;

  if (pricing.bundleQty && pricing.bundlePrice) {
    const bundleCount = Math.floor(quantity / pricing.bundleQty);
    const remainder = quantity % pricing.bundleQty;
    return (bundleCount * pricing.bundlePrice) + (remainder * pricing.unitPrice);
  }

  return quantity * pricing.unitPrice;
};

export const getDefaultOrderDateTime = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    tanggal: `${values.year}-${values.month}-${values.day}`,
    jam: `${values.hour}:${values.minute}`
  };
};

export const createManualOrderItem = () => ({
  produk: PRODUCT_OPTIONS[0],
  qty: 1,
  harga: getTemplateItemTotal(PRODUCT_OPTIONS[0], 1)
});

export const createManualOrderForm = () => {
  const defaultOrderDateTime = getDefaultOrderDateTime();

  return {
    nama: '',
    items: [createManualOrderItem()],
    pengantaran: 'Pick up',
    pembayaran: 'Cash',
    alamat: '',
    wa: '',
    tanggal: defaultOrderDateTime.tanggal,
    jam: defaultOrderDateTime.jam
  };
};

export const parseCurrencyValue = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/[^\d-]/g, '');
  return Number(normalized) || 0;
};

export const getOrderDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDateInputValue = (value) => {
  const date = getOrderDate(value);
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export const getTimeInputValue = (value) => {
  const date = getOrderDate(value);
  if (!date) return '';

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

export const getDateRange = (rangeKey) => {
  const now = new Date();
  const today = getDateInputValue(now);
  const currentMonth = today.slice(0, 7);

  if (rangeKey === 'today') return { start: today, end: today };

  if (rangeKey === 'week') {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    return { start: getDateInputValue(startDate), end: today };
  }

  if (rangeKey === 'month') return { start: `${currentMonth}-01`, end: today };

  return { start: '', end: '' };
};

export const normalizeStatus = (value) => String(value || 'Pending').toLowerCase();

export const getStatusMeta = (statusValue) => {
  const normalized = normalizeStatus(statusValue);
  return STATUS_OPTIONS.find(status => normalized.includes(status.key)) || STATUS_OPTIONS[0];
};

export const getProductName = (line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('-')) return null;

  return trimmed
    .replace(/^-+\s*/, '')
    .replace(/\s*\(x\d+\).*$/i, '')
    .replace(/\s*=\s*Rp.*$/i, '')
    .trim();
};

export const getProductQty = (line) => {
  const match = line.match(/\(x(\d+)\)/i);
  return match ? Number(match[1]) : 1;
};

export const renderOrderLine = (line) => {
  const trimmedLine = line.trim();
  const shouldBoldLine = /^Order ID:|^Total Akhir:/i.test(trimmedLine);

  if (shouldBoldLine) {
    return <strong>{line}</strong>;
  }

  const segments = line.split(/(\*[^*]+\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith('*') && segment.endsWith('*')) {
      return <strong key={index}>{segment.slice(1, -1)}</strong>;
    }

    return segment;
  });
};

export const formatReceiptCurrency = (value) => formatRupiah(parseCurrencyValue(value)).replace(/^Rp/, 'Rp ');

export const getReceiptField = (order, fieldName, fallback = '-') => {
  const pattern = new RegExp(`^${fieldName}\\s*:\\s*(.+)$`, 'i');
  const match = String(order?.['PESANAN'] || '')
    .split('\n')
    .map(line => line.trim().match(pattern))
    .find(Boolean);

  return match?.[1]?.trim() || fallback;
};

export const getReceiptAddress = (order) => {
  const directAddress = order?.ALAMAT || order?.Alamat || order?.alamat || order?.ADDRESS || order?.Address || order?.address;
  if (directAddress && String(directAddress).trim()) return String(directAddress).trim();

  return getReceiptField(order, 'Alamat', '');
};

export const getReceiptItems = (order) => {
  const orderTotal = parseCurrencyValue(order?.['TOTAL HARGA']);
  const items = String(order?.['PESANAN'] || '')
    .split('\n')
    .map(line => {
      const name = getProductName(line);
      if (!name) return null;

      const priceMatch = line.match(/=\s*(Rp\s*[\d.]+)/i);
      const price = priceMatch ? parseCurrencyValue(priceMatch[1]) : orderTotal;

      return {
        name,
        qty: getProductQty(line),
        price: price || orderTotal
      };
    })
    .filter(Boolean);

  if (items.length > 0) return items;

  return [{
    name: 'Pesanan Creove',
    qty: 1,
    price: orderTotal
  }];
};

export const getWaLink = (row) => {
  const rawWA = row['LINK NO WA'] || row['Link No WA'] || row['NO HP'] || row['LINK WA'] || row['Link WA'] || row['WA'] || row['Whatsapp'] || row['WHATSAPP'] || row['No WA'] || row['nomorHp'] || row['wa'] || '';

  if (!rawWA || rawWA === '-' || String(rawWA).trim() === '') return null;

  let cleanPhone = String(rawWA).replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
  if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;

  if (cleanPhone.length < 8) return null;

  return `https://wa.me/${cleanPhone}`;
};
