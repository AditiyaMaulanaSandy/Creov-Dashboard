// ============================================================================
// 1. KONFIGURASI GLOBAL & STATE MANAGEMENT
// ============================================================================

const KODE_RAHASIA = "123"; // Ganti PIN ini sesuai keinginanmu!
const scriptURL = 'https://script.google.com/macros/s/AKfycbyIDypyp9ELqITbfRlRlDC2CkrMsQw1x-kTTyIYrolfXfBFSVZ_V_vkHIOBqNJHR6M/exec';

let allOrders      = [];  // Menyimpan seluruh data mentah dari server
let currentSearch  = '';  // Menyimpan kata kunci pencarian
let currentTab     = 'all'; // Menyimpan tab yang sedang aktif
let currentPage    = 1;   // Menyimpan halaman saat ini
let lastOrderCount = -1;  // Memori untuk trigger notifikasi suara

const rowsPerPage  = 10;  // Batas data per halaman


// ============================================================================
// 2. UTILITY FUNCTIONS
// ============================================================================

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle" style="color:#10B981; font-size:20px;"></i>';
    } else if (type === 'info') {
        icon = '<i class="fas fa-info-circle" style="color:#3B82F6; font-size:20px;"></i>';
    } else {
        icon = '<i class="fas fa-exclamation-circle" style="color:#EF4444; font-size:20px;"></i>';
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ============================================================================
// 3. UPDATE STATUS
// ============================================================================

async function updateStatus(orderId, newStatus, selectElement) {
    selectElement.disabled = true;

    const originalText = selectElement.options[selectElement.selectedIndex].text;
    selectElement.options[selectElement.selectedIndex].text = 'Updating...';

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({
                action:  'updateStatus',
                orderId: orderId,
                status:  newStatus
            })
        });

        const result = await response.json();

        if (result.result === 'success') {
            const stLower = newStatus.toLowerCase();

            selectElement.className = 'status-select';

            if (stLower.includes('pending') || newStatus === '') {
                selectElement.classList.add('status-pending');
            } else if (stLower.includes('diproses')) {
                selectElement.classList.add('status-diproses');
            } else if (stLower.includes('selesai') || stLower.includes('lunas') || stLower.includes('dikirim')) {
                selectElement.classList.add('status-selesai');
            } else if (stLower.includes('batal')) {
                selectElement.classList.add('status-batal');
            } else {
                selectElement.classList.add('status-custom');
            }

            selectElement.options[selectElement.selectedIndex].text = newStatus;

            const orderIndex = allOrders.findIndex(
                row => (row['ORDER ID'] || row['Order ID'] || row['orderId']) === orderId
            );
            if (orderIndex !== -1) allOrders[orderIndex]['STATUS'] = newStatus;

            showToast(`Status ${orderId} berhasil diubah!`, 'success');
        } else {
            showToast('Gagal update status! Cek koneksi.', 'error');
            selectElement.options[selectElement.selectedIndex].text = originalText;
        }
    } catch (error) {
        showToast('Terjadi kesalahan koneksi!', 'error');
        selectElement.options[selectElement.selectedIndex].text = originalText;
    } finally {
        selectElement.disabled = false;
    }
}

function showCustomPrompt() {
    return new Promise((resolve) => {
        const modal    = document.getElementById('customPromptModal');
        const input    = document.getElementById('customStatusInput');
        const btnSave  = document.getElementById('btnSaveCustom');
        const btnCancel = document.getElementById('btnCancelCustom');

        input.value = '';
        modal.classList.remove('hidden');
        input.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            btnSave.removeEventListener('click', onSave);
            btnCancel.removeEventListener('click', onCancel);
            input.removeEventListener('keypress', onEnter);
        };

        const onSave   = () => { cleanup(); resolve(input.value.trim()); };
        const onCancel = () => { cleanup(); resolve(null); };
        const onEnter  = (e) => { if (e.key === 'Enter') onSave(); };

        btnSave.addEventListener('click', onSave);
        btnCancel.addEventListener('click', onCancel);
        input.addEventListener('keypress', onEnter);
    });
}

