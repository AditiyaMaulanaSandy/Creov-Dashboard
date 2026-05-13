import { useCallback, useEffect, useMemo, useState } from 'react';
import { EXPENSE_CATEGORIES } from '../constants/dashboard';
import ExpenseCharts from '../components/expenses/ExpenseCharts';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseModal from '../components/expenses/ExpenseModal';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import ExpenseTable from '../components/expenses/ExpenseTable';
import DateFilterPanel from '../components/orders/DateFilterPanel';
import { addExpenseAPI, editExpenseAPI, fetchExpenses } from '../services/api';
import { isSuccessResult, readApiResult } from '../utils/apiResult';
import {
  buildExpensePayload,
  createExpenseForm,
  getExpenseCategory,
  getExpenseDate,
  getExpenseId,
  getExpenseItemName,
  getExpensePaymentMethod,
  getExpenseQty,
  getExpenseTotal,
  getExpenseUnitPrice,
  normalizeExpenseRow,
  normalizeExpenseDateValue,
  parseExpenseAmount
} from '../utils/expenses';
import { getDateRange } from '../utils/orders';

const EXPENSE_ROWS_PER_PAGE = 10;
let cachedExpenses = [];
let hasLoadedExpenses = false;

export default function Pengeluaran({ showToast = () => {} }) {
  const [expenses, setExpenses] = useState(() => cachedExpenses);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [form, setForm] = useState(createExpenseForm);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState(() => getDateRange('all'));
  const [currentPage, setCurrentPage] = useState(1);

  const loadExpenses = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const data = await fetchExpenses();
      const normalizedExpenses = data.map(normalizeExpenseRow);
      cachedExpenses = normalizedExpenses;
      hasLoadedExpenses = true;
      setExpenses(normalizedExpenses);
    } catch {
      showToast({
        type: 'error',
        title: 'Data pengeluaran belum bisa diambil',
        message: 'Pastikan Apps Script sudah punya action getExpenses dan sheet PENGELUARAN.'
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (hasLoadedExpenses) return undefined;

    const timerId = window.setTimeout(() => {
      loadExpenses();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadExpenses]);

  useEffect(() => {
    const modalOpen = isModalOpen;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    if (modalOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow || '';
      document.body.style.paddingRight = prevPaddingRight || '';
    };
  }, [isModalOpen]);

  const activeDatePreset = useMemo(() => {
    const presetKeys = ['today', 'week', 'month', 'all'];
    const matchedKey = presetKeys.find((key) => {
      const preset = getDateRange(key);
      return preset.start === dateFilter.start && preset.end === dateFilter.end;
    });

    return matchedKey || '';
  }, [dateFilter]);

  const filteredExpenses = useMemo(() => {
    const keyword = search.toLowerCase();

    return expenses.filter(expense => {
      const expenseDate = getExpenseDate(expense);
      const expenseCategory = getExpenseCategory(expense);
      const itemName = getExpenseItemName(expense).toLowerCase();
      const id = getExpenseId(expense).toLowerCase();
      const matchSearch = !keyword
        || itemName.includes(keyword)
        || id.includes(keyword)
        || expenseCategory.toLowerCase().includes(keyword);
      const matchCategory = category === 'all' || expenseCategory === category;
      const matchStartDate = !dateFilter.start || (expenseDate && expenseDate >= dateFilter.start);
      const matchEndDate = !dateFilter.end || (expenseDate && expenseDate <= dateFilter.end);

      return matchSearch && matchCategory && matchStartDate && matchEndDate;
    });
  }, [category, dateFilter, expenses, search]);

  const { totalExpense, totalItems } = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => {
      const amount = getExpenseTotal(expense);
      return sum + amount;
    }, 0);
    const itemCount = filteredExpenses.reduce((sum, expense) => sum + getExpenseQty(expense), 0);

    return { totalExpense: total, totalItems: itemCount };
  }, [filteredExpenses]);

  const totalPages = Math.ceil(filteredExpenses.length / EXPENSE_ROWS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedExpenses = filteredExpenses.slice(
    (safeCurrentPage - 1) * EXPENSE_ROWS_PER_PAGE,
    safeCurrentPage * EXPENSE_ROWS_PER_PAGE
  );

  const handleDatePreset = (rangeKey) => {
    setDateFilter(getDateRange(rangeKey));
    setCurrentPage(1);
  };

  const handleChangeDateFilter = (updater) => {
    setDateFilter(updater);
    setCurrentPage(1);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm(createExpenseForm());
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setModalMode('edit');
    setForm({
      expenseId: getExpenseId(expense),
      tanggal: getExpenseDate(expense),
      kategori: getExpenseCategory(expense),
      namaItem: getExpenseItemName(expense),
      qty: getExpenseQty(expense),
      hargaSatuan: getExpenseUnitPrice(expense),
      metode: getExpensePaymentMethod(expense)
    });
    setIsModalOpen(true);
  };

  const handleSubmitExpense = async () => {
    const qty = Number(form.qty) || 0;
    const hargaSatuan = parseExpenseAmount(form.hargaSatuan);
    const total = qty * hargaSatuan;

    if (!form.tanggal || !form.kategori || !form.namaItem || qty <= 0 || hargaSatuan <= 0 || total <= 0) {
      showToast({
        type: 'warning',
        title: 'Data pengeluaran belum lengkap',
        message: 'Lengkapi tanggal, kategori, nama item, qty, dan harga satuan.'
      });
      return;
    }

    const expenseId = modalMode === 'edit'
      ? form.expenseId
      : `EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = {
      ...buildExpensePayload(form),
      expenseId
    };

    setSaving(true);
    showToast({
      type: 'info',
      title: 'Menyimpan pengeluaran',
      message: `${expenseId} sedang dikirim ke server.`
    });

    try {
      const response = modalMode === 'edit'
        ? await editExpenseAPI(payload)
        : await addExpenseAPI(payload);
      const result = await readApiResult(response);

      if (!isSuccessResult(result)) {
        throw new Error('Server belum mengembalikan status sukses.');
      }

      showToast({
        type: 'success',
        title: modalMode === 'edit' ? 'Pengeluaran diperbarui' : 'Pengeluaran ditambahkan',
        message: `${expenseId} berhasil disimpan.`
      });
      setIsModalOpen(false);
      setForm(createExpenseForm());
      await loadExpenses({ silent: true });
    } catch {
      showToast({
        type: 'error',
        title: 'Pengeluaran gagal disimpan',
        message: 'Pastikan Apps Script sudah mendukung action addExpense/editExpense.'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatExpenseDate = (value) => {
    const normalizedDate = normalizeExpenseDateValue(value);
    if (!normalizedDate) return '-';

    const date = new Date(`${normalizedDate}T00:00:00+07:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <div className="dashboard-container legacy-dashboard-content expense-page">
      <ExpenseSummary
        totalExpense={totalExpense}
        expenseCount={filteredExpenses.length}
        totalItems={totalItems}
      />

      <ExpenseCharts expenses={filteredExpenses} />

      <div className="table-container">
        <ExpenseFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          category={category}
          onCategoryChange={(value) => {
            setCategory(value);
            setCurrentPage(1);
          }}
          categories={EXPENSE_CATEGORIES}
          onAddExpense={openAddModal}
        />

        <DateFilterPanel
          dateFilter={dateFilter}
          activeDatePreset={activeDatePreset}
          onChangeDateFilter={handleChangeDateFilter}
          onSelectPreset={handleDatePreset}
        />

        <ExpenseTable
          loading={loading}
          expenses={paginatedExpenses}
          formatExpenseDate={formatExpenseDate}
          onEditExpense={openEditModal}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onChangePage={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <ExpenseModal
          title={modalMode === 'edit' ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
          form={form}
          onChange={handleFormChange}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitExpense}
          saving={saving}
          submitLabel={modalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
        />
      )}
    </div>
  );
}
