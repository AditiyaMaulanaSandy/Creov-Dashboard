import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { formatRupiah } from '../utils/formatters';
import { fetchOrders, updateOrderStatusAPI, addOrderAPI, editOrderAPI } from '../services/api';

const ROWS_PER_PAGE = 10;
const APP_TIME_ZONE = 'Asia/Jakarta';
const APP_TIME_ZONE_OFFSET = '+07:00';
const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pending', icon: '🕒', className: 'status-pending' },
  { key: 'diproses', label: 'Diproses', icon: '⚙️', className: 'status-diproses' },
  { key: 'selesai', label: 'Selesai', icon: '✅', className: 'status-selesai' },
  { key: 'batal', label: 'Batal', icon: '❌', className: 'status-batal' }
];

const PRODUCT_OPTIONS = [
  'Signature Layered Oreo',
  'Dubai Chewy Cookie Mini'
];

const RECEIPT_ITEM_IMAGE_MAP = {
  'Signature Layered Oreo': '/menu/oreo.webp',
  'Dubai Chewy Cookie Mini': '/menu/dubai.webp'
};

const PRODUCT_PRICING = {
  'Signature Layered Oreo': {
    unitPrice: 10000,
    bundleQty: 3,
    bundlePrice: 25000
  },
  'Dubai Chewy Cookie Mini': {
    unitPrice: 17000
  }
};

