/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Sparkles, 
  AlertTriangle, 
  Package, 
  Clock, 
  ArrowRight, 
  Layers
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, Sale, Expense } from '../types';

interface DashboardProps {
  items: InventoryItem[];
  ledger: LedgerTransaction[];
  sales: Sale[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ items, ledger, sales, expenses, onNavigate }: DashboardProps) {
  // 1. Calculate stock balances helper
  const getStockBalance = (itemId: string) => {
    return ledger
      .filter((tx) => tx.itemId === itemId)
      .reduce((sum, tx) => sum + tx.quantity, 0);
  };

  // Calculating total revenues
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Calculating total expenses (operations + stock purchases)
  const opsExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate cost of purchased goods (from ledger purchases or purchase transactions)
  const purchaseCost = ledger
    .filter((tx) => tx.type === 'PURCHASE')
    .reduce((sum, tx) => sum + (tx.quantity * tx.unitPrice), 0);

  const totalExpenses = opsExpenses + purchaseCost;
  const netProfit = totalRevenue - totalExpenses;

  // Stock inventory indicators
  const lowStockItems = items.filter((item) => {
    const bal = getStockBalance(item.id);
    return bal < item.minStockLevel;
  });

  const totalItemsCount = items.length;

  // Compute total value in stock (Stems / Bunches valued at cost price)
  const totalStockValuation = items.reduce((sum, item) => {
    const bal = getStockBalance(item.id);
    const positiveBal = bal > 0 ? bal : 0;
    return sum + (positiveBal * item.costPrice);
  }, 0);

  // Take recent transactions (last 6)
  const recentTx = [...ledger]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Chart Calculations - Last 7 days revenues
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailySales = days.map(day => {
    return sales
      .filter(s => s.createdAt.startsWith(day))
      .reduce((sum, s) => sum + s.totalAmount, 0);
  });

  const maxSaleValue = Math.max(...dailySales, 100);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-display">Welcome to Lourd Flowers ERP</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time flower wholesale, retail recipes, and strict transactional ledger audits.</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="btn-goto-pos"
            onClick={() => onNavigate('pos')} 
            className="flex items-center gap-2 bg-amber-500 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer text-sm font-sans"
          >
            <Sparkles size={16} />
            Open POS Register
          </button>
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rev Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 font-mono">₹{totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1 font-medium bg-emerald-50/50 py-1 px-2 rounded w-fit">
            <span>Active transactions logged</span>
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Outlays (COGS + Ops)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 font-mono">₹{totalExpenses.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-xs text-rose-600 mt-3 flex items-center gap-1 font-semibold bg-rose-50/50 py-1 px-2 rounded w-fit">
            <span>Purchased Bunch stocks + bills</span>
          </p>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">Net Cash Operating Profit</p>
              <h3 className={`text-2xl font-bold mt-1 font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                ₹{netProfit.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-lg ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <IndianRupee size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            Margin: <span className="font-mono font-bold text-gray-800">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'}%</span>
          </p>
        </div>

        {/* Valuation Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">Asset Stock Valuation</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 font-mono">₹{totalStockValuation.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Package size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            Across <span className="font-bold text-gray-800 font-mono">{totalItemsCount}</span> cataloged items
          </p>
        </div>
      </div>

      {/* Main Charts & Alerts Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Render Sales Trend Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs lg:col-span-2">
          <h3 className="font-semibold text-gray-900 text-base font-display">Daily Revenue Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Performance tracking for the last 7 flower sales cycle dates</p>
          
          <div className="mt-6 h-64 w-full relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3By" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="160" x2="480" y2="160" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Data path */}
              {(() => {
                const points = dailySales.map((val, idx) => {
                  const x = 40 + (idx * (440 / 6));
                  // Height ratio mapping: 160 is base y (0 sales), 20 is top y (max height)
                  const percentage = val / maxSaleValue;
                  const y = 160 - (percentage * 130);
                  return { x, y, val };
                });

                const dString = points.reduce((str, p, i) => {
                  return str + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                }, '');

                const areaString = dString + ` L ${points[points.length-1].x} 160 L ${points[0].x} 160 Z`;

                return (
                  <>
                    {/* Area fill */}
                    <path d={areaString} fill="url(#chart-grad)" />
                    {/* Stroke line */}
                    <path d={dString} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Hotspots */}
                    {points.map((p, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
                        <circle cx={p.x} cy={p.y} r="10" fill="#f59e0b" fillOpacity="0" className="hover:fill-opacity-10 transition-opacity" />
                        {/* Tooltip on hover */}
                        <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] font-bold font-mono fill-amber-800 bg-white shadow-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          ₹{p.val.toFixed(0)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* Day Labels */}
              {days.map((day, idx) => {
                const dateObj = new Date(day + 'T00:00:00');
                const friendlyDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                const x = 40 + (idx * (440 / 6));
                return (
                  <text key={idx} x={x} y="180" textAnchor="middle" className="text-[10px] font-medium text-gray-400 font-sans">
                    {friendlyDate}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Low Stock Warn Dashboard Sidebar */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 text-base font-display flex items-center gap-1.5">
              <AlertTriangle className="text-amber-500" size={18} />
              Minima Alerts
            </h3>
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold font-sans">
              {lowStockItems.length} Low Stock
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[220px] pr-1">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Package className="mx-auto text-gray-300 mb-2" size={32} />
                All floral inventory is optimally stocked.
              </div>
            ) : (
              lowStockItems.map((item) => {
                const bal = getStockBalance(item.id);
                return (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.sku} • {item.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block font-bold font-mono text-rose-600">
                        {bal} Left
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        Min limit: {item.minStockLevel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            id="btn-nav-ledger-low"
            onClick={() => onNavigate('inventory')} 
            className="w-full mt-4 text-center py-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            Audit Stock Log Ledger
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Recent Ledger Logs Row */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-base font-display flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Latest Inventory Log Ledger Entries
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Strict double-entry transaction record updates</p>
          </div>
          <button 
            id="btn-goto-ledger-recent"
            onClick={() => onNavigate('inventory')} 
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            View Full Ledger
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase font-sans tracking-wider">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Item Specs</th>
                <th className="py-3 px-4 font-semibold">Activity Type</th>
                <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-4 font-semibold text-right">Ext Value</th>
                <th className="py-3 px-4 font-semibold">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentTx.map((tx) => {
                const item = items.find((i) => i.id === tx.itemId);
                const isAddition = tx.quantity > 0;
                
                // Color badges for ledger actions
                const getBadgeClass = (typeStr: string) => {
                  switch(typeStr) {
                    case 'PURCHASE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'SALE': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    case 'CONVERSION_IN': return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'CONVERSION_OUT': return 'bg-orange-50 text-orange-700 border-orange-200';
                    case 'PRODUCTION_CONSUME': return 'bg-slate-100 text-slate-700 border-slate-200';
                    case 'PRODUCTION_YIELD': return 'bg-teal-50 text-teal-700 border-teal-200';
                    case 'DAMAGE_WRITE_OFF': return 'bg-rose-50 text-rose-700 border-rose-200';
                    default: return 'bg-gray-50 text-gray-600 border-gray-200';
                  }
                };

                return (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{item?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400 font-mono">{item?.sku} ({item?.type})</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block text-[10px] font-bold border rounded px-2 py-0.5 ${getBadgeClass(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isAddition ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      ₹{tx.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                      ₹{Math.abs(tx.quantity * tx.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {tx.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
