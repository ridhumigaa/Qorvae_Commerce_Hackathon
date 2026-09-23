import React from 'react';
import { ShoppingBag, History, PackageCheck, Terminal, ShoppingCart } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount, onOpenCart, dbStatus }) {
  const tabs = [
    { id: 'catalog', label: 'Catalog', icon: ShoppingBag },
    { id: 'history', label: 'Order History', icon: History },
    { id: 'orders', label: 'Orders', icon: PackageCheck },
    { id: 'dba', label: 'DBA Console', icon: Terminal }
  ];

  const isOracleLive = dbStatus?.database?.connected || dbStatus?.status === 'CONNECTED';

  return (
    <header className="bg-[#0b0f19] border-b border-slate-800/80 sticky top-0 z-40 text-white shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Identity & Database Status */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Qorvae Golden Emblem Logo */}
            <div className="relative w-8 h-8 rounded-lg p-[1px] bg-gradient-to-tr from-[#B8860B] via-[#E8B923] to-[#FFF4C2] shadow-md shadow-[#E8B923]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#08080c] rounded-[7px] flex items-center justify-center p-0.5 overflow-hidden">
                <img
                  src="/qorvae_emblem.svg"
                  alt="Qorvae Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(232,185,35,0.4)]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/qorvae_logo.svg";
                  }}
                />
              </div>
            </div>

            {/* Title & Oracle Pill on a Single Crisp Line */}
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                Qorvae <span className="text-amber-400 font-medium">Commerce</span>
              </span>

              {/* Minimalist System Status Badge */}
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
                title={isOracleLive ? "Connected to Oracle 21c Enterprise Database (XEPDB1)" : "Running in Fallback Mode"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOracleLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Center: Clean Modern Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/70 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Cart Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg border border-slate-700 transition shadow-sm text-xs font-semibold"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/60 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
