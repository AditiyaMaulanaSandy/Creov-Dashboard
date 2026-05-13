import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../../constants/dashboard';
import { formatRupiah } from '../../utils/formatters';

export default function ExpenseModal({
  title,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  submitLabel
}) {
  const total = (Number(form.qty) || 0) * (Number(form.hargaSatuan) || 0);

  return (
    <div className="modal-overlay">
      <div className="modal-box order-modal themed-order-modal expense-modal">
        <div className="order-modal-hero expense-modal-hero">
          <div className="order-modal-heading">
            <span className="order-modal-icon"><i className="fas fa-receipt"></i></span>
            <div>
              <span className="order-modal-kicker">Creove Expense</span>
              <h3 className="modal-title">{title}</h3>
            </div>
          </div>
          <img src="/logo.png" alt="" className="order-modal-logo" aria-hidden="true" />
        </div>

        <div className="form-group-manual order-form-body">
          {form.expenseId && (
            <div className="field-stack">
              <label>Expense ID</label>
              <input type="text" name="expenseId" value={form.expenseId} disabled />
            </div>
          )}

          <div className="form-row">
            <div className="field-stack">
              <label>Tanggal</label>
              <input type="date" name="tanggal" value={form.tanggal} onChange={onChange} />
            </div>
            <div className="field-stack">
              <label>Kategori</label>
              <select name="kategori" value={form.kategori} onChange={onChange}>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-stack">
            <label>Nama Item / Kebutuhan</label>
            <input
              type="text"
              name="namaItem"
              value={form.namaItem}
              onChange={onChange}
              placeholder="Contoh: Oreo 2 pack, cup, plastik, bensin"
            />
          </div>

          <div className="form-row">
            <div className="field-stack">
              <label>Qty</label>
              <input
                type="number"
                name="qty"
                value={form.qty}
                onChange={onChange}
                min="1"
              />
            </div>
            <div className="field-stack">
              <label>Harga Satuan (Rp)</label>
              <input
                type="number"
                name="hargaSatuan"
                value={form.hargaSatuan}
                onChange={onChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-stack">
              <label>Total</label>
              <input type="text" value={formatRupiah(total)} disabled />
            </div>
            <div className="field-stack">
              <label>Metode</label>
              <select name="metode" value={form.metode} onChange={onChange}>
                {EXPENSE_PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-actions modal-actions-spaced">
          <button onClick={onClose} className="btn-cancel">Batal</button>
          <button onClick={onSubmit} disabled={saving} className="btn-primary-action">
            {saving ? 'Menyimpan...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
