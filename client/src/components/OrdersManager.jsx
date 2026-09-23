import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, CheckCircle2, Truck, Clock, XCircle, Eye, AlertCircle, RefreshCw } from 'lucide-react';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders';
      if (selectedStatus !== 'ALL') url += `?status=${selectedStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setActiveOrderDetails(data.data);
      }
    } catch (err) {
      console.error('Failed to load order details', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
        if (activeOrderDetails && activeOrderDetails.ORDER_ID === orderId) {
          openOrderDetails(orderId);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update status' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      String(o.ORDER_ID).includes(q) ||
      (o.CUSTOMER_NAME && o.CUSTOMER_NAME.toLowerCase().includes(q)) ||
      (o.CUSTOMER_EMAIL && o.CUSTOMER_EMAIL.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">Delivered</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Shipped</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">Processing</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Pending</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Orders & Fulfillment</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor customer checkout transactions, manage delivery statuses, and handle order adjustments.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-500 text-sm">Loading orders from Oracle...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No orders found</h3>
          <p className="text-slate-500 text-sm mt-1">There are no orders matching this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.ORDER_ID} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{o.ORDER_ID}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{o.CUSTOMER_NAME}</div>
                      <div className="text-[11px] text-slate-500">{o.CUSTOMER_EMAIL}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(o.ORDER_DATE).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {o.TOTAL_ITEMS || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ${Number(o.TOTAL_AMOUNT).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(o.STATUS)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(o.ORDER_ID)}
                        className="inline-flex items-center space-x-1 text-slate-700 hover:text-amber-600 font-semibold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {activeOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Order #{activeOrderDetails.ORDER_ID} Details</h3>
                <p className="text-xs text-slate-400">Placed on {new Date(activeOrderDetails.ORDER_DATE).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setActiveOrderDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status & Lifecycle Action Controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-500 text-[11px] block">Current Status:</span>
                  <div className="mt-1">{getStatusBadge(activeOrderDetails.STATUS)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] mr-1">Update Status:</span>
                  {['PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
                    <button
                      key={st}
                      disabled={statusUpdating || activeOrderDetails.STATUS === st || activeOrderDetails.STATUS === 'CANCELLED' || activeOrderDetails.STATUS === 'DELIVERED'}
                      onClick={() => handleUpdateStatus(activeOrderDetails.ORDER_ID, st)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 rounded font-semibold text-[11px] text-slate-700 transition"
                    >
                      {st}
                    </button>
                  ))}
                  <button
                    disabled={statusUpdating || activeOrderDetails.STATUS === 'CANCELLED' || activeOrderDetails.STATUS === 'DELIVERED'}
                    onClick={() => handleUpdateStatus(activeOrderDetails.ORDER_ID, 'CANCELLED')}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 disabled:opacity-40 border border-red-300 rounded font-semibold text-[11px] text-red-700 transition"
                    title="Calls PL/SQL pkg_ecommerce_orders.cancel_order to replenish stock"
                  >
                    Cancel (PL/SQL Restore)
                  </button>
                </div>
              </div>

              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/60 rounded-xl text-slate-700">
                <div>
                  <span className="text-slate-400 block font-medium">Customer:</span>
                  <span className="font-semibold text-slate-900">{activeOrderDetails.CUSTOMER_NAME}</span>
                  <div className="text-slate-500">{activeOrderDetails.EMAIL}</div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Shipping Address:</span>
                  <span className="text-slate-800">{activeOrderDetails.SHIPPING_ADDRESS}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Order Items ({activeOrderDetails.items?.length || 0})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrderDetails.items?.map((item) => (
                        <tr key={item.ORDER_ITEM_ID}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.PRODUCT_NAME}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.PRODUCT_SKU}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right">${Number(item.UNIT_PRICE).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.QUANTITY}</td>
                          <td className="py-2.5 px-3 text-right font-bold">${Number(item.SUBTOTAL).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                        <td colSpan="3" className="py-2 px-3 text-right">Total:</td>
                        <td className="py-2 px-3 text-right text-amber-600 font-black text-sm">
                          ${Number(activeOrderDetails.TOTAL_AMOUNT).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveOrderDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
