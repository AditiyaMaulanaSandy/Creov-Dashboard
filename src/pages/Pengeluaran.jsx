export default function Pengeluaran({ greeting }) {
  return (
    <section className="coming-soon-panel">
      <div className="coming-soon-mark">
        <span className="coming-soon-icon menu-accent-green">
          <i className="fas fa-receipt"></i>
        </span>
      </div>
      <span className="coming-soon-kicker">{greeting}, Admin</span>
      <h2>Pengeluaran</h2>
      <p>Coming soon</p>
    </section>
  );
}
