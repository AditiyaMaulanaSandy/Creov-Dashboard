export default function ExpenseFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  onAddExpense
}) {
  return (
    <div className="table-toolbar expense-toolbar">
      <h2>Catatan Modal & Bahan Baku</h2>
      <div className="table-toolbar-actions">
        <button onClick={onAddExpense} className="btn-primary-action">
          <i className="fas fa-plus"></i> Tambah Pengeluaran
        </button>
        <select
          className="expense-category-filter"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {categories.map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <div className="search-box"><i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Cari item, kategori..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
