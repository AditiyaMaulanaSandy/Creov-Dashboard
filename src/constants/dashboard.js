export const ROWS_PER_PAGE = 10;
export const APP_TIME_ZONE = 'Asia/Jakarta';
export const APP_TIME_ZONE_OFFSET = '+07:00';

export const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pending', icon: '🕒', className: 'status-pending' },
  { key: 'diproses', label: 'Diproses', icon: '⚙️', className: 'status-diproses' },
  { key: 'selesai', label: 'Selesai', icon: '✅', className: 'status-selesai' },
  { key: 'batal', label: 'Batal', icon: '❌', className: 'status-batal' }
];

export const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    eyebrow: 'Overview',
    title: 'Dashboard',
    icon: 'fas fa-chart-pie',
    accentClass: 'menu-accent-blue'
  },
  {
    key: 'pesanan',
    label: 'Pesanan',
    eyebrow: 'Order',
    title: 'Pesanan',
    icon: 'fas fa-bag-shopping',
    accentClass: 'menu-accent-amber'
  },
  {
    key: 'pengeluaran',
    label: 'Pengeluaran',
    eyebrow: 'Expense',
    title: 'Pengeluaran',
    icon: 'fas fa-receipt',
    accentClass: 'menu-accent-green'
  },
  {
    key: 'laporan',
    label: 'Laporan',
    eyebrow: 'Report',
    title: 'Laporan',
    icon: 'fas fa-file-lines',
    accentClass: 'menu-accent-rose'
  }
];

export const PRODUCT_OPTIONS = [
  'Signature Layered Oreo',
  'Dubai Chewy Cookie Mini'
];

export const RECEIPT_ITEM_IMAGE_MAP = {
  'Signature Layered Oreo': '/menu/oreo.webp',
  'Dubai Chewy Cookie Mini': '/menu/dubai.webp'
};

export const PRODUCT_PRICING = {
  'Signature Layered Oreo': {
    unitPrice: 10000,
    bundleQty: 3,
    bundlePrice: 25000
  },
  'Dubai Chewy Cookie Mini': {
    unitPrice: 17000
  }
};

export const EXPENSE_CATEGORIES = [
  'Bahan Baku',
  'Packaging',
  'Operasional',
  'Transport',
  'Marketing',
  'Lainnya'
];

export const EXPENSE_PAYMENT_METHODS = [
  'Cash',
  'Transfer',
  'Qris'
];