async function handleStatusChange(orderId, selectElement, oldStatus) {
    let newStatus = selectElement.value;

    if (newStatus === 'custom') {
        const customText = await showCustomPrompt();

        if (customText && customText !== '') {
            newStatus = customText;
            selectElement.add(new Option(newStatus, newStatus, true, true), 0);
        } else {
            selectElement.value = oldStatus;
            return;
        }
    }

    await updateStatus(orderId, newStatus, selectElement);
}


// ============================================================================
// 4. RENDERING UI — TABEL & PAGINATION
// ============================================================================

function renderTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    // --- Filtering ---
    const filteredData = allOrders.filter(row => {
        const orderId = String(row['ORDER ID'] || row['Order ID'] || row['orderId'] || '-').toLowerCase();
        const nama    = String(row['NAMA']     || row['Nama']     || row['nama']    || '-').toLowerCase();
        const status  = String(row['STATUS']   || row['Status']   || row['status']  || 'Pending').toLowerCase();

        const matchTab    = currentTab === 'all' || status.includes(currentTab);
        const matchSearch = currentSearch === '' || orderId.includes(currentSearch) || nama.includes(currentSearch);

        return matchTab && matchSearch;
    });

    // --- Pagination calc ---
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex    = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
    const endCount      = Math.min(startIndex + rowsPerPage, totalItems);

    document.getElementById('pageInfo').innerText = totalItems === 0
        ? 'Menampilkan 0 data'
        : `Menampilkan ${startIndex + 1}-${endCount} dari ${totalItems} data`;

    // --- Empty state ---
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading" style="text-align:center; padding:30px;">
                    Tidak ada data yang cocok.
                </td>
            </tr>`;
        renderPaginationControls(totalPages);
        return;
    }

    // --- Render rows ---
    paginatedData.forEach(row => {
        const orderId  = row['ORDER ID']    || row['Order ID'] || row['orderId'] || '-';
        const nama     = row['NAMA']        || row['Nama']     || row['nama']    || '-';
        const pesanan  = row['PESANAN']     || row['Pesanan']  || row['pesanan'] || '-';
        const total    = parseInt(row['TOTAL HARGA'] || row['Total Harga'] || row['Total'] || row['total'] || 0);
        const waktuRaw = row['WAKTU']       || row['Waktu']    || '-';

        let status = row['STATUS'] || row['Status'] || row['status'] || 'Pending';
        status = status.charAt(0).toUpperCase() + status.slice(1);

        // Format waktu
        let waktuFix = waktuRaw;
        if (waktuRaw !== '-' && waktuRaw !== '') {
            const d = new Date(waktuRaw);
            if (!isNaN(d)) {
                waktuFix = d.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });
            }
        }

        // WhatsApp & Receipt buttons
        const safePesanan = pesanan.replace(/'/g, "\\'").replace(/\n/g, '<br>');
        let waButton = '-';
        
        let receiptBtn = `<button onclick="downloadReceipt('${orderId}', '${nama}', '${safePesanan}', '${total}', '${waktuFix}')" class="btn-receipt" style="background-color: #8B5CF6; color: white; padding: 6px 12px; border-radius: 6px; border: none; font-size: 12px; font-weight: bold; cursor: pointer; margin-left: 5px; transition: 0.2s;"><i class="fas fa-file-download"></i> Struk</button>`;

        const linkWARaw = row['LINK NO WA'] || row['Link No WA'] || row['NO HP'] || '';
        if (linkWARaw !== '') {
            let cleanPhone = String(linkWARaw).replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
            let chatBtn = `
                <a href="https://wa.me/${cleanPhone}" target="_blank"
                   style="background-color:#25D366; color:white; padding:6px 12px; border-radius:6px;
                          text-decoration:none; font-size:12px; font-weight:bold; display:inline-block;">
                    <i class="fab fa-whatsapp"></i> Chat
                </a>`;
            waButton = chatBtn + receiptBtn;
        } else {
            waButton = receiptBtn; // Tetap tampilkan tombol struk walaupun nomor WA tidak ada
        }

        // Status class
        const stLower = status.toLowerCase();
        let statusClass = 'status-custom';
        if (stLower.includes('pending') || status === '')             statusClass = 'status-pending';
        else if (stLower.includes('diproses'))                        statusClass = 'status-diproses';
        else if (stLower.includes('selesai') || stLower.includes('lunas')) statusClass = 'status-selesai';
        else if (stLower.includes('batal'))                           statusClass = 'status-batal';

        const defaultStatuses = ['Pending', 'Diproses', 'Selesai', 'Batal'];
        const customOptionHTML = !defaultStatuses.includes(status) && status !== ''
            ? `<option value="${status}" selected>${status}</option>`
            : '';

        const statusDropdown = `
            <select class="status-select ${statusClass}"
                    onchange="handleStatusChange('${orderId}', this, '${status}')">
                ${customOptionHTML}
                <option value="Pending"  ${status === 'Pending'  ? 'selected' : ''}>Pending</option>
                <option value="Diproses" ${status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                <option value="Selesai"  ${status === 'Selesai'  ? 'selected' : ''}>Selesai</option>
                <option value="Batal"    ${status === 'Batal'    ? 'selected' : ''}>Batal</option>
                <option value="custom">— Ketik Sendiri... —</option>
            </select>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size:12px; color:#637381;">${waktuFix}</td>
            <td><strong>${orderId}</strong></td>
            <td>${nama}</td>
            <td style="font-size:13px;">${pesanan.replace(/\n/g, '<br>')}</td>
            <td style="font-weight:bold;">${formatRupiah(total)}</td>
            <td>${statusDropdown}</td>
            <td>${waButton}</td>`;

        tableBody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const controls = document.getElementById('pageControls');
    controls.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev button
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    btnPrev.disabled  = currentPage === 1;
    btnPrev.onclick   = () => { currentPage--; renderTable(); };
    controls.appendChild(btnPrev);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const btnPage     = document.createElement('button');
        btnPage.className = `page-btn ${currentPage === i ? 'active' : ''}`;
        btnPage.innerText = i;
        btnPage.onclick   = () => { currentPage = i; renderTable(); };
        controls.appendChild(btnPage);
    }

    // Next button
    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
    btnNext.disabled  = currentPage === totalPages;
    btnNext.onclick   = () => { currentPage++; renderTable(); };
    controls.appendChild(btnNext);
}


// ============================================================================
// 5. FETCH DATA
// ============================================================================

async function fetchData() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading" style="text-align:center; padding:30px;">
                <i class="fas fa-spinner fa-spin"></i> Menyegarkan data dari server...
            </td>
        </tr>`;

    showToast('Menyegarkan data...', 'info');

    try {
        const response = await fetch(scriptURL);
        const data     = await response.json();

        allOrders = data
            .reverse()
            .filter(r => r['ORDER ID'] || r['Order ID'] || r['orderId']);

        let totalPendapatan = 0;
        let activeOrders    = 0;

        allOrders.forEach(row => {
            const status = (row['STATUS'] || row['Status'] || row['status'] || '').toLowerCase();
            if (!status.includes('batal')) {
                totalPendapatan += parseInt(row['TOTAL HARGA'] || row['Total Harga'] || row['Total'] || 0);
                activeOrders++;
            }
        });

        // Notifikasi suara jika ada pesanan baru
        if (lastOrderCount !== -1 && allOrders.length > lastOrderCount) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                .play()
                .catch(() => console.log('Klik layar untuk izinkan audio.'));
        }
        lastOrderCount = allOrders.length;

        document.getElementById('totalOrders').innerText  = activeOrders;
        document.getElementById('totalRevenue').innerText = formatRupiah(totalPendapatan);

        renderTable();
        showToast('Data berhasil diperbarui!', 'success');

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="color:red; text-align:center; padding:20px;">
                    Gagal menarik data server.
                </td>
            </tr>`;
        showToast('Gagal menarik data!', 'error');
    }
}


// ============================================================================
// 6. EVENT LISTENERS & INISIALISASI
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Login System ---
    const loginOverlay = document.getElementById('loginOverlay');
    const pinInput     = document.getElementById('pinInput');
    const btnLogin     = document.getElementById('btnLogin');
    const loginError   = document.getElementById('loginError');

    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        loginOverlay.style.display = 'none';
    }

    function prosesLogin() {
        if (pinInput.value === KODE_RAHASIA) {
            sessionStorage.setItem('isLoggedIn', 'true');
            loginOverlay.style.opacity = '0';
            setTimeout(() => { loginOverlay.style.display = 'none'; }, 500);
        } else {
            loginError.style.display = 'block';
            pinInput.value = '';
            pinInput.focus();
        }
    }

    btnLogin.addEventListener('click', prosesLogin);
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') prosesLogin();
    });

    // --- Event Listener untuk Modal Preview Struk ---
    document.getElementById('btnCloseReceipt').addEventListener('click', () => {
        document.getElementById('receiptPreviewModal').classList.add('hidden');
    });

    document.getElementById('btnDownloadReceiptReal').addEventListener('click', () => {
        if (currentReceiptDataUrl !== '') {
            const link = document.createElement('a');
            link.download = currentReceiptFilename;
            link.href = currentReceiptDataUrl;
            link.click(); 
            
            showToast('Struk berhasil disimpan!', 'success');
            document.getElementById('receiptPreviewModal').classList.add('hidden');
        }
    });

    // --- Load data pertama kali ---
    fetchData();
});

// --- Pencarian ---
document.getElementById('searchInput').addEventListener('input', function () {
    currentSearch = this.value.toLowerCase();
    currentPage   = 1;
    renderTable();
});

// --- Filter Tabs ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab  = this.getAttribute('data-status').toLowerCase();
        currentPage = 1;
        renderTable();
    });
});

// --- Refresh Manual ---
document.getElementById('refreshBtn').addEventListener('click', fetchData);

// --- Dark Mode ---
const themeToggle = document.getElementById('themeToggle');
const bodyElement = document.body;
const themeIcon   = themeToggle.querySelector('i');

if (localStorage.getItem('theme') === 'dark') {
    bodyElement.classList.add('dark-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    bodyElement.classList.toggle('dark-mode');

    if (bodyElement.classList.contains('dark-mode')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
});


// ============================================================================
// 7. FUNGSI PREVIEW & DOWNLOAD STRUK (HTML2CANVAS)
// ============================================================================

let currentReceiptDataUrl = '';
let currentReceiptFilename = '';

function downloadReceipt(orderId, nama, pesanan, total, waktu) {
    // 1. Masukkan data ke template struk
    document.getElementById('r-orderId').innerText = orderId;
    document.getElementById('r-nama').innerText = nama;
    document.getElementById('r-waktu').innerText = waktu;
    document.getElementById('r-pesanan').innerHTML = pesanan;
    document.getElementById('r-total').innerText = "TOTAL: " + formatRupiah(total);

    // 2. Beri notifikasi loading
    showToast('Membuat preview struk...', 'info');

    // 3. Proses foto menggunakan html2canvas
    const element = document.getElementById('receiptTemplate');
    html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#ffffff" 
    }).then(canvas => {
        // Simpan hasil foto dan nama filenya di variabel global
        currentReceiptDataUrl = canvas.toDataURL("image/png");
        currentReceiptFilename = `Receipt_${orderId}_Creove.png`;
        
        // Pasang foto ke dalam modal preview
        document.getElementById('receiptPreviewImg').src = currentReceiptDataUrl;
        
        // Tampilkan modal
        document.getElementById('receiptPreviewModal').classList.remove('hidden');
        showToast('Preview siap!', 'success');
        
    }).catch(err => {
        showToast('Gagal membuat preview', 'error');
        console.error(err);
    });
}