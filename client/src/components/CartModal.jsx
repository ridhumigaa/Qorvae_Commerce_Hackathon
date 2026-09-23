import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartModal({ isOpen, onClose, cart, setCart, onOrderPlaced }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setOrderResult(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setCustomers(data.data);
        if (!selectedCustomerId) {
          setSelectedCustomerId(data.data[0].CUSTOMER_ID);
          setShippingAddress(`${data.data[0].ADDRESS}, ${data.data[0].CITY}, ${data.data[0].STATE} ${data.data[0].POSTAL_CODE}`);
        }
      }
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  const handleCustomerChange = (id) => {
    setSelectedCustomerId(id);
    const c = customers.find(x => x.CUSTOMER_ID === parseInt(id, 10));
    if (c) {
      setShippingAddress(`${c.ADDRESS}, ${c.CITY}, ${c.STATE} ${c.POSTAL_CODE}`);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.PRODUCT_ID === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.STOCK_QUANTITY) {
            alert(`Cannot order more than available stock (${item.STOCK_QUANTITY})`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(x => x.PRODUCT_ID !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.PRICE * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!shippingAddress.trim()) {
      setErrorMsg('Please specify a delivery address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        customer_id: parseInt(selectedCustomerId, 10),
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        items: cart.map(i => ({ product_id: i.PRODUCT_ID, quantity: i.quantity }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setOrderResult(data);
        setCart([]);
        if (onOrderPlaced) onOrderPlaced(data.order_id, selectedCustomerId);
      } else {
        setErrorMsg(data.error || 'Failed to place order.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Shopping Cart & Atomic Checkout</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {orderResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Order Placed Successfully!</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Your order <strong className="font-mono text-amber-600 font-bold">#{orderResult.order_id}</strong> was written to Oracle Database with ACID stock reservation guarantees.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 max-w-md mx-auto text-left space-y-1">
                <div>Source: <span className="text-amber-600 font-bold">{orderResult.source}</span></div>
                <div>Total Charged: <strong>${Number(orderResult.total_amount).toFixed(2)}</strong></div>
                <div>Status: <span className="text-emerald-700 font-bold">PROCESSING / PAID</span></div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-700">Your cart is empty</p>
              <p className="text-xs">Browse the catalog to add products to your cart.</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Items in cart */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cart Items ({cart.length})</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {cart.map((item) => (
                    <div key={item.PRODUCT_ID} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.IMAGE_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                          alt={item.NAME}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">{item.NAME}</div>
                          <div className="text-[11px] text-slate-400 font-mono">${Number(item.PRICE).toFixed(2)} each</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.PRODUCT_ID, -1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded-l transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.PRODUCT_ID, 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded-r transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right w-16">
                          <div className="text-xs font-bold text-slate-900">
                            ${(item.PRICE * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.PRODUCT_ID)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Checkout Details</h4>

                {/* Customer Selection */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Purchasing Customer:</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {customers.map((c) => (
                      <option key={c.CUSTOMER_ID} value={c.CUSTOMER_ID}>
                        {c.CUSTOMER_NAME} — {c.EMAIL} ({c.CITY}, {c.STATE})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shipping Address */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Shipping Destination:</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter shipping street, city, state, zip..."
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Method:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CREDIT_CARD', 'PAYPAL', 'NET_BANKING'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2 rounded-lg border text-center font-medium transition ${
                          paymentMethod === method
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total calculation */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Order Subtotal:</div>
                  <div className="text-xl font-black text-slate-900">${totalAmount.toFixed(2)}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="hidden sm:flex items-center space-x-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Oracle ACID Row Locking</span>
                  </div>
                  <button
                    disabled={submitting}
                    onClick={handleCheckout}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E8B923] to-[#F5C542] hover:from-[#C5A028] hover:to-[#E5B532] text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition flex items-center space-x-2 disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? (
                      <span>Executing Oracle Transaction...</span>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