const getTemplateItemTotal = (productName, qty) => {
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

const createManualOrderItem = () => ({
  produk: PRODUCT_OPTIONS[0],
  qty: 1,
  harga: getTemplateItemTotal(PRODUCT_OPTIONS[0], 1)
});

const createManualOrderForm = () => {
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

const getDefaultOrderDateTime = () => {
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

const parseCurrencyValue = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/[^\d-]/g, '');
  return Number(normalized) || 0;
};

const getOrderDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateInputValue = (value) => {
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

const getTimeInputValue = (value) => {
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

const getDateRange = (rangeKey) => {
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

const normalizeStatus = (value) => String(value || 'Pending').toLowerCase();

const getStatusMeta = (statusValue) => {
  const normalized = normalizeStatus(statusValue);
  return STATUS_OPTIONS.find(status => normalized.includes(status.key)) || STATUS_OPTIONS[0];
};

const getProductName = (line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('-')) return null;

  return trimmed
    .replace(/^-+\s*/, '')
    .replace(/\s*\(x\d+\).*$/i, '')
    .replace(/\s*=\s*Rp.*$/i, '')
    .trim();
};

const getProductQty = (line) => {
  const match = line.match(/\(x(\d+)\)/i);
  return match ? Number(match[1]) : 1;
};

const renderOrderLine = (line) => {
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

const formatReceiptCurrency = (value) => formatRupiah(parseCurrencyValue(value)).replace(/^Rp/, 'Rp ');

const readApiResult = async (response) => {
  let result = null;

  try {
    result = await response.json();
  } catch {
    // Some Apps Script responses are empty even when the request succeeds.
  }

  if (!response.ok || result?.result === 'error' || result?.status === 'error') {
    throw new Error(result?.message || 'Request gagal');
  }

  return result || {};
};

const isSuccessResult = (result) => result.result === 'success' || result.status === 'success';

const getReceiptField = (order, fieldName, fallback = '-') => {
  const pattern = new RegExp(`^${fieldName}\\s*:\\s*(.+)$`, 'i');
  const match = String(order?.['PESANAN'] || '')
    .split('\n')
    .map(line => line.trim().match(pattern))
    .find(Boolean);

  return match?.[1]?.trim() || fallback;
};

const getReceiptAddress = (order) => {
  const directAddress = order?.ALAMAT || order?.Alamat || order?.alamat || order?.ADDRESS || order?.Address || order?.address;
  if (directAddress && String(directAddress).trim()) return String(directAddress).trim();

  return getReceiptField(order, 'Alamat', '');
};

const getReceiptItems = (order) => {
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

function ReceiptItemVisual({ itemName }) {
  const [isImageFailed, setIsImageFailed] = useState(false);
  const imageSrc = RECEIPT_ITEM_IMAGE_MAP[itemName];

  if (!imageSrc || isImageFailed) {
    return (
      <div className="receipt-product-visual" aria-hidden="true">
        <div className="receipt-dessert-cup">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-product-visual">
      <img
        src={imageSrc}
        alt={itemName}
        className="receipt-product-image"
        loading="lazy"
        onError={() => setIsImageFailed(true)}
      />
    </div>
  );
}

function ToastStack({ toasts }) {
  const iconMap = {
    success: 'fas fa-check',
    error: 'fas fa-triangle-exclamation',
    warning: 'fas fa-circle-exclamation',
    info: 'fas fa-circle-info'
  };

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div className={`toast-card toast-${toast.type}`} key={toast.id}>
          <span className="toast-icon">
            <i className={iconMap[toast.type] || iconMap.info}></i>
          </span>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ theme, toggleTheme }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState(() => getDateRange('all'));
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [newOrderNotice, setNewOrderNotice] = useState(null);
  const [toasts, setToasts] = useState([]);
  const knownOrderIdsRef = useRef(new Set());
  const hasLoadedOnceRef = useRef(false);
  const toastTimersRef = useRef([]);
  
  // States Modal Struk
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState({ url: '', filename: '' });
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null); 
  const receiptRef = useRef(null);

  // States Modal Tambah Pesanan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  
  const [manualForm, setManualForm] = useState(createManualOrderForm);

  const [editForm, setEditForm] = useState({
    orderId: '',
    nama: '',
    pesanan: '',
    total: '',
    wa: '',
    status: 'Pending',
    tanggal: '',
    jam: ''
  });

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  const showToast = useCallback(({ type = 'info', title, message }) => {
    const toastId = `${Date.now()}-${Math.random()}`;

    setToasts(prev => [...prev, { id: toastId, type, title, message }].slice(-4));

    const timerId = window.setTimeout(() => {
      dismissToast(toastId);
    }, 4200);

    toastTimersRef.current.push(timerId);
  }, [dismissToast]);

  useEffect(() => {
    const toastTimers = toastTimersRef.current;

    return () => {
      toastTimers.forEach(timerId => window.clearTimeout(timerId));
    };
  }, []);

  const loadData = useCallback(async ({ silent = false, notifySuccess = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchOrders();
      const incomingIds = new Set(data.map(row => row['ORDER ID']).filter(Boolean));
      const newIds = data
        .map(row => row['ORDER ID'])
        .filter(orderId => orderId && !knownOrderIdsRef.current.has(orderId));

      if (hasLoadedOnceRef.current && newIds.length > 0) {
        const newestOrder = data.find(row => row['ORDER ID'] === newIds[0]);
        setNewOrderNotice({
          count: newIds.length,
          latestName: newestOrder?.['NAMA'] || 'Pesanan baru'
        });
      }

      knownOrderIdsRef.current = incomingIds;
      hasLoadedOnceRef.current = true;
      setOrders(data);

      if (notifySuccess) {
        showToast({
          type: 'success',
          title: 'Data sudah diperbarui',
          message: `${data.length} pesanan berhasil dimuat.`
        });
      }
    } catch {
      if (!silent) {
        showToast({
          type: 'error',
          title: 'Gagal menarik data',
          message: 'Pastikan koneksi internet lancar dan Google Script sudah ter-deploy.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadData({ silent: true });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Lock background scroll when any modal is open (add / edit / receipt)
  useEffect(() => {
    const modalOpen = isAddModalOpen || isEditModalOpen || isReceiptModalOpen;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    if (modalOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow || '';
      document.body.style.paddingRight = prevPaddingRight || '';
    };
  }, [isAddModalOpen, isEditModalOpen, isReceiptModalOpen]);

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update (Langsung ganti di layar agar terasa responsif)
    setOrders(prev => prev.map(o => (o['ORDER ID'] === orderId) ? { ...o, STATUS: newStatus } : o));
    try {
      const response = await updateOrderStatusAPI(orderId, newStatus);
      await readApiResult(response);
      showToast({
        type: 'success',
        title: 'Status tersimpan',
        message: `${orderId} diubah ke ${newStatus}.`
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Gagal update status',
        message: 'Perubahan dibatalkan, data akan dimuat ulang.'
      });
      loadData(); // Rollback kalau gagal
    }
  };

  // --- LOGIKA TAMBAH PESANAN WA ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setManualForm(prev => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (
        itemIndex === index
          ? (() => {
              const nextItem = { ...item, [field]: field === 'qty' ? Math.max(1, Number(value) || 1) : value };
              nextItem.harga = getTemplateItemTotal(nextItem.produk, nextItem.qty);
              return nextItem;
            })()
          : item
      ))
    }));
  };

  const addOrderItem = () => {
    setManualForm(prev => ({
      ...prev,
      items: [...prev.items, createManualOrderItem()]
    }));
  };

  const removeOrderItem = (index) => {
    setManualForm(prev => ({
      ...prev,
      items: prev.items.length > 1
        ? prev.items.filter((_, itemIndex) => itemIndex !== index)
        : prev.items
    }));
  };

  const manualOrderTotal = manualForm.items.reduce((sum, item) => {
    return sum + parseCurrencyValue(item.harga);
  }, 0);

  const handleSaveOrder = async () => {
    const validItems = manualForm.items.filter(item => item.produk && Number(item.qty) > 0 && parseCurrencyValue(item.harga) > 0);

    if (!manualForm.nama || validItems.length === 0 || !manualForm.tanggal || !manualForm.jam) {
      showToast({
        type: 'warning',
        title: 'Data belum lengkap',
        message: 'Lengkapi nama, item pesanan, tanggal, dan jam.'
      });
      return;
    }

    if (validItems.length !== manualForm.items.length) {
      showToast({
        type: 'warning',
        title: 'Item belum valid',
        message: 'Pastikan setiap item punya produk, qty, dan harga.'
      });
      return;
    }

    if (manualOrderTotal <= 0) {
      showToast({
        type: 'warning',
        title: 'Total belum valid',
        message: 'Total harga pesanan masih kosong atau nol.'
      });
      return;
    }

    if ((manualForm.pengantaran === 'Delivery' || manualForm.pengantaran === 'Kurir (Free)') && !manualForm.alamat) {
      showToast({
        type: 'warning',
        title: 'Alamat dibutuhkan',
        message: 'Isi alamat pengantaran untuk COD atau Kurir.'
      });
      return;
    }

    setSavingOrder(true);
    const newOrderId = 'CRV-' + Math.floor(100000 + Math.random() * 900000);
    const strWaktu = `${manualForm.tanggal}T${manualForm.jam}:00${APP_TIME_ZONE_OFFSET}`;
    const formatRpText = formatRupiah(manualOrderTotal);
    const pesananLines = validItems.map(item => {
      return `- ${item.produk} (x${item.qty}) = ${formatRupiah(parseCurrencyValue(item.harga))}`;
    });

    // PERBAIKAN: Menambahkan kembali tanda bintang (*) agar fungsi formatBoldText di App Script bekerja
    const pesananGabungan = `*Order ID: ${newOrderId}*

Halo! Saya ingin memesan:

${pesananLines.join('\n')}

*Total Akhir: ${formatRpText}*

Nama: ${manualForm.nama}
Pengantaran: ${manualForm.pengantaran}
Pembayaran: ${manualForm.pembayaran}`;

    const alamatLine = manualForm.alamat ? `\nAlamat: ${manualForm.alamat}` : '';
    const pesananGabunganWithAlamat = pesananGabungan + alamatLine;

    const orderData = {
      action: 'addOrder',
      waktu: strWaktu,
      WAKTU: strWaktu,
      tanggal: manualForm.tanggal,
      jam: manualForm.jam,
      orderId: newOrderId,
      nama: manualForm.nama,
      pesanan: pesananGabunganWithAlamat, 
      total: manualOrderTotal,
      wa: manualForm.wa,
      alamat: manualForm.alamat,
      status: 'Pending'
    };

    try {
      const response = await addOrderAPI(orderData);
      const result = await readApiResult(response);
      if (isSuccessResult(result)) {
        showToast({
          type: 'success',
          title: 'Pesanan ditambahkan',
          message: `${newOrderId} berhasil disimpan.`
        });
        setIsAddModalOpen(false);
        setManualForm(createManualOrderForm());
        loadData();
      } else {
        showToast({
          type: 'error',
          title: 'Gagal menyimpan',
          message: 'Server belum mengembalikan status sukses.'
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Koneksi terputus',
        message: 'Pesanan belum berhasil disimpan.'
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // --- LOGIKA STRUK HTML2CANVAS ---
  const handlePreviewReceipt = (order) => {
    setActiveReceiptOrder(order);
    setTimeout(async () => {
      if (!receiptRef.current) return;
      try {
        const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
        setReceiptData({ url: canvas.toDataURL("image/png"), filename: `Receipt_${order['ORDER ID']}_Creove.png` });
        setIsReceiptModalOpen(true);
      } catch {
        showToast({
          type: 'error',
          title: 'Gagal membuat struk',
          message: 'Coba buka preview struk beberapa saat lagi.'
        });
      }
    }, 100);
  };

  // --- FUNGSI PENCARI LINK WA SUPER AKURAT ---
  const getWaLink = (row) => {
    const rawWA = row['LINK NO WA'] || row['Link No WA'] || row['NO HP'] || row['LINK WA'] || row['Link WA'] || row['WA'] || row['Whatsapp'] || row['WHATSAPP'] || row['No WA'] || row['nomorHp'] || row['wa'] || '';
    
    if (!rawWA || rawWA === '-' || String(rawWA).trim() === '') return null;
    
    let cleanPhone = String(rawWA).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
    if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;
    
    if (cleanPhone.length < 8) return null;

    return `https://wa.me/${cleanPhone}`;
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenEditModal = (row) => {
    setEditForm({
      orderId: row['ORDER ID'] || '',
      nama: row['NAMA'] || '',
      pesanan: row['PESANAN'] || '',
      total: parseCurrencyValue(row['TOTAL HARGA']),
      wa: row['LINK NO WA'] || row['Link No WA'] || row['NO HP'] || row['LINK WA'] || row['Link WA'] || row['WA'] || row['Whatsapp'] || row['WHATSAPP'] || row['No WA'] || row['nomorHp'] || row['wa'] || '',
      status: row['STATUS'] || 'Pending',
      tanggal: getDateInputValue(row['WAKTU']) || getDefaultOrderDateTime().tanggal,
      jam: getTimeInputValue(row['WAKTU']) || getDefaultOrderDateTime().jam
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const editTotal = parseCurrencyValue(editForm.total);

    if (!editForm.orderId || !editForm.nama || editTotal <= 0 || !editForm.tanggal || !editForm.jam) {
      showToast({
        type: 'warning',
        title: 'Data edit belum lengkap',
        message: 'Lengkapi nama, total, tanggal, dan jam.'
      });
      return;
    }

    setSavingEdit(true);
    const strWaktu = `${editForm.tanggal}T${editForm.jam}:00${APP_TIME_ZONE_OFFSET}`;
    const editData = {
      orderId: editForm.orderId,
      waktu: strWaktu,
      WAKTU: strWaktu,
      nama: editForm.nama,
      pesanan: editForm.pesanan,
      total: editTotal,
      wa: editForm.wa,
      status: editForm.status
    };

    try {
      const response = await editOrderAPI(editData);
      const result = await readApiResult(response);
      if (isSuccessResult(result)) {
        showToast({
          type: 'success',
          title: 'Pesanan diperbarui',
          message: `${editForm.orderId} berhasil diedit.`
        });
        setIsEditModalOpen(false);
        await loadData();
      } else {
        showToast({
          type: 'error',
          title: 'Gagal mengedit',
          message: 'Pastikan Apps Script sudah mendukung action editOrder.'
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Koneksi terputus',
        message: 'Perubahan pesanan belum berhasil disimpan.'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDatePreset = (rangeKey) => {
    setDateFilter(getDateRange(rangeKey));
    setCurrentPage(1);
  };

  const formatOrderDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: APP_TIME_ZONE });
  };

  const formatOrderTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIME_ZONE }).replace(/\./g, ':');
  };

  // --- SUMMARY, FILTERING & PENCARIAN ---
  const { totalOrders, totalRevenue, statusSummary, topProducts } = useMemo(() => {
    let rev = 0; let count = 0;
    const summary = { pending: 0, diproses: 0, selesai: 0, batal: 0 };
    const productMap = new Map();

    orders.forEach(row => {
      const status = normalizeStatus(row['STATUS'] || row['Status']);
      const statusMeta = getStatusMeta(status);
      summary[statusMeta.key] += 1;

      if (!status.includes('batal')) {
        rev += parseCurrencyValue(row['TOTAL HARGA'] || row['Total Harga'] || row['Total']);
        count++;
      }

      if (status.includes('batal')) return;

      String(row['PESANAN'] || '').split('\n').forEach(line => {
        const productName = getProductName(line);
        if (!productName) return;

        const current = productMap.get(productName) || 0;
        productMap.set(productName, current + getProductQty(line));
      });
    });

    const products = Array.from(productMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    return { totalOrders: count, totalRevenue: rev, statusSummary: summary, topProducts: products };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    // Ubah keyword pencarian jadi huruf kecil agar Case-Insensitive
    const searchKeyword = currentSearch.toLowerCase();
    
    return orders.filter(row => {
      const orderId = String(row['ORDER ID'] || '').toLowerCase();
      const nama = String(row['NAMA'] || '').toLowerCase();
      const status = String(row['STATUS'] || 'Pending').toLowerCase();
      const orderDateValue = getDateInputValue(row['WAKTU']);
      
      const matchTab = currentTab === 'all' || status.includes(currentTab);
      // Pengecekan pencarian juga pakai keyword huruf kecil
      const matchSearch = searchKeyword === '' || orderId.includes(searchKeyword) || nama.includes(searchKeyword);
      const matchStartDate = !dateFilter.start || (orderDateValue && orderDateValue >= dateFilter.start);
      const matchEndDate = !dateFilter.end || (orderDateValue && orderDateValue <= dateFilter.end);
      
      return matchTab && matchSearch && matchStartDate && matchEndDate;
    });
  }, [orders, currentSearch, currentTab, dateFilter]);

  const activeDatePreset = useMemo(() => {
    const presetKeys = ['today', 'week', 'month', 'all'];
    const matchedKey = presetKeys.find((key) => {
      const preset = getDateRange(key);
      return preset.start === dateFilter.start && preset.end === dateFilter.end;
    });

    return matchedKey || '';
  }, [dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ROWS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedOrders = filteredOrders.slice((safeCurrentPage - 1) * ROWS_PER_PAGE, safeCurrentPage * ROWS_PER_PAGE);
  const dashboardDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE
  }).format(currentDateTime);
  const dashboardTimeLabel = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: APP_TIME_ZONE
  }).format(currentDateTime).replace(/\./g, ':');
  const dashboardHour = Number(new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: APP_TIME_ZONE
  }).format(currentDateTime));
  const dashboardGreeting = dashboardHour < 12
    ? 'Good morning'
    : dashboardHour < 17
      ? 'Good afternoon'
      : 'Good evening';

  return (
    <>
    <ToastStack toasts={toasts} />
    <div className="dashboard-container">
      {/* HEADER NAVBAR */}
      <div className="dashboard-header-panel">
        <div className="header top-nav">
          <h1 className="brand-title">
            <span className="brand-logo-mark" role="img" aria-label="Logo Creove"></span>
            Creov&eacute; Dashboard
          </h1>
          <div className="top-nav-actions">
            <button onClick={toggleTheme} className="btn-outline-icon header-icon-btn" title="Ganti tema" aria-label="Ganti tema">
              <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
            </button>
            <button onClick={() => loadData({ notifySuccess: true })} className="btn-outline-primary header-refresh-btn">
              <i className="fas fa-sync-alt"></i>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
        <div className="dashboard-greeting-bar">
          <div className="dashboard-greeting-copy">
            <h2>{dashboardGreeting}, Admin <span aria-hidden="true">{'\u{1F44B}'}</span></h2>
            <p>Berikut ringkasan pesanan dan pendapatan hari ini.</p>
          </div>
          <div className="dashboard-date-pill">
            <i className="far fa-calendar"></i>
            <span>{dashboardDateLabel}</span>
            <span className="dashboard-time-separator">{'\u2022'}</span>
            <span className="dashboard-time-label">{dashboardTimeLabel}</span>
          </div>
        </div>
      </div>

      {newOrderNotice && (
        <div className="new-order-notice">
          <div>
            <strong>{newOrderNotice.count} pesanan baru masuk</strong>
            <span>Terbaru dari {newOrderNotice.latestName}</span>
          </div>
          <button onClick={() => setNewOrderNotice(null)} className="notice-close-btn">Tutup</button>
        </div>
      )}

      {/* SUMMARY WIDGETS */}
      <div className="summary-grid">
        <div className="summary-card-modern">
          <div className="icon-box-modern"><i className="fas fa-shopping-bag"></i></div>
          <div className="info-modern"><span className="title-modern">Total Pesanan Aktif</span><h3>{totalOrders}</h3></div>
        </div>
        <div className="summary-card-modern">
          <div className="icon-box-modern"><i className="fas fa-wallet"></i></div>
          <div className="info-modern"><span className="title-modern">Total Pendapatan</span><h3>{formatRupiah(totalRevenue)}</h3></div>
        </div>
      </div>

      <div className="status-summary-grid">
        <button
          className={`status-summary-card ${currentTab === 'all' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('all'); setCurrentPage(1); }}
        >
          <span className="status-dot status-all"><i className="fas fa-layer-group"></i></span>
          <span>Semua</span>
          <strong>{orders.length}</strong>
        </button>
        {STATUS_OPTIONS.map(status => (
          <button
            key={status.key}
            className={`status-summary-card ${currentTab === status.key ? 'active' : ''}`}
            onClick={() => { setCurrentTab(status.key); setCurrentPage(1); }}
          >
            <span className={`status-dot ${status.className}`}>{status.icon}</span>
            <span>{status.label}</span>
            <strong>{statusSummary[status.key]}</strong>
          </button>
        ))}
      </div>

      <div className="insight-grid">
        <div className="insight-panel top-products-panel">
          <div className="insight-heading">
            <span className="insight-heading-icon"><i className="fas fa-ranking-star"></i></span>
            <div>
              <h3>Produk Terlaris</h3>
              <span>Tidak termasuk pesanan batal</span>
            </div>
          </div>
          {topProducts.length > 0 ? (
            <div className="top-product-list">
              {topProducts.map((product, index) => (
                <div key={product.name} className="top-product-item">
                  <span className="product-rank">{index + 1}</span>
                  <div className="product-copy">
                    <span className="product-name">{product.name}</span>
                    <small>Terjual</small>
                  </div>
                  <strong><span>{product.qty}</span> pcs</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>Belum ada data produk.</p>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="table-container">
        <div className="table-toolbar">
          <h2>Daftar Pesanan Terbaru</h2>
          <div className="table-toolbar-actions">
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary-action">
              <i className="fas fa-plus"></i> Tambah Pesanan
            </button>
            <div className="search-box"><i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Cari nama, order ID..."
                value={currentSearch}
                onChange={e => {setCurrentSearch(e.target.value); setCurrentPage(1);}}
              />
            </div>
          </div>
        </div>

        <div className="date-filter-panel">
          <div className="date-filter-fields">
            <div>
              <label>Dari Tanggal</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => { setDateFilter(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
              />
            </div>
            <div>
              <label>Sampai Tanggal</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => { setDateFilter(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
              />
            </div>
          </div>
          <div className="date-filter-actions">
            <button className={activeDatePreset === 'today' ? 'active' : ''} onClick={() => handleDatePreset('today')}>Hari Ini</button>
            <button className={activeDatePreset === 'week' ? 'active' : ''} onClick={() => handleDatePreset('week')}>7 Hari</button>
            <button className={activeDatePreset === 'month' ? 'active' : ''} onClick={() => handleDatePreset('month')}>Bulan Ini</button>
            <button className={activeDatePreset === 'all' ? 'active' : ''} onClick={() => handleDatePreset('all')}>Semua</button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Order ID</th>
                <th>Nama</th>
                <th>Pesanan</th>
                <th>Total</th>
                <th>Status</th>
                <th>Edit</th>
                <th>Struk</th>
                <th>Hubungi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="loading"><i className="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Tidak ada data yang cocok dengan pencarian/filter.</td></tr>
              ) : (
                paginatedOrders.map((row, idx) => {
                 const statusMeta = getStatusMeta(row['STATUS']);
                 const waLink = getWaLink(row);
                 
                 return (
                  <tr key={idx}>
                    <td className="order-time-cell">
                      <div>{formatOrderDate(row['WAKTU'])}</div>
                      {row['WAKTU'] && (
                        <div className="order-time-value">
                          {formatOrderTime(row['WAKTU'])}
                        </div>
                      )}
                    </td>
                    <td><strong>{row['ORDER ID']}</strong></td>
                    <td><strong>{row['NAMA']}</strong></td>
                    <td className="order-text-cell">
                      {String(row['PESANAN'] || '').split('\n').map((line, lineIndex) => (
                        <div key={lineIndex}>{renderOrderLine(line)}</div>
                      ))}
                    </td>
                    <td className="order-total-cell">{formatRupiah(parseCurrencyValue(row['TOTAL HARGA']))}</td>
                    <td>
                      <select value={row['STATUS'] || 'Pending'} onChange={(e) => updateOrderStatus(row['ORDER ID'], e.target.value)} className={`status-select ${statusMeta.className}`}>
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.key} value={status.label}>{status.icon} {status.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleOpenEditModal(row)} className="icon-action-btn edit-action-btn" title="Edit Pesanan">
                        <i className="fas fa-pen"></i>
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handlePreviewReceipt(row)} className="icon-action-btn" title="Download Struk">
                        <i className="fas fa-file-invoice"></i>
                      </button>
                    </td>
                    <td>
                      {waLink ? (
                        <a href={waLink} target="_blank" rel="noreferrer" className="chat-link">
                          <i className="fab fa-whatsapp"></i> Chat
                        </a>
                      ) : <span style={{ color: '#9CA3AF' }}>-</span>}
                    </td>
                  </tr>
                )
               })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="pagination-container">
             <button
               disabled={safeCurrentPage === 1}
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               className="page-btn"
               aria-label="Halaman sebelumnya"
             >
               <i className="fas fa-chevron-left"></i>
             </button>
             <div className="page-indicator">
               <span>Halaman</span>
               <strong>{safeCurrentPage} / {totalPages}</strong>
             </div>
             <button
               disabled={safeCurrentPage === totalPages}
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               className="page-btn"
               aria-label="Halaman selanjutnya"
             >
               <i className="fas fa-chevron-right"></i>
             </button>
        </div>
      </div>

      {/* MODAL TAMBAH PESANAN WA */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box order-modal themed-order-modal">
            <div className="order-modal-hero">
              <div className="order-modal-heading">
                <span className="order-modal-icon"><i className="fas fa-cart-plus"></i></span>
                <div>
                  <span className="order-modal-kicker">Creove Order</span>
                  <h3 className="modal-title">Tambah Pesanan Baru</h3>
                </div>
              </div>
              <img src="/logo.png" alt="" className="order-modal-logo" aria-hidden="true" />
            </div>

            <div className="form-group-manual order-form-body">
                <div className="field-stack">
                  <label>Nama Pemesan</label>
                  <input type="text" name="nama" value={manualForm.nama} onChange={handleFormChange} placeholder="Masukkan Nama Customer" />
                </div>
                
                {/* PERBAIKAN: FORM TANGGAL DAN JAM */}
                <div className="form-row">
                    <div className="field-stack">
                        <label>Tanggal</label>
                        <input type="date" name="tanggal" value={manualForm.tanggal} onChange={handleFormChange} />
                    </div>
                    <div className="field-stack">
                        <label>Jam</label>
                        <input type="time" name="jam" value={manualForm.jam} onChange={handleFormChange} />
                    </div>
                </div>

                <div className="product-section-header">
                    <label>Daftar Produk</label>
                    <button type="button" onClick={addOrderItem} className="btn-add-product">
                      <i className="fas fa-plus"></i>
                      <span>Tambah Produk</span>
                    </button>
                </div>

                <div className="order-item-list">
                  {manualForm.items.map((item, index) => (
                    <div key={index} className="order-item-card">
                      <div className="order-item-media">
                        <img src={RECEIPT_ITEM_IMAGE_MAP[item.produk]} alt={item.produk} />
                        <span>#{index + 1}</span>
                      </div>

                      <div className="order-item-content">
                        <div className="form-row order-item-grid">
                          <div className="field-stack">
                            <label>Produk</label>
                            <select value={item.produk} onChange={e => handleItemChange(index, 'produk', e.target.value)}>
                              {PRODUCT_OPTIONS.map(product => (
                                <option key={product} value={product}>{product}</option>
                              ))}
                            </select>
                          </div>
                          <div className="field-stack qty-field">
                            <label>Qty</label>
                            <input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} min="1" />
                          </div>
                        </div>

                        <div className="form-row order-price-row">
                          <div className="field-stack">
                            <label>Harga Template (Rp)</label>
                            <input type="text" value={formatRupiah(parseCurrencyValue(item.harga))} disabled />
                            {item.produk === 'Signature Layered Oreo' && (
                              <div className="product-price-note">
                                1 pcs = Rp 10.000, 3 pcs = Rp 25.000
                              </div>
                            )}
                          </div>
                          <div className="remove-item-wrap">
                            <button
                              type="button"
                              onClick={() => removeOrderItem(index)}
                              disabled={manualForm.items.length === 1}
                              className="btn-remove-product"
                            >
                              <i className="fas fa-trash"></i>
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-summary-strip">
                    <div className="order-summary-pill">
                      <span>Total Harga</span>
                      <strong>{formatRupiah(manualOrderTotal)}</strong>
                    </div>
                    <div className="order-summary-pill">
                      <span>Total Item</span>
                      <strong>{manualForm.items.length} item</strong>
                    </div>
                </div>

                <div className="form-row">
                    <div className="field-stack"><label>Pengantaran</label>
                      <select name="pengantaran" value={manualForm.pengantaran} onChange={handleFormChange}>
                        <option value="Pick up">Pick up (Ambil Sendiri)</option>
                        <option value="Delivery">COD (Area Sekitar)</option>
                        <option value="Kurir (Free)">Kurir (Free)</option>
                      </select>
                    </div>
                    <div className="field-stack"><label>Pembayaran</label>
                      <select name="pembayaran" value={manualForm.pembayaran} onChange={handleFormChange}>
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Qris">Qris</option>
                      </select>
                    </div>
                </div>
                { (manualForm.pengantaran === 'Delivery' || manualForm.pengantaran === 'Kurir (Free)') && (
                  <div className="form-row">
                    <div className="field-stack full-width-field">
                      <label>Alamat Pengantaran</label>
                      <input type="text" name="alamat" value={manualForm.alamat} onChange={handleFormChange} placeholder="Masukkan alamat lengkap untuk pengantaran" />
                    </div>
                  </div>
                )}
                <div className="field-stack">
                  <label>Nomor WhatsApp</label>
                  <input type="text" name="wa" value={manualForm.wa} onChange={handleFormChange} placeholder="(Opsional)" />
                </div>
            </div>

            <div className="modal-actions modal-actions-spaced">
                <button onClick={() => setIsAddModalOpen(false)} className="btn-cancel">Batal</button>
                <button onClick={handleSaveOrder} disabled={savingOrder} className="btn-primary-action">
                  {savingOrder ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PESANAN */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box order-modal edit-order-modal">
            <h3 className="modal-title"><i className="fas fa-pen"></i> Edit Pesanan</h3>
            <div className="form-group-manual">
              <label>Order ID</label>
              <input type="text" value={editForm.orderId} disabled />

              <label>Nama Pemesan</label>
              <input type="text" name="nama" value={editForm.nama} onChange={handleEditFormChange} />

              <div className="form-row">
                <div>
                  <label>Tanggal</label>
                  <input type="date" name="tanggal" value={editForm.tanggal} onChange={handleEditFormChange} />
                </div>
                <div>
                  <label>Jam</label>
                  <input type="time" name="jam" value={editForm.jam} onChange={handleEditFormChange} />
                </div>
              </div>

              <label>Isi Pesanan</label>
              <textarea name="pesanan" value={editForm.pesanan} onChange={handleEditFormChange} rows="8" />

              <div className="form-row">
                <div>
                  <label>Total Harga (Rp)</label>
                  <input type="number" name="total" value={editForm.total} onChange={handleEditFormChange} />
                </div>
                <div>
                  <label>Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditFormChange}>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.key} value={status.label}>{status.icon} {status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Nomor WhatsApp</label>
              <input type="text" name="wa" value={editForm.wa} onChange={handleEditFormChange} />
            </div>

            <div className="modal-actions modal-actions-spaced">
              <button onClick={() => setIsEditModalOpen(false)} className="btn-cancel">Batal</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary-action">
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE STRUK UNTUK RENDER (Hidden) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {activeReceiptOrder && (() => {
          const receiptItems = getReceiptItems(activeReceiptOrder);
          const receiptTotal = formatReceiptCurrency(activeReceiptOrder['TOTAL HARGA']);
          const pengantaran = getReceiptField(activeReceiptOrder, 'Pengantaran', 'Pick up');
          const pembayaran = getReceiptField(activeReceiptOrder, 'Pembayaran', 'Cash');
          const alamat = getReceiptAddress(activeReceiptOrder);

          return (
            <div ref={receiptRef} className="receipt-modern-container">
              <div className="receipt-bg-shape receipt-bg-shape-left"></div>
              <div className="receipt-bg-shape receipt-bg-shape-right"></div>
              <div className="receipt-dot-grid receipt-dot-grid-left"></div>
              <div className="receipt-dot-grid receipt-dot-grid-right"></div>

              <div className="receipt-header">
                <div className="receipt-logo-orbit">
                  <span className="receipt-logo-main" role="img" aria-label="Logo Creove"></span>
                </div>
                <div className="receipt-spark receipt-spark-left" aria-hidden="true"></div>
                <div className="receipt-spark receipt-spark-right" aria-hidden="true"></div>
                <h2 className="receipt-brand">CREOVE</h2>
                <p className="receipt-subtitle"><span></span>Bukti Pesanan Resmi<span></span></p>
              </div>

              <div className="receipt-info-card">
                <div className="receipt-info-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-ticket"></i></span>
                  <span className="receipt-info-label">Order ID</span>
                  <strong>{activeReceiptOrder['ORDER ID']}</strong>
                </div>
                <div className="receipt-info-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-calendar-days"></i></span>
                  <span className="receipt-info-label">Tanggal</span>
                  <strong>{formatOrderDate(activeReceiptOrder['WAKTU'])}</strong>
                </div>
                <div className="receipt-info-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-user"></i></span>
                  <span className="receipt-info-label">Nama</span>
                  <strong>{activeReceiptOrder['NAMA'] || '-'}</strong>
                </div>
                <div className="receipt-info-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-clock"></i></span>
                  <span className="receipt-info-label">Jam</span>
                  <strong>{formatOrderTime(activeReceiptOrder['WAKTU']) || '-'}</strong>
                </div>
              </div>

              <section className="receipt-order-card">
                <div className="receipt-section-ribbon">Detail Pesanan</div>
                {receiptItems.map((item, index) => (
                  <div className="receipt-product-row" key={`${item.name}-${index}`}>
                    <ReceiptItemVisual itemName={item.name} />
                    <div className="receipt-product-copy">
                      <h3>{item.name}</h3>
                      <span>x{item.qty}</span>
                    </div>
                    <strong>{formatReceiptCurrency(item.price)}</strong>
                  </div>
                ))}
                <div className="receipt-line-divider"></div>
                <div className="receipt-total-row">
                  <span>Total Akhir</span>
                  <strong>{receiptTotal}</strong>
                </div>
              </section>

              <div className="receipt-method-card">
                <div className="receipt-method-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-motorcycle"></i></span>
                  <span>Pengantaran</span>
                  <strong>{pengantaran}</strong>
                  {alamat && <small className="receipt-method-note">Alamat: {alamat}</small>}
                </div>
                <div className="receipt-method-item">
                  <span className="receipt-icon-bubble"><i className="fas fa-wallet"></i></span>
                  <span>Pembayaran</span>
                  <strong>{pembayaran}</strong>
                </div>
              </div>

              <div className="receipt-grand-total">
                <div className="receipt-grand-icon">
                  <i className="fas fa-receipt"></i>
                  <span><i className="fas fa-check"></i></span>
                </div>
                <div className="receipt-grand-copy">
                  <span>Total Akhir</span>
                  <strong>{receiptTotal}</strong>
                </div>
              </div>

              <div className="receipt-footer">
                <div className="receipt-footer-heart">
                  <span></span>
                  <i className="fas fa-heart"></i>
                  <span></span>
                </div>
                <p className="receipt-footer-text">Terima Kasih Telah Memesan!</p>
                <small>Sampai jumpa di pesanan berikutnya</small>
              </div>
            </div>
          );
        })()}
      </div>

      {/* MODAL PREVIEW STRUK GAMBAR */}
      {isReceiptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box receipt-preview-modal">
             <h3 className="modal-title"><i className="fas fa-receipt"></i> Preview Struk</h3>
             <div className="receipt-preview-frame">
                <img src={receiptData.url} alt="Struk" />
             </div>
             <div className="modal-actions receipt-preview-actions">
                <button onClick={() => setIsReceiptModalOpen(false)} className="btn-cancel">
                  Tutup
                </button>
                
                {/* Perbaikan pada <a> tag dengan menambahkan padding, border-radius, dan flexbox */}
                <a 
                  href={receiptData.url} 
                  download={receiptData.filename} 
                  className="btn-primary-action"
                >
                  <i className="fas fa-download"></i> Download Gambar
                </a>
             </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
