import { formatRupiah } from '../utils/formatters';
import NewOrderNotice from '../components/ui/NewOrderNotice';
import PieChart from '../components/ui/PieChart';

const PIE_COLORS = ['#2F35FF', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6'];

export default function DashboardHome({
  newOrderNotice,
  onDismissNewOrderNotice,
  totalOrders,
  totalRevenue,
  totalExpense,
  estimatedProfit,
  profitRate,
  latestExpenseName,
  expenseCategories,
  currentTab,
  onOpenOrdersTab,
  onOpenExpensesTab,
  orders,
  statusOptions,
  statusSummary,
  topProducts,
  productSales,
  topExpenseCategories
}) {
  const maxFinanceValue = Math.max(totalRevenue, totalExpense, Math.abs(estimatedProfit), 1);
  const profitTone = estimatedProfit >= 0 ? 'positive' : 'negative';
  const totalTrackedOrders = orders.length;
  const finishedOrders = statusSummary.selesai || 0;
  const pendingOrders = statusSummary.pending || 0;
  const processedOrders = statusSummary.diproses || 0;
  const topProduct = topProducts[0];
  const topExpenseCategory = topExpenseCategories[0];
  const coloredExpenseCategories = expenseCategories.map((item, index) => ({
    ...item,
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));
  const coloredProductSales = productSales.map((item, index) => ({
    ...item,
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));
  const totalProductQty = coloredProductSales.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="dashboard-overview-content">
      <NewOrderNotice notice={newOrderNotice} onDismiss={onDismissNewOrderNotice} />

      <section className="dashboard-hero-panel">
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-eyebrow">Overview Bisnis</span>
          <h2>Ringkasan performa Creove</h2>
          <div className="dashboard-hero-meta">
            <span><i className="fas fa-bag-shopping"></i>{totalTrackedOrders} total order</span>
            <span><i className="fas fa-receipt"></i>{expenseCategories.length} kategori biaya</span>
            <span><i className="fas fa-chart-line"></i>Margin {profitRate}%</span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <button type="button" className="dashboard-hero-btn primary" onClick={() => onOpenOrdersTab('all')}>
            <i className="fas fa-bag-shopping"></i>
            <span>Lihat Pesanan</span>
          </button>
          <button type="button" className="dashboard-hero-btn" onClick={onOpenExpensesTab}>
            <i className="fas fa-receipt"></i>
            <span>Pengeluaran</span>
          </button>
        </div>
        <div className="dashboard-hero-profit">
          <span>Estimasi Profit</span>
          <strong>{formatRupiah(estimatedProfit)}</strong>
          <div className="dashboard-hero-profit-row">
            <small>Pendapatan {formatRupiah(totalRevenue)}</small>
            <small>Modal {formatRupiah(totalExpense)}</small>
          </div>
        </div>
      </section>

      <div className="summary-grid dashboard-summary-grid dashboard-kpi-grid">
        <div className="summary-card-modern dashboard-kpi-card kpi-orders">
          <div className="icon-box-modern"><i className="fas fa-shopping-bag"></i></div>
          <div className="info-modern">
            <span className="title-modern">Pesanan Aktif</span>
            <h3>{totalOrders}</h3>
            <small>{pendingOrders + processedOrders} perlu dipantau</small>
          </div>
        </div>
        <div className="summary-card-modern dashboard-kpi-card kpi-revenue">
          <div className="icon-box-modern"><i className="fas fa-wallet"></i></div>
          <div className="info-modern">
            <span className="title-modern">Pendapatan</span>
            <h3>{formatRupiah(totalRevenue)}</h3>
            <small>{finishedOrders} pesanan selesai</small>
          </div>
        </div>
        <div className="summary-card-modern dashboard-kpi-card kpi-expense">
          <div className="icon-box-modern icon-box-expense"><i className="fas fa-receipt"></i></div>
          <div className="info-modern">
            <span className="title-modern">Pengeluaran</span>
            <h3>{formatRupiah(totalExpense)}</h3>
            <small>{topExpenseCategory ? topExpenseCategory.category : 'Belum ada kategori'}</small>
          </div>
        </div>
        <div className={`summary-card-modern dashboard-kpi-card kpi-profit ${profitTone}`}>
          <div className={`icon-box-modern icon-box-profit ${profitTone}`}><i className="fas fa-chart-line"></i></div>
          <div className="info-modern">
            <span className="title-modern">Profit</span>
            <h3>{formatRupiah(estimatedProfit)}</h3>
            <small>Margin {profitRate}%</small>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-finance-chart">
          <div className="dashboard-finance-chart-header">
            <div>
              <h3>Grafik Keuangan</h3>
              <span>Pendapatan, pengeluaran, dan estimasi profit</span>
            </div>
            <div className={`profit-badge ${profitTone}`}>
              <span>Margin</span>
              <strong>{profitRate}%</strong>
            </div>
          </div>

          <div className="dashboard-finance-chart-body">
            <div className="dashboard-finance-bars">
              {[
                { label: 'Pendapatan', value: totalRevenue, className: 'revenue' },
                { label: 'Pengeluaran', value: totalExpense, className: 'expense' },
                { label: 'Profit', value: Math.abs(estimatedProfit), displayValue: estimatedProfit, className: profitTone }
              ].map(item => (
                <div key={item.label} className="dashboard-finance-bar">
                  <div className="dashboard-finance-bar-label">
                    <span>{item.label}</span>
                    <strong>{formatRupiah(item.displayValue ?? item.value)}</strong>
                  </div>
                  <div className="dashboard-finance-bar-track" aria-hidden="true">
                    <span
                      className={`dashboard-finance-bar-fill ${item.className}`}
                      style={{ width: `${Math.max((item.value / maxFinanceValue) * 100, item.value > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-expense-pie">
              <PieChart
                items={coloredExpenseCategories.map(item => ({
                  key: item.category,
                  label: item.category,
                  value: item.total,
                  color: item.color
                }))}
                centerValue={coloredExpenseCategories.length}
                centerLabel="kategori"
                valueFormatter={formatRupiah}
              />
              <div className="expense-pie-legend">
                {coloredExpenseCategories.slice(0, 4).map((item) => (
                  <div key={item.category} title={`${item.category}: ${formatRupiah(item.total)}`}>
                    <span style={{ backgroundColor: item.color }}></span>
                    <strong>{item.category}</strong>
                    <small>{formatRupiah(item.total)}</small>
                  </div>
                ))}
                {coloredExpenseCategories.length === 0 && <small>Belum ada pengeluaran</small>}
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-status-panel">
          <div className="dashboard-section-header">
            <div>
              <h3>Status Pesanan</h3>
              <span>{totalTrackedOrders} order tercatat</span>
            </div>
          </div>
          <div className="status-summary-grid dashboard-status-list">
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
                <span className={`status-dot ${status.className}`}><i className={status.iconClass}></i></span>
                <span>{status.label}</span>
                <strong>{statusSummary[status.key]}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="insight-grid">
        <div className="insight-panel dashboard-expense-panel">
          <div className="dashboard-section-header insight-heading">
            <span className="insight-heading-icon"><i className="fas fa-receipt"></i></span>
            <div>
              <h3>Kategori Pengeluaran</h3>
              <span>Terakhir: {latestExpenseName}</span>
            </div>
          </div>
          {topExpenseCategories.length > 0 ? (
            <div className="expense-category-list">
              {topExpenseCategories.map((category, index) => (
                <button
                  key={category.category}
                  type="button"
                  className="expense-category-item"
                  onClick={onOpenExpensesTab}
                >
                  <span className="product-rank">{index + 1}</span>
                  <div className="product-copy">
                    <span className="product-name">{category.category}</span>
                    <small>{category.count} catatan</small>
                  </div>
                  <strong>{formatRupiah(category.total)}</strong>
                </button>
              ))}
            </div>
          ) : (
            <p>Belum ada data pengeluaran.</p>
          )}
        </div>

        <div className="insight-panel top-products-panel">
          <div className="dashboard-section-header insight-heading">
            <span className="insight-heading-icon"><i className="fas fa-ranking-star"></i></span>
            <div>
              <h3>Produk Terlaris</h3>
              <span>{topProduct ? `${topProduct.name} memimpin` : 'Belum ada produk'}</span>
            </div>
          </div>
          {topProducts.length > 0 ? (
            <div className="top-products-content">
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

              <div className="dashboard-product-pie">
                <PieChart
                  items={coloredProductSales.map(item => ({
                    key: item.name,
                    label: item.name,
                    value: item.qty,
                    color: item.color
                  }))}
                  centerValue={totalProductQty}
                  centerLabel="pcs"
                  valueFormatter={value => `${value} pcs`}
                />
                <div className="expense-pie-legend">
                  {coloredProductSales.slice(0, 4).map((item) => (
                    <div key={item.name} title={`${item.name}: ${item.qty} pcs`}>
                      <span style={{ backgroundColor: item.color }}></span>
                      <strong>{item.name}</strong>
                      <small>{item.qty} pcs</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Belum ada data produk.</p>
          )}
        </div>
      </div>
    </div>
  );
}
