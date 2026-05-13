import { formatRupiah } from '../../utils/formatters';

export default function ExpenseTable({
  loading,
  expenses,
  formatExpenseDate,
  onEditExpense,
  currentPage,
  totalPages,
  onChangePage
}) {
  return (
    <>
      <div className="table-scroll">
        <table className="expense-table">
          <colgroup>
            <col className="expense-col-id" />
            <col className="expense-col-date" />
            <col className="expense-col-category" />
            <col className="expense-col-item" />
            <col className="expense-col-qty" />
            <col className="expense-col-unit" />
            <col className="expense-col-total" />
            <col className="expense-col-method" />
            <col className="expense-col-edit" />
          </colgroup>
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Nama Item</th>
              <th>Qty</th>
              <th>Harga Satuan</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="loading"><i className="fas fa-spinner fa-spin"></i> Memuat pengeluaran...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Belum ada data pengeluaran yang cocok.</td></tr>
            ) : (
              expenses.map((expense, index) => (
                <tr key={`${expense['EXPENSE ID'] || 'expense'}-${index}`}>
                  <td><strong>{expense['EXPENSE ID'] || '-'}</strong></td>
                  <td>{formatExpenseDate(expense.TANGGAL)}</td>
                  <td><span className="expense-category-pill">{expense.KATEGORI || '-'}</span></td>
                  <td><strong>{expense['NAMA ITEM'] || '-'}</strong></td>
                  <td><strong>{expense.QTY || 0}</strong></td>
                  <td className="order-total-cell">{formatRupiah(expense['HARGA SATUAN'] || 0)}</td>
                  <td className="order-total-cell">{formatRupiah(expense.TOTAL || 0)}</td>
                  <td>{expense.METODE || '-'}</td>
                  <td>
                    <button onClick={() => onEditExpense(expense)} className="icon-action-btn edit-action-btn" title="Edit Pengeluaran">
                      <i className="fas fa-pen"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button
          disabled={currentPage === 1}
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
          className="page-btn"
          aria-label="Halaman sebelumnya"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="page-indicator">
          <span>Halaman</span>
          <strong>{currentPage} / {totalPages}</strong>
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
          className="page-btn"
          aria-label="Halaman selanjutnya"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </>
  );
}
