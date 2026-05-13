import { APP_TIME_ZONE, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../constants/dashboard';

export const parseExpenseAmount = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/[^\d-]/g, '');
  return Number(normalized) || 0;
};

export const getTodayExpenseDate = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export const normalizeExpenseDateValue = (value) => {
  if (!value) return '';

  const textValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(textValue)) return textValue;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return textValue;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export const createExpenseForm = () => ({
  expenseId: '',
  tanggal: getTodayExpenseDate(),
  kategori: EXPENSE_CATEGORIES[0],
  namaItem: '',
  qty: 1,
  hargaSatuan: '',
  metode: EXPENSE_PAYMENT_METHODS[0]
});

export const getExpenseId = (expense) => (
  expense?.['EXPENSE ID']
  || expense?.['Expense ID']
  || expense?.expenseId
  || ''
);

export const getExpenseDate = (expense) => (
  normalizeExpenseDateValue(
    expense?.TANGGAL
    || expense?.Tanggal
    || expense?.tanggal
    || expense?.DATE
    || expense?.Date
    || ''
  )
);

export const getExpenseCategory = (expense) => (
  expense?.KATEGORI
  || expense?.Kategori
  || expense?.kategori
  || EXPENSE_CATEGORIES[0]
);

export const getExpenseItemName = (expense) => (
  expense?.['NAMA ITEM']
  || expense?.['Nama Item']
  || expense?.namaItem
  || expense?.ITEM
  || expense?.Item
  || expense?.item
  || ''
);

export const getExpenseQty = (expense) => Number(
  expense?.QTY
  || expense?.Qty
  || expense?.qty
  || 0
);

export const getExpenseUnitPrice = (expense) => parseExpenseAmount(
  expense?.['HARGA SATUAN']
  || expense?.['Harga Satuan']
  || expense?.hargaSatuan
  || expense?.HARGA
  || expense?.Harga
  || expense?.harga
  || 0
);

export const getExpenseTotal = (expense) => {
  const directTotal = parseExpenseAmount(
    expense?.TOTAL
    || expense?.Total
    || expense?.total
    || expense?.JUMLAH
    || expense?.Jumlah
    || expense?.jumlah
    || 0
  );

  if (directTotal > 0) return directTotal;

  return getExpenseQty(expense) * getExpenseUnitPrice(expense);
};

export const getExpenseAmount = (expense) => getExpenseTotal(expense);

export const getExpensePaymentMethod = (expense) => (
  expense?.METODE
  || expense?.Metode
  || expense?.metode
  || expense?.PEMBAYARAN
  || expense?.Pembayaran
  || expense?.pembayaran
  || EXPENSE_PAYMENT_METHODS[0]
);

export const normalizeExpenseRow = (row) => ({
  ...row,
  'EXPENSE ID': getExpenseId(row),
  TANGGAL: getExpenseDate(row),
  KATEGORI: getExpenseCategory(row),
  'NAMA ITEM': getExpenseItemName(row),
  QTY: getExpenseQty(row),
  'HARGA SATUAN': getExpenseUnitPrice(row),
  TOTAL: getExpenseTotal(row),
  METODE: getExpensePaymentMethod(row)
});

export const buildExpensePayload = (form) => ({
  expenseId: form.expenseId,
  tanggal: form.tanggal,
  kategori: form.kategori,
  namaItem: form.namaItem,
  qty: Number(form.qty) || 0,
  hargaSatuan: parseExpenseAmount(form.hargaSatuan),
  total: (Number(form.qty) || 0) * parseExpenseAmount(form.hargaSatuan),
  metode: form.metode
});
