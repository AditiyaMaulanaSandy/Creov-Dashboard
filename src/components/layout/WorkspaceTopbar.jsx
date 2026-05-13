export default function WorkspaceTopbar({
  activeMenuMeta,
  dateLabel,
  timeLabel,
  theme,
  loading,
  onToggleSidebar,
  onToggleTheme,
  onRefresh
}) {
  return (
    <header className="workspace-topbar">
      <div className="workspace-title-row">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-outline-icon header-icon-btn sidebar-toggle-btn"
          title="Buka/tutup menu"
          aria-label="Buka/tutup menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="workspace-heading">
          <span className={`workspace-icon ${activeMenuMeta.accentClass}`}>
            <i className={activeMenuMeta.icon}></i>
          </span>
          <div>
            <small>{activeMenuMeta.eyebrow}</small>
            <h1>{activeMenuMeta.title}</h1>
          </div>
        </div>
      </div>
      <div className="workspace-actions">
        <div className="dashboard-date-pill workspace-date-pill">
          <i className="far fa-calendar"></i>
          <span>{dateLabel}</span>
          <span className="dashboard-time-separator">{'\u2022'}</span>
          <span className="dashboard-time-label">{timeLabel}</span>
        </div>
        <button onClick={onToggleTheme} className="btn-outline-icon header-icon-btn" title="Ganti tema" aria-label="Ganti tema">
          <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
        </button>
        <button onClick={onRefresh} className="btn-outline-primary header-refresh-btn">
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          <span>{loading ? 'Memuat...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
