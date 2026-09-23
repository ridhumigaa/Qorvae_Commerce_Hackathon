import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Check, AlertTriangle, Layers, Tag } from 'lucide-react';

export default function Catalog({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm, lowStockOnly]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (lowStockOnly) params.append('low_stock', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (product) => {
    onAddToCart(product);
    setAddedNotice(product.PRODUCT_ID);
    setTimeout(() => setAddedNotice(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Premium Tech Hero Banner */}
      <div className="bg-gradient-to-r from-[#0d1322] via-[#151c2e] to-[#1c1829] rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800/80 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium text-amber-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Next-Gen Workstations & Gear</span>
            <span>•</span>
            <span>Live Warehouse Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Discover High-Performance Tech
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Explore cutting-edge creator laptops, ultrawide curved monitors, acoustic audio equipment, and developer gear with real-time stock availability.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by product name, SKU (e.g. PROD-LAP-001), or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Low Stock Toggle */}
          <div className="flex items-center space-x-2 text-sm text-slate-700">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span className="flex items-center space-x-1 font-medium text-xs sm:text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Low Stock Reorder Alerts</span>
              </span>
            </label>
          </div>
        </div>

        {/* Categories Horizontal Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === null
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.CATEGORY_ID}
              onClick={() => setSelectedCategory(cat.CATEGORY_ID)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                selectedCategory === cat.CATEGORY_ID
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#E8B923] to-[#F5C542] text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{cat.CATEGORY_NAME}</span>
              {cat.PRODUCT_COUNT !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.CATEGORY_ID ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cat.PRODUCT_COUNT}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-500 text-sm">Querying Oracle products catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No products match your criteria</h3>
          <p className="text-slate-500 text-sm mt-1">Try resetting the search keyword or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => {
            const isLowStock = p.STOCK_QUANTITY <= p.REORDER_LEVEL;
            const isOutOfStock = p.STOCK_QUANTITY === 0;
            const justAdded = addedNotice === p.PRODUCT_ID;

            return (
              <div
                key={p.PRODUCT_ID}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Image & Badges */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={p.IMAGE_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                    alt={p.NAME}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-slate-100 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                      {p.SKU}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                      {p.CATEGORY_NAME}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 hover:text-amber-600 transition">
                      {p.NAME}
                    </h3>
                    <p className="mt-1 text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {p.DESCRIPTION}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        ${Number(p.PRICE).toFixed(2)}
                      </div>
                      <div className="flex items-center space-x-1 text-[11px]">
                        {isOutOfStock ? (
                          <span className="text-red-600 font-semibold">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-amber-600 font-medium flex items-center space-x-1">
                            <span>Only {p.STOCK_QUANTITY} left!</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">
                            {p.STOCK_QUANTITY} in stock
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(p)}
                      disabled={isOutOfStock}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : justAdded
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-gradient-to-r from-[#D4AF37] via-[#E8B923] to-[#F5C542] hover:from-[#C5A028] hover:to-[#E5B532] text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-95'
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5 text-slate-900" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
