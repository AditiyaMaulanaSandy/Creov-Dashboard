export default function EditOrderModal({
  editForm,
  handleEditFormChange,
  statusOptions,
  onClose,
  handleSaveEdit,
  savingEdit
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box order-modal edit-order-modal">
        <h3 className="modal-title"><i className="fas fa-pen"></i> Edit Pesanan</h3>
        <div className="form-group-manual">
          <label>Order ID</label>
          <input type="text" value={editForm.orderId} disabled />

          <label>Nama Pemesan</label>
          <input type="text" name="nama" value={editForm.nama} onChange={handleEditFormChange} />

          <div className="form-row">
            <div>
              <label>Tanggal</label>
              <input type="date" name="tanggal" value={editForm.tanggal} onChange={handleEditFormChange} />
            </div>
            <div>
              <label>Jam</label>
              <input type="time" name="jam" value={editForm.jam} onChange={handleEditFormChange} />
            </div>
          </div>

          <label>Isi Pesanan</label>
          <textarea name="pesanan" value={editForm.pesanan} onChange={handleEditFormChange} rows="8" />

          <div className="form-row">
            <div>
              <label>Total Harga (Rp)</label>
              <input type="number" name="total" value={editForm.total} onChange={handleEditFormChange} />
            </div>
            <div>
              <label>Status</label>
              <select name="status" value={editForm.status} onChange={handleEditFormChange}>
                {statusOptions.map(status => (
                  <option key={status.key} value={status.label}>{status.icon} {status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label>Nomor WhatsApp</label>
          <input type="text" name="wa" value={editForm.wa} onChange={handleEditFormChange} />
        </div>

        <div className="modal-actions modal-actions-spaced">
          <button onClick={onClose} className="btn-cancel">Batal</button>
          <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary-action">
            {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
