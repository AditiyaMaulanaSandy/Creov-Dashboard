export default function NewOrderNotice({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div className="new-order-notice">
      <div>
        <strong>{notice.count} pesanan baru masuk</strong>
        <span>Terbaru dari {notice.latestName}</span>
      </div>
      <button onClick={onDismiss} className="notice-close-btn">Tutup</button>
    </div>
  );
}
