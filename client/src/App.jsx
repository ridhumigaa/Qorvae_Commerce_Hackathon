import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Catalog from './components/Catalog';
import CustomerOrderHistory from './components/CustomerOrderHistory';
import OrdersManager from './components/OrdersManager';
import DbaConsole from './components/DbaConsole';
import CartModal from './components/CartModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [targetCustomerId, setTargetCustomerId] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.warn('API health check error:', err);
    }
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.PRODUCT_ID === product.PRODUCT_ID);
      if (existing) {
        if (existing.quantity >= product.STOCK_QUANTITY) {
          alert(`Cannot add more than available stock (${product.STOCK_QUANTITY})`);
          return prev;
        }
        return prev.map(item =>
          item.PRODUCT_ID === product.PRODUCT_ID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleOrderPlaced = (orderId, customerId) => {
    setTargetCustomerId(parseInt(customerId, 10));
    setToastMessage(`Order #${orderId} was committed to Oracle DB!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        dbStatus={dbStatus}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setActiveTab('history')}
            className="ml-2 underline text-amber-400 hover:text-amber-300 font-semibold"
          >
            View in History
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && (
          <Catalog onAddToCart={handleAddToCart} />
        )}

        {activeTab === 'history' && (
          <CustomerOrderHistory initialCustomerId={targetCustomerId} />
        )}

        {activeTab === 'orders' && (
          <OrdersManager />
        )}

        {activeTab === 'dba' && (
          <DbaConsole />
        )}
      </main>

      {/* Cart & Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Qorvae Commerce</span>
            <span>•</span>
            <span>Enterprise E-Commerce Platform</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by Oracle 21c High-Performance Relational Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
