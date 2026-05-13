import { formatRupiah } from '../../utils/formatters';

export default function OrderTable({
  loading,
  paginatedOrders,
  statusOptions,
  getStatusMeta,
  getWaLink,
  formatOrderDate,
  formatOrderTime,
  renderOrderLine,
  parseCurrencyValue,
  updateOrderStatus,
  handleOpenEditModal,
  handlePreviewReceipt,
  safeCurrentPage,
  totalPages,
  setCurrentPage,
  currentSearch,
  setCurrentSearch,
  setIsAddModalOpen,
  dateFilterContent
}) {
  return (
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
              onChange={e => { setCurrentSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {dateFilterContent}

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
                        {statusOptions.map(status => (
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
  );
}
