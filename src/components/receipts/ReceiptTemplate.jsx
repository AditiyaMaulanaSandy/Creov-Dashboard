import ReceiptItemVisual from './ReceiptItemVisual';

export default function ReceiptTemplate({
  activeReceiptOrder,
  receiptRef,
  receiptItemImageMap,
  getReceiptItems,
  formatReceiptCurrency,
  getReceiptField,
  getReceiptAddress,
  formatOrderDate,
  formatOrderTime
}) {
  if (!activeReceiptOrder) return null;

  const receiptItems = getReceiptItems(activeReceiptOrder);
  const receiptTotal = formatReceiptCurrency(activeReceiptOrder['TOTAL HARGA']);
  const pengantaran = getReceiptField(activeReceiptOrder, 'Pengantaran', 'Pick up');
  const pembayaran = getReceiptField(activeReceiptOrder, 'Pembayaran', 'Cash');
  const alamat = getReceiptAddress(activeReceiptOrder);

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <div ref={receiptRef} className="receipt-modern-container">
        <div className="receipt-bg-shape receipt-bg-shape-left"></div>
        <div className="receipt-bg-shape receipt-bg-shape-right"></div>
        <div className="receipt-dot-grid receipt-dot-grid-left"></div>
        <div className="receipt-dot-grid receipt-dot-grid-right"></div>

        <div className="receipt-header">
          <div className="receipt-logo-orbit">
            <span className="receipt-logo-main" role="img" aria-label="Logo Creove"></span>
          </div>
          <div className="receipt-spark receipt-spark-left" aria-hidden="true"></div>
          <div className="receipt-spark receipt-spark-right" aria-hidden="true"></div>
          <h2 className="receipt-brand">CREOVE</h2>
          <p className="receipt-subtitle"><span></span>Bukti Pesanan Resmi<span></span></p>
        </div>

        <div className="receipt-info-card">
          <div className="receipt-info-item">
            <span className="receipt-icon-bubble"><i className="fas fa-ticket"></i></span>
            <span className="receipt-info-label">Order ID</span>
            <strong>{activeReceiptOrder['ORDER ID']}</strong>
          </div>
          <div className="receipt-info-item">
            <span className="receipt-icon-bubble"><i className="fas fa-calendar-days"></i></span>
            <span className="receipt-info-label">Tanggal</span>
            <strong>{formatOrderDate(activeReceiptOrder['WAKTU'])}</strong>
          </div>
          <div className="receipt-info-item">
            <span className="receipt-icon-bubble"><i className="fas fa-user"></i></span>
            <span className="receipt-info-label">Nama</span>
            <strong>{activeReceiptOrder['NAMA'] || '-'}</strong>
          </div>
          <div className="receipt-info-item">
            <span className="receipt-icon-bubble"><i className="fas fa-clock"></i></span>
            <span className="receipt-info-label">Jam</span>
            <strong>{formatOrderTime(activeReceiptOrder['WAKTU']) || '-'}</strong>
          </div>
        </div>

        <section className="receipt-order-card">
          <div className="receipt-section-ribbon">Detail Pesanan</div>
          {receiptItems.map((item, index) => (
            <div className="receipt-product-row" key={`${item.name}-${index}`}>
              <ReceiptItemVisual itemName={item.name} imageMap={receiptItemImageMap} />
              <div className="receipt-product-copy">
                <h3>{item.name}</h3>
                <span>x{item.qty}</span>
              </div>
              <strong>{formatReceiptCurrency(item.price)}</strong>
            </div>
          ))}
          <div className="receipt-line-divider"></div>
          <div className="receipt-total-row">
            <span>Total Akhir</span>
            <strong>{receiptTotal}</strong>
          </div>
        </section>

        <div className="receipt-method-card">
          <div className="receipt-method-item">
            <span className="receipt-icon-bubble"><i className="fas fa-motorcycle"></i></span>
            <span>Pengantaran</span>
            <strong>{pengantaran}</strong>
            {alamat && <small className="receipt-method-note">Alamat: {alamat}</small>}
          </div>
          <div className="receipt-method-item">
            <span className="receipt-icon-bubble"><i className="fas fa-wallet"></i></span>
            <span>Pembayaran</span>
            <strong>{pembayaran}</strong>
          </div>
        </div>

        <div className="receipt-grand-total">
          <div className="receipt-grand-icon">
            <i className="fas fa-receipt"></i>
            <span><i className="fas fa-check"></i></span>
          </div>
          <div className="receipt-grand-copy">
            <span>Total Akhir</span>
            <strong>{receiptTotal}</strong>
          </div>
        </div>

        <div className="receipt-footer">
          <div className="receipt-footer-heart">
            <span></span>
            <i className="fas fa-heart"></i>
            <span></span>
          </div>
          <p className="receipt-footer-text">Terima Kasih Telah Memesan!</p>
          <small>Sampai jumpa di pesanan berikutnya</small>
        </div>
      </div>
    </div>
  );
}
