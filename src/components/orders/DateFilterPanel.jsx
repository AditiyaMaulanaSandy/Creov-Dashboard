export default function DateFilterPanel({
  dateFilter,
  activeDatePreset,
  onChangeDateFilter,
  onSelectPreset
}) {
  return (
    <div className="date-filter-panel">
      <div className="date-filter-fields">
        <div>
          <label>Dari Tanggal</label>
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => onChangeDateFilter(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        <div>
          <label>Sampai Tanggal</label>
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => onChangeDateFilter(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>
      <div className="date-filter-actions">
        <button className={activeDatePreset === 'today' ? 'active' : ''} onClick={() => onSelectPreset('today')}>Hari Ini</button>
        <button className={activeDatePreset === 'week' ? 'active' : ''} onClick={() => onSelectPreset('week')}>7 Hari</button>
        <button className={activeDatePreset === 'month' ? 'active' : ''} onClick={() => onSelectPreset('month')}>Bulan Ini</button>
        <button className={activeDatePreset === 'all' ? 'active' : ''} onClick={() => onSelectPreset('all')}>Semua</button>
      </div>
    </div>
  );
}
