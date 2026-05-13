import NewOrderNotice from '../components/ui/NewOrderNotice';
import AddOrderModal from '../components/orders/AddOrderModal';
import DateFilterPanel from '../components/orders/DateFilterPanel';
import EditOrderModal from '../components/orders/EditOrderModal';
import OrderStatusStrip from '../components/orders/OrderStatusStrip';
import OrderTable from '../components/orders/OrderTable';
import ReceiptPreviewModal from '../components/receipts/ReceiptPreviewModal';
import ReceiptTemplate from '../components/receipts/ReceiptTemplate';

export default function Pesanan({
  newOrderNotice,
  onDismissNewOrderNotice,
  currentTab,
  setCurrentTab,
  setCurrentPage,
  orders,
  statusOptions,
  statusSummary,
  setIsAddModalOpen,
  currentSearch,
  setCurrentSearch,
  dateFilter,
  setDateFilter,
  activeDatePreset,
  handleDatePreset,
  loading,
  paginatedOrders,
  getStatusMeta,
  getWaLink,
  formatOrderDate,
  formatOrderTime,
  renderOrderLine,
  parseCurrencyValue,
  updateOrderStatus,
  handleOpenEditModal,
  handlePreviewReceipt,
  safeCurrentPage,
  totalPages,
  isAddModalOpen,
  manualForm,
  handleFormChange,
  addOrderItem,
  receiptItemImageMap,
  productOptions,
  handleItemChange,
  handleItemBlur,
  removeOrderItem,
  manualOrderTotal,
  handleSaveOrder,
  savingOrder,
  isEditModalOpen,
  editForm,
  handleEditFormChange,
  setIsEditModalOpen,
  handleSaveEdit,
  savingEdit,
  activeReceiptOrder,
  receiptRef,
  getReceiptItems,
  formatReceiptCurrency,
  getReceiptField,
  getReceiptAddress,
  isReceiptModalOpen,
  receiptData,
  setIsReceiptModalOpen
}) {
  const handleChangeTab = (tabKey) => {
    setCurrentTab(tabKey);
    setCurrentPage(1);
  };

  const handleChangeDateFilter = (updater) => {
    setDateFilter(updater);
    setCurrentPage(1);
  };

  return (
    <div className="dashboard-container legacy-dashboard-content">
      <NewOrderNotice notice={newOrderNotice} onDismiss={onDismissNewOrderNotice} />

      <OrderStatusStrip
        currentTab={currentTab}
        ordersCount={orders.length}
        statusOptions={statusOptions}
        statusSummary={statusSummary}
        onChangeTab={handleChangeTab}
      />

      <OrderTable
        loading={loading}
        paginatedOrders={paginatedOrders}
        statusOptions={statusOptions}
        getStatusMeta={getStatusMeta}
        getWaLink={getWaLink}
        formatOrderDate={formatOrderDate}
        formatOrderTime={formatOrderTime}
        renderOrderLine={renderOrderLine}
        parseCurrencyValue={parseCurrencyValue}
        updateOrderStatus={updateOrderStatus}
        handleOpenEditModal={handleOpenEditModal}
        handlePreviewReceipt={handlePreviewReceipt}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        currentSearch={currentSearch}
        setCurrentSearch={setCurrentSearch}
        setIsAddModalOpen={setIsAddModalOpen}
        dateFilterContent={(
          <DateFilterPanel
            dateFilter={dateFilter}
            activeDatePreset={activeDatePreset}
            onChangeDateFilter={handleChangeDateFilter}
            onSelectPreset={handleDatePreset}
          />
        )}
      />

      {isAddModalOpen && (
        <AddOrderModal
          manualForm={manualForm}
          handleFormChange={handleFormChange}
          addOrderItem={addOrderItem}
          receiptItemImageMap={receiptItemImageMap}
          productOptions={productOptions}
          handleItemChange={handleItemChange}
          handleItemBlur={handleItemBlur}
          removeOrderItem={removeOrderItem}
          manualOrderTotal={manualOrderTotal}
          parseCurrencyValue={parseCurrencyValue}
          handleSaveOrder={handleSaveOrder}
          savingOrder={savingOrder}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {isEditModalOpen && (
        <EditOrderModal
          editForm={editForm}
          handleEditFormChange={handleEditFormChange}
          statusOptions={statusOptions}
          onClose={() => setIsEditModalOpen(false)}
          handleSaveEdit={handleSaveEdit}
          savingEdit={savingEdit}
        />
      )}

      <ReceiptTemplate
        activeReceiptOrder={activeReceiptOrder}
        receiptRef={receiptRef}
        receiptItemImageMap={receiptItemImageMap}
        getReceiptItems={getReceiptItems}
        formatReceiptCurrency={formatReceiptCurrency}
        getReceiptField={getReceiptField}
        getReceiptAddress={getReceiptAddress}
        formatOrderDate={formatOrderDate}
        formatOrderTime={formatOrderTime}
      />

      {isReceiptModalOpen && (
        <ReceiptPreviewModal
          receiptData={receiptData}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
