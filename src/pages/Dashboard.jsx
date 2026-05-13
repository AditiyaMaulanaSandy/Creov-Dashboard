import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { formatRupiah } from '../utils/formatters';
import {
  createManualOrderForm,
  createManualOrderItem,
  formatReceiptCurrency,
  getDateInputValue,
  getDateRange,
  getDefaultOrderDateTime,
  getProductName,
  getProductQty,
  getReceiptAddress,
  getReceiptField,
  getReceiptItems,
  getStatusMeta,
  getTemplateItemTotal,
  getTimeInputValue,
  getWaLink,
  normalizeStatus,
  parseCurrencyValue,
  renderOrderLine
} from '../utils/orders';
import { isSuccessResult, readApiResult } from '../utils/apiResult';
import {
  APP_TIME_ZONE,
  APP_TIME_ZONE_OFFSET,
  MENU_ITEMS,
  PRODUCT_OPTIONS,
  RECEIPT_ITEM_IMAGE_MAP,
  ROWS_PER_PAGE,
  STATUS_OPTIONS
} from '../constants/dashboard';
import { fetchOrders, updateOrderStatusAPI, addOrderAPI, editOrderAPI } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import WorkspaceTopbar from '../components/layout/WorkspaceTopbar';
import ToastStack from '../components/ui/ToastStack';
import DashboardHome from './DashboardHome';
import Pesanan from './Pesanan';
import Pengeluaran from './Pengeluaran';
import Laporan from './Laporan';

