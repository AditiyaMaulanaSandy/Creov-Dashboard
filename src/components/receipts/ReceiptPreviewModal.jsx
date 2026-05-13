export default function ReceiptPreviewModal({ receiptData, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box receipt-preview-modal">
        <h3 className="modal-title"><i className="fas fa-receipt"></i> Preview Struk</h3>
        <div className="receipt-preview-frame">
          <img src={receiptData.url} alt="Struk" />
        </div>
        <div className="modal-actions receipt-preview-actions">
          <button onClick={onClose} className="btn-cancel">
            Tutup
          </button>
          <a
            href={receiptData.url}
            download={receiptData.filename}
            className="btn-primary-action"
          >
            <i className="fas fa-download"></i> Download Gambar
          </a>
        </div>
      </div>
    </div>
  );
}
