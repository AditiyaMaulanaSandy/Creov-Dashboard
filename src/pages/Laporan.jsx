export default function Laporan({ greeting }) {
  return (
    <section className="coming-soon-panel">
      <div className="coming-soon-mark">
        <span className="coming-soon-icon menu-accent-rose">
          <i className="fas fa-file-lines"></i>
        </span>
      </div>
      <span className="coming-soon-kicker">{greeting}, Admin</span>
      <h2>Laporan</h2>
      <p>Coming soon</p>
    </section>
  );
}