export default function Dashboard({ theme, toggleTheme }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const isLoadingOrdersRef = useRef(false);
  
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

  const loadData = useCallback(async ({ silent = false, notifySuccess = false, notifyStart = false } = {}) => {
    if (isLoadingOrdersRef.current) {
      if (!silent) {
        showToast({
          type: 'info',
          title: 'Data sedang di-refresh',
          message: 'Tunggu sebentar, data terbaru masih diambil.'
        });
      }
      return;
    }

    isLoadingOrdersRef.current = true;
    if (!silent) setLoading(true);
    if (notifyStart) {
      showToast({
        type: 'info',
        title: 'Refresh data dimulai',
        message: 'Mengambil pesanan terbaru dari server.'
      });
    }

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
      isLoadingOrdersRef.current = false;
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

  useEffect(() => {
    const desktopMedia = window.matchMedia('(min-width: 981px)');
    const closeDrawerOnDesktop = () => {
      if (desktopMedia.matches) setIsSidebarOpen(false);
    };

    closeDrawerOnDesktop();
    desktopMedia.addEventListener('change', closeDrawerOnDesktop);

    return () => desktopMedia.removeEventListener('change', closeDrawerOnDesktop);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const closeDrawerWithEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    window.addEventListener('keydown', closeDrawerWithEscape);

    return () => window.removeEventListener('keydown', closeDrawerWithEscape);
  }, [isSidebarOpen]);

  // Lock background scroll when any modal is open (add / edit / receipt)
  useEffect(() => {
    const modalOpen = isAddModalOpen || isEditModalOpen || isReceiptModalOpen || isSidebarOpen;
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
  }, [isAddModalOpen, isEditModalOpen, isReceiptModalOpen, isSidebarOpen]);

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update (Langsung ganti di layar agar terasa responsif)
    setOrders(prev => prev.map(o => (o['ORDER ID'] === orderId) ? { ...o, STATUS: newStatus } : o));
    showToast({
      type: 'info',
      title: 'Menyimpan status',
      message: `${orderId} sedang diubah ke ${newStatus}.`
    });
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
              let newValue = value;
              // Allow empty value temporarily for user to clear and retype
              if (field === 'qty') {
                newValue = value === '' ? '' : Math.max(1, Number(value) || 1);
              }
              const nextItem = { ...item, [field]: newValue };
              nextItem.harga = getTemplateItemTotal(nextItem.produk, nextItem.qty || 1);
              return nextItem;
            })()
          : item
      ))
    }));
  };

  const handleItemBlur = (index, field) => {
    // Validate qty on blur to ensure minimum value
    if (field === 'qty') {
      setManualForm(prev => ({
        ...prev,
        items: prev.items.map((item, itemIndex) => (
          itemIndex === index
            ? (() => {
                const finalQty = Math.max(1, Number(item.qty) || 1);
                const nextItem = { ...item, qty: finalQty };
                nextItem.harga = getTemplateItemTotal(nextItem.produk, nextItem.qty);
                return nextItem;
              })()
            : item
        ))
      }));
    }
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
    showToast({
      type: 'info',
      title: 'Menyimpan pesanan',
      message: 'Pesanan baru sedang dikirim ke server.'
    });
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
    showToast({
      type: 'info',
      title: 'Membuat struk',
      message: `${order['ORDER ID']} sedang disiapkan.`
    });
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
    showToast({
      type: 'info',
      title: 'Menyimpan perubahan',
      message: `${editForm.orderId} sedang diperbarui.`
    });
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
    ? 'Selamat pagi'
    : dashboardHour < 17
      ? 'Selamat siang'
      : 'Selamat malam';
  const activeMenuMeta = MENU_ITEMS.find(item => item.key === activeMenu) || MENU_ITEMS[0];
  const handleSidebarToggle = () => {
    const isCompactViewport = window.matchMedia('(max-width: 980px)').matches;

    if (isCompactViewport) {
      setIsSidebarOpen(prev => !prev);
      return;
    }

    setIsSidebarCollapsed(prev => !prev);
  };
  const handleMenuSelect = (menuKey) => {
    setActiveMenu(menuKey);
    setIsSidebarOpen(false);
  };

  return (
    <>
    <ToastStack toasts={toasts} />
    <div className={`dashboard-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Tutup menu"
        ></button>
      )}
      <Sidebar
        menuItems={MENU_ITEMS}
        activeMenu={activeMenu}
        onClose={() => setIsSidebarOpen(false)}
        onSelectMenu={handleMenuSelect}
        totalOrders={totalOrders}
        totalRevenue={totalRevenue}
      />

      <main className="dashboard-main">
        <WorkspaceTopbar
          activeMenuMeta={activeMenuMeta}
          dateLabel={dashboardDateLabel}
          timeLabel={dashboardTimeLabel}
          theme={theme}
          loading={loading}
          onToggleSidebar={handleSidebarToggle}
          onToggleTheme={toggleTheme}
          onRefresh={() => loadData({ notifyStart: true, notifySuccess: true })}
        />

        {activeMenu === 'dashboard' && (
          <DashboardHome
            newOrderNotice={newOrderNotice}
            onDismissNewOrderNotice={() => setNewOrderNotice(null)}
            totalOrders={totalOrders}
            totalRevenue={totalRevenue}
            currentTab={currentTab}
            onOpenOrdersTab={(tabKey) => {
              setActiveMenu('pesanan');
              setCurrentTab(tabKey);
              setCurrentPage(1);
            }}
            orders={orders}
            statusOptions={STATUS_OPTIONS}
            statusSummary={statusSummary}
            topProducts={topProducts}
          />
        )}

        {activeMenu === 'pesanan' && (
          <Pesanan
            newOrderNotice={newOrderNotice}
            onDismissNewOrderNotice={() => setNewOrderNotice(null)}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            setCurrentPage={setCurrentPage}
            orders={orders}
            statusOptions={STATUS_OPTIONS}
            statusSummary={statusSummary}
            setIsAddModalOpen={setIsAddModalOpen}
            currentSearch={currentSearch}
            setCurrentSearch={setCurrentSearch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            activeDatePreset={activeDatePreset}
            handleDatePreset={handleDatePreset}
            loading={loading}
            paginatedOrders={paginatedOrders}
            getStatusMeta={getStatusMeta}
            getWaLink={getWaLink}
            formatOrderDate={formatOrderDate}
            formatOrderTime={formatOrderTime}
            renderOrderLine={renderOrderLine}
            parseCurrencyValue={parseCurrencyValue}
            updateOrderStatus={updateOrderStatus}
            handleOpenEditModal={handleOpenEditModal}
            handlePreviewReceipt={handlePreviewReceipt}
            safeCurrentPage={safeCurrentPage}
            totalPages={totalPages}
            isAddModalOpen={isAddModalOpen}
            manualForm={manualForm}
            handleFormChange={handleFormChange}
            addOrderItem={addOrderItem}
            receiptItemImageMap={RECEIPT_ITEM_IMAGE_MAP}
            productOptions={PRODUCT_OPTIONS}
            handleItemChange={handleItemChange}
            handleItemBlur={handleItemBlur}
            removeOrderItem={removeOrderItem}
            manualOrderTotal={manualOrderTotal}
            handleSaveOrder={handleSaveOrder}
            savingOrder={savingOrder}
            isEditModalOpen={isEditModalOpen}
            editForm={editForm}
            handleEditFormChange={handleEditFormChange}
            setIsEditModalOpen={setIsEditModalOpen}
            handleSaveEdit={handleSaveEdit}
            savingEdit={savingEdit}
            activeReceiptOrder={activeReceiptOrder}
            receiptRef={receiptRef}
            getReceiptItems={getReceiptItems}
            formatReceiptCurrency={formatReceiptCurrency}
            getReceiptField={getReceiptField}
            getReceiptAddress={getReceiptAddress}
            isReceiptModalOpen={isReceiptModalOpen}
            receiptData={receiptData}
            setIsReceiptModalOpen={setIsReceiptModalOpen}
          />
        )}

        {activeMenu === 'pengeluaran' && (
          <Pengeluaran greeting={dashboardGreeting} />
        )}

        {activeMenu === 'laporan' && (
          <Laporan greeting={dashboardGreeting} />
        )}
      </main>
    </div>
    </>
  );
}
