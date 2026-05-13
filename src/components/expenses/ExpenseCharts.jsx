import { useMemo } from 'react';
import { formatRupiah } from '../../utils/formatters';
import PieChart from '../ui/PieChart';
import {
  getExpenseCategory,
  getExpenseDate,
  getExpenseTotal
} from '../../utils/expenses';

const CATEGORY_COLORS = ['#2F35FF', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6'];

const formatShortDate = (value) => {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta'
  });
};

export default function ExpenseCharts({ expenses }) {
  const chartData = useMemo(() => {
    const categoryMap = new Map();
    const dailyMap = new Map();

    expenses.forEach((expense) => {
      const amount = getExpenseTotal(expense);
      const category = getExpenseCategory(expense);
      const date = getExpenseDate(expense);

      if (amount <= 0) return;

      const currentCategory = categoryMap.get(category) || { category, amount: 0, count: 0 };
      categoryMap.set(category, {
        ...currentCategory,
        amount: currentCategory.amount + amount,
        count: currentCategory.count + 1
      });

      if (date) {
        dailyMap.set(date, (dailyMap.get(date) || 0) + amount);
      }
    });

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({
        ...item,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }));

    const daily = Array.from(dailyMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-7)
      .map(([date, amount]) => ({ date, amount }));

    const maxCategoryAmount = Math.max(...categories.map(item => item.amount), 0);
    const maxDailyAmount = Math.max(...daily.map(item => item.amount), 0);
    const total = categories.reduce((sum, item) => sum + item.amount, 0);

    return {
      categories,
      daily,
      maxCategoryAmount,
      maxDailyAmount,
      topCategory: categories[0],
      total
    };
  }, [expenses]);

  const hasData = chartData.categories.length > 0;

  return (
    <div className="expense-chart-grid">
      <section className="expense-chart-card">
        <div className="expense-chart-header">
          <div>
            <h3>Pengeluaran per Kategori</h3>
            <span>Komposisi dari data yang sedang tampil</span>
          </div>
          <i className="fas fa-chart-simple"></i>
        </div>

        {hasData ? (
          <div className="expense-category-composition">
            <div className="expense-category-bars">
              {chartData.categories.map((item) => {
                const width = chartData.maxCategoryAmount
                  ? Math.max((item.amount / chartData.maxCategoryAmount) * 100, 8)
                  : 0;
                const share = chartData.total ? Math.round((item.amount / chartData.total) * 100) : 0;

                return (
                  <div key={item.category} className="expense-category-bar-row">
                    <div className="expense-category-bar-label">
                      <strong>{item.category}</strong>
                      <span>{share}% &middot; {item.count} catatan</span>
                    </div>
                    <div className="expense-category-bar-track" aria-hidden="true">
                      <span style={{ width: `${width}%`, backgroundColor: item.color }} />
                    </div>
                    <strong className="expense-category-bar-value">{formatRupiah(item.amount)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="expense-pie-panel">
              <PieChart
                items={chartData.categories.map(item => ({
                  key: item.category,
                  label: item.category,
                  value: item.amount,
                  color: item.color
                }))}
                centerValue={chartData.categories.length}
                centerLabel="kategori"
                valueFormatter={formatRupiah}
              />
              <div className="expense-pie-legend">
                {chartData.categories.slice(0, 4).map((item) => (
                  <div key={item.category} title={`${item.category}: ${formatRupiah(item.amount)}`}>
                    <span style={{ backgroundColor: item.color }}></span>
                    <strong>{item.category}</strong>
                    <small>{formatRupiah(item.amount)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="expense-chart-empty">Belum ada data pengeluaran untuk grafik.</p>
        )}
      </section>

      <section className="expense-chart-card expense-trend-card">
        <div className="expense-chart-header">
          <div>
            <h3>Tren Harian</h3>
            <span>Akumulasi 7 tanggal terakhir</span>
          </div>
          <i className="fas fa-chart-column"></i>
        </div>

        <div className="expense-chart-metrics">
          <div>
            <span>Total Terfilter</span>
            <strong>{formatRupiah(chartData.total)}</strong>
          </div>
          <div>
            <span>Kategori Terbesar</span>
            <strong>{chartData.topCategory?.category || '-'}</strong>
          </div>
        </div>

        {chartData.daily.length > 0 ? (
          <div className="expense-trend-bars">
            {chartData.daily.map((item) => {
              const height = chartData.maxDailyAmount
                ? Math.max((item.amount / chartData.maxDailyAmount) * 100, 12)
                : 0;

              return (
                <div key={item.date} className="expense-trend-bar">
                  <div className="expense-trend-bar-track" title={formatRupiah(item.amount)}>
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <small>{formatShortDate(item.date)}</small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="expense-chart-empty">Belum ada tanggal pengeluaran.</p>
        )}
      </section>
    </div>
  );
}
