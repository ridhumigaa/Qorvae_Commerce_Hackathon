import React, { useState, useEffect } from 'react';
import { 
  History, User, MapPin, Mail, Phone, Calendar, ShoppingBag, 
  ChevronDown, ChevronUp, Search, ShieldCheck, Database, FileText, 
  DollarSign, CheckCircle2, Clock, Truck, XCircle, ArrowUpRight 
} from 'lucide-react';

export default function CustomerOrderHistory({ initialCustomerId }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || 1);
  const [customerMetrics, setCustomerMetrics] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showSqlModal, setShowSqlModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerHistory(selectedCustomerId);
      fetchCustomerSummary(selectedCustomerId);
    }
  }, [selectedCustomerId, searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchCustomerSummary = async (id) => {
    try {
      const res = await fetch(`/api/order-history/customer/${id}/summary`);
      const data = await res.json();
      if (data.success) {
        setCustomerMetrics(data.data);
      }
    } catch (err) {
      console.error('Error fetching customer summary:', err);
    }
  };

  const fetchCustomerHistory = async (id) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('customer_id', id);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/order-history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setHistoryOrders(data.orders || []);
        // Expand all by default
        const initialExpand = {};
        (data.orders || []).forEach(o => { initialExpand[o.order_id] = true; });
        setExpandedOrders(initialExpand);
      }
    } catch (err) {
      console.error('Error fetching customer order history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const selectedCustomer = customers.find(c => c.CUSTOMER_ID === parseInt(selectedCustomerId, 10)) || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-1 rounded-full font-semibold">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Shipped</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-full font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Processing</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 border border-purple-300 text-xs px-2.5 py-1 rounded-full font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Pending</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 border border-red-300 text-xs px-2.5 py-1 rounded-full font-semibold">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-md border border-amber-200">
              Customer Account Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">Itemized Invoices & Purchase Timeline</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Order History & Receipts</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Review previous purchases, track fulfillment milestones, and inspect line-item breakdowns.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Customer Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Shopper:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {customers.map((c) => (
                <option key={c.CUSTOMER_ID} value={c.CUSTOMER_ID}>
                  {c.CUSTOMER_NAME} ({c.EMAIL})
                </option>
              ))}
            </select>
          </div>

          {/* View SQL Button */}
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            title="Inspect Oracle View DDL & Query"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>DBA View SQL</span>
          </button>
        </div>
      </div>

      {/* Customer Profile & Lifetime Metrics Banner */}
      {selectedCustomer.CUSTOMER_ID && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Customer Bio */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm border border-slate-700 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#B8860B] via-[#E8B923] to-[#F5C542] text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                  {selectedCustomer.FIRST_NAME?.[0]}{selectedCustomer.LAST_NAME?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {selectedCustomer.CUSTOMER_NAME}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-300 mt-0.5">
                    <span className="font-mono text-amber-300">Customer ID #{selectedCustomer.CUSTOMER_ID}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{selectedCustomer.STATUS}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{selectedCustomer.EMAIL}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{selectedCustomer.PHONE || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{selectedCustomer.ADDRESS}, {selectedCustomer.CITY}, {selectedCustomer.STATE} {selectedCustomer.POSTAL_CODE}</span>
              </div>
            </div>
          </div>

          {/* Lifetime Spend Metric */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Lifetime Spend</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                ${Number(customerMetrics?.LIFETIME_SPEND ?? selectedCustomer.LIFETIME_SPEND ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Aggregated across all valid transactions</p>
            </div>
          </div>

          {/* Total Orders & Average Value */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Order Statistics</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">
                  {customerMetrics?.TOTAL_ORDERS ?? selectedCustomer.TOTAL_ORDERS ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">orders placed</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Avg: <span className="font-semibold text-slate-800">${Number(customerMetrics?.AVG_ORDER_VALUE ?? selectedCustomer.AVG_ORDER_VALUE ?? 0).toFixed(2)}</span> / order
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & History Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search within this customer's purchases (e.g. 'Laptop', 'PROD-LAP-001', '101')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['ALL', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Orders Timeline */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-500 text-sm">Querying VW_CUSTOMER_ORDER_HISTORY from Oracle...</p>
        </div>
      ) : historyOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No Orders Found</h3>
          <p className="text-slate-500 text-sm mt-1">This customer has no purchases matching the current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.order_id];
            const orderDate = new Date(order.order_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:border-slate-300"
              >
                {/* Order Summary Header */}
                <div
                  onClick={() => toggleExpand(order.order_id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start sm:items-center space-x-4">
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-amber-600">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900">
                          Order #{order.order_id}
                        </span>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{orderDate}</span>
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 0} line item(s)</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{order.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Order Total</div>
                      <div className="text-lg font-black text-slate-900">
                        ${Number(order.order_total).toFixed(2)}
                      </div>
                    </div>

                    <button
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Itemized Breakdown (from ORDER_ITEMS + PRODUCTS) */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200/80 gap-2">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">Delivery Address:</span>
                        <span>{order.shipping_address}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        Payment Status: <span className="font-bold text-slate-700">{order.payment_status}</span>
                      </div>
                    </div>

                    {/* Table of items */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="pb-2">Product Description</th>
                            <th className="pb-2">SKU</th>
                            <th className="pb-2">Category</th>
                            <th className="pb-2 text-right">Unit Price</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items?.map((item) => (
                            <tr key={item.order_item_id} className="hover:bg-white/60 transition">
                              <td className="py-2.5 flex items-center space-x-3">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-900">{item.product_name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">Item ID: #{item.order_item_id}</div>
                                </div>
                              </td>
                              <td className="py-2.5 font-mono text-slate-600 font-medium">
                                {item.product_sku}
                              </td>
                              <td className="py-2.5">
                                <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                  {item.category_name}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-medium text-slate-700">
                                ${Number(item.unit_price).toFixed(2)}
                              </td>
                              <td className="py-2.5 text-center font-bold text-slate-900">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 text-right font-bold text-slate-900">
                                ${Number(item.subtotal).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 text-xs font-bold text-slate-900">
                            <td colSpan="5" className="pt-3 text-right">Order Grand Total:</td>
                            <td className="pt-3 text-right text-sm text-amber-600 font-black">
                              ${Number(order.order_total).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DBA View SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">Oracle DDL: VW_CUSTOMER_ORDER_HISTORY</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                <pre>{`CREATE OR REPLACE VIEW vw_customer_order_history AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.city || ', ' || c.state AS customer_location,
    o.order_id,
    o.order_date,
    o.status AS order_status,
    o.payment_method,
    o.payment_status,
    o.shipping_address,
    o.total_amount AS order_total,
    oi.order_item_id,
    oi.product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.image_url AS product_image,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal AS item_subtotal
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories cat ON p.category_id = cat.category_id;`}</pre>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-xs">
                <strong>DBA Optimization Note:</strong> This view is accelerated by B-Tree index <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">IDX_ORDERS_CUSTOMER_DATE(customer_id, order_date DESC)</code> on the <code className="font-bold">ORDERS</code> table, enabling fast index range scans for individual customer order histories without full table scans.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
