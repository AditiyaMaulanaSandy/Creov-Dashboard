export default function OrderStatusStrip({
  currentTab,
  ordersCount,
  statusOptions,
  statusSummary,
  onChangeTab
}) {
  return (
    <div className="order-status-strip">
      <button
        className={`order-status-chip ${currentTab === 'all' ? 'active' : ''}`}
        onClick={() => onChangeTab('all')}
      >
        <span className="order-status-icon status-all"><i className="fas fa-layer-group"></i></span>
        <span>Semua</span>
        <strong>{ordersCount}</strong>
      </button>
      {statusOptions.map(status => (
        <button
          key={status.key}
          className={`order-status-chip ${currentTab === status.key ? 'active' : ''}`}
          onClick={() => onChangeTab(status.key)}
        >
          <span className={`order-status-icon ${status.className}`}><i className={status.iconClass}></i></span>
          <span>{status.label}</span>
          <strong>{statusSummary[status.key]}</strong>
        </button>
      ))}
    </div>
  );
}
