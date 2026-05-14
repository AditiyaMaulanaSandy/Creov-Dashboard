import { formatRupiah } from '../../utils/formatters';

export default function Sidebar({
  menuItems,
  activeMenu,
  onClose,
  onSelectMenu,
  totalOrders,
  totalRevenue
}) {
  return (
    <aside className="sidebar-panel" aria-label="Navigasi utama">
      <div className="sidebar-brand">
        <span className="brand-logo-mark sidebar-logo" role="img" aria-label="Logo Creove"></span>
        <div>
          <strong>Creov&eacute;</strong>
          <span>Business Hub</span>
        </div>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <i className="fas fa-xmark"></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-menu-item ${item.accentClass} ${activeMenu === item.key ? 'active' : ''}`}
            onClick={() => onSelectMenu(item.key)}
            aria-current={activeMenu === item.key ? 'page' : undefined}
            title={item.label}
          >
            <span className="sidebar-menu-icon"><i className={item.icon}></i></span>
            <span className="sidebar-menu-copy">
              <strong>{item.label}</strong>
              <small>{item.eyebrow}</small>
            </span>
            <i className="fas fa-chevron-right sidebar-menu-arrow" aria-hidden="true"></i>
          </button>
        ))}
      </nav>

      <div className="sidebar-mini-card">
        <div className="sidebar-mini-card-head">
          <span className="sidebar-mini-icon"><i className="fas fa-chart-line"></i></span>
          <span>Ringkasan</span>
        </div>
        <div className="sidebar-mini-metric">
          <strong>{totalOrders}</strong>
          <small>pesanan aktif</small>
        </div>
        <div className="sidebar-mini-revenue">
          <span>Pendapatan</span>
          <strong>{formatRupiah(totalRevenue)}</strong>
        </div>
      </div>
    </aside>
  );
}
