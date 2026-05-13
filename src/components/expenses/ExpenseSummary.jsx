import { formatRupiah } from '../../utils/formatters';

export default function ExpenseSummary({ totalExpense, expenseCount, totalItems }) {
  return (
    <div className="summary-grid expense-summary-grid">
      <div className="summary-card-modern">
        <div className="icon-box-modern"><i className="fas fa-money-bill-wave"></i></div>
        <div className="info-modern">
          <span className="title-modern">Total Pengeluaran</span>
          <h3>{formatRupiah(totalExpense)}</h3>
        </div>
      </div>
      <div className="summary-card-modern">
        <div className="icon-box-modern"><i className="fas fa-boxes-stacked"></i></div>
        <div className="info-modern">
          <span className="title-modern">Catatan Modal</span>
          <h3>{expenseCount}</h3>
        </div>
      </div>
      <div className="summary-card-modern">
        <div className="icon-box-modern"><i className="fas fa-layer-group"></i></div>
        <div className="info-modern">
          <span className="title-modern">Total Item Dibeli</span>
          <h3>{totalItems}</h3>
        </div>
      </div>
    </div>
  );
}
