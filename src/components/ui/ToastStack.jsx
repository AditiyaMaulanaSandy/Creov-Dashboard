export default function ToastStack({ toasts }) {
  const iconMap = {
    success: 'fas fa-check',
    error: 'fas fa-triangle-exclamation',
    warning: 'fas fa-circle-exclamation',
    info: 'fas fa-circle-info'
  };

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div className={`toast-card toast-${toast.type}`} key={toast.id}>
          <span className="toast-icon">
            <i className={iconMap[toast.type] || iconMap.info}></i>
          </span>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
