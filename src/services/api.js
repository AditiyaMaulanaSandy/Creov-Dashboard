const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQJLmhvZl-k932BihUyOSi1hDgazskBQJAzi63TpgP5sjzbGebm-YQ08NEpENj978/exec';

// Tarik Data
export const fetchOrders = async () => {
  const response = await fetch(SCRIPT_URL);
  const data = await response.json();
  return data.reverse().filter(r => r['ORDER ID'] || r['Order ID'] || r['orderId']);
};

// Update Status
export const updateOrderStatusAPI = async (orderId, newStatus) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateStatus', orderId, status: newStatus })
  });
};

// Edit Pesanan
export const editOrderAPI = async (orderData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'editOrder', ...orderData })
  });
};

// Tambah Pesanan Baru
export const addOrderAPI = async (orderData) => {
  return await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};
