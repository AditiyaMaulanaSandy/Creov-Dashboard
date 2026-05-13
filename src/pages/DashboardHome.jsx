import { formatRupiah } from '../utils/formatters';
import NewOrderNotice from '../components/ui/NewOrderNotice';

export default function DashboardHome({
  newOrderNotice,
  onDismissNewOrderNotice,
  totalOrders,
  totalRevenue,
  currentTab,
  onOpenOrdersTab,
  orders,
  statusOptions,
  statusSummary,
  topProducts
}) {
  return (
    <div className="dashboard-overview-content">
      <NewOrderNotice notice={newOrderNotice} onDismiss={onDismissNewOrderNotice} />

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
          onClick={() => onOpenOrdersTab('all')}
        >
          <span className="status-dot status-all"><i className="fas fa-layer-group"></i></span>
          <span>Semua</span>
          <strong>{orders.length}</strong>
        </button>
        {statusOptions.map(status => (
          <button
            key={status.key}
            className={`status-summary-card ${currentTab === status.key ? 'active' : ''}`}
            onClick={() => onOpenOrdersTab(status.key)}
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
    </div>
  );
}
