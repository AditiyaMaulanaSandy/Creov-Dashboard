import { formatRupiah } from '../../utils/formatters';

export default function AddOrderModal({
  manualForm,
  handleFormChange,
  addOrderItem,
  receiptItemImageMap,
  productOptions,
  handleItemChange,
  handleItemBlur,
  removeOrderItem,
  manualOrderTotal,
  parseCurrencyValue,
  handleSaveOrder,
  savingOrder,
  onClose
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box order-modal themed-order-modal">
        <div className="order-modal-hero">
          <div className="order-modal-heading">
            <span className="order-modal-icon"><i className="fas fa-cart-plus"></i></span>
            <div>
              <span className="order-modal-kicker">Creove Order</span>
              <h3 className="modal-title">Tambah Pesanan Baru</h3>
            </div>
          </div>
          <img src="/logo.png" alt="" className="order-modal-logo" aria-hidden="true" />
        </div>

        <div className="form-group-manual order-form-body">
          <div className="field-stack">
            <label>Nama Pemesan</label>
            <input type="text" name="nama" value={manualForm.nama} onChange={handleFormChange} placeholder="Masukkan Nama Customer" />
          </div>

          <div className="form-row">
            <div className="field-stack">
              <label>Tanggal</label>
              <input type="date" name="tanggal" value={manualForm.tanggal} onChange={handleFormChange} />
            </div>
            <div className="field-stack">
              <label>Jam</label>
              <input type="time" name="jam" value={manualForm.jam} onChange={handleFormChange} />
            </div>
          </div>

          <div className="product-section-header">
            <label>Daftar Produk</label>
            <button type="button" onClick={addOrderItem} className="btn-add-product">
              <i className="fas fa-plus"></i>
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="order-item-list">
            {manualForm.items.map((item, index) => (
              <div key={index} className="order-item-card">
                <div className="order-item-media">
                  <img src={receiptItemImageMap[item.produk]} alt={item.produk} />
                  <span>#{index + 1}</span>
                </div>

                <div className="order-item-content">
                  <div className="form-row order-item-grid">
                    <div className="field-stack">
                      <label>Produk</label>
                      <select value={item.produk} onChange={e => handleItemChange(index, 'produk', e.target.value)}>
                        {productOptions.map(product => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-stack qty-field">
                      <label>Qty</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => handleItemChange(index, 'qty', e.target.value)}
                        onBlur={() => handleItemBlur(index, 'qty')}
                      />
                    </div>
                  </div>

                  <div className="form-row order-price-row">
                    <div className="field-stack">
                      <label>Harga Template (Rp)</label>
                      <input type="text" value={formatRupiah(parseCurrencyValue(item.harga))} disabled />
                      {item.produk === 'Signature Layered Oreo' && (
                        <div className="product-price-note">
                          1 pcs = Rp 10.000, 3 pcs = Rp 25.000
                        </div>
                      )}
                    </div>
                    <div className="remove-item-wrap">
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        disabled={manualForm.items.length === 1}
                        className="btn-remove-product"
                      >
                        <i className="fas fa-trash"></i>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary-strip">
            <div className="order-summary-pill">
              <span>Total Harga</span>
              <strong>{formatRupiah(manualOrderTotal)}</strong>
            </div>
            <div className="order-summary-pill">
              <span>Total Item</span>
              <strong>{manualForm.items.length} item</strong>
            </div>
          </div>

          <div className="form-row">
            <div className="field-stack"><label>Pengantaran</label>
              <select name="pengantaran" value={manualForm.pengantaran} onChange={handleFormChange}>
                <option value="Pick up">Pick up (Ambil Sendiri)</option>
                <option value="Delivery">COD (Area Sekitar)</option>
                <option value="Kurir (Free)">Kurir (Free)</option>
              </select>
            </div>
            <div className="field-stack"><label>Pembayaran</label>
              <select name="pembayaran" value={manualForm.pembayaran} onChange={handleFormChange}>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="Qris">Qris</option>
              </select>
            </div>
          </div>
          {(manualForm.pengantaran === 'Delivery' || manualForm.pengantaran === 'Kurir (Free)') && (
            <div className="form-row">
              <div className="field-stack full-width-field">
                <label>Alamat Pengantaran</label>
                <input type="text" name="alamat" value={manualForm.alamat} onChange={handleFormChange} placeholder="Masukkan alamat lengkap untuk pengantaran" />
              </div>
            </div>
          )}
          <div className="field-stack">
            <label>Nomor WhatsApp</label>
            <input type="text" name="wa" value={manualForm.wa} onChange={handleFormChange} placeholder="(Opsional)" />
          </div>
        </div>

        <div className="modal-actions modal-actions-spaced">
          <button onClick={onClose} className="btn-cancel">Batal</button>
          <button onClick={handleSaveOrder} disabled={savingOrder} className="btn-primary-action">
            {savingOrder ? 'Menyimpan...' : 'Simpan Pesanan'}
          </button>
        </div>
      </div>
    </div>
  );
}
