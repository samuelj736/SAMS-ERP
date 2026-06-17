/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  BadgeHelp,
  Building2,
  Calendar
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, Sale, Expense, Supplier } from '../types';

interface ReportsProps {
  items: InventoryItem[];
  ledger: LedgerTransaction[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
}

export default function Reports({
  items,
  ledger,
  sales,
  expenses,
  suppliers
}: ReportsProps) {

  // Helper stock balances
  const getStockBalance = (itemId: string) => {
    return ledger
      .filter((tx) => tx.itemId === itemId)
      .reduce((sum, tx) => sum + tx.quantity, 0);
  };

  // 1. Profit & Loss calculations
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  // COGS (Cost of goods sold). In a flower business, there are a few ways to value COGS.
  // We can calculate total stock purchases as direct COGS, or total stock consumed (sum of consumed stems / bunches valued at cost price).
  // Standard wholesale inventory audit uses: Ending Inventory = Beginning + Purchases - COGS
  // Or we can calculate COGS directly as the cost value of sold items in sales transactions!
  // Let's compute actual Sold Item Costs: sum of cost price * sold quantity
  const computedSoldCOGS = sales.reduce((totalGoodsCost, sale) => {
    return totalGoodsCost + sale.items.reduce((lineSum, line) => {
      const catalogItem = items.find(i => i.id === line.itemId);
      if (!catalogItem) return lineSum;
      let costItemQty = line.quantity;
      if (catalogItem.type === 'BUNCH' && line.billingUnit === 'SINGLE') {
        costItemQty = line.quantity / (catalogItem.stemCountPerBunch || 10);
      }
      return lineSum + (costItemQty * catalogItem.costPrice);
    }, 0);
  }, 0);

  // Operations overhead billing totals
  const totalRentOverhead = expenses.filter(e => e.category === 'RENT').reduce((sum, e) => sum + e.amount, 0);
  const totalUtilities = expenses.filter(e => e.category === 'UTILITIES').reduce((sum, e) => sum + e.amount, 0);
  const totalMarketing = expenses.filter(e => e.category === 'MARKETING').reduce((sum, e) => sum + e.amount, 0);
  const totalPackaging = expenses.filter(e => e.category === 'PACKAGING').reduce((sum, e) => sum + e.amount, 0);
  const totalSalariesPaid = expenses.filter(e => e.category === 'SALARIES').reduce((sum, e) => sum + e.amount, 0);
  const totalOtherOverhead = expenses.filter(e => e.category === 'OTHER').reduce((sum, e) => sum + e.amount, 0);
  const totalOverheadCost = totalRentOverhead + totalUtilities + totalMarketing + totalPackaging + totalSalariesPaid + totalOtherOverhead;

  // Spoilage write-off cost
  const totalSpoliedCOGS = ledger
    .filter(tx => tx.type === 'DAMAGE_WRITE_OFF')
    .reduce((sum, tx) => sum + (Math.abs(tx.quantity) * tx.unitPrice), 0);

  const grossProfit = totalSalesRevenue - computedSoldCOGS - totalSpoliedCOGS;
  const netEarnings = grossProfit - totalOverheadCost;

  // 2. Inventory safety valuation
  const inventoryValueSheet = items.map(item => {
    const bal = getStockBalance(item.id);
    const positiveBal = bal > 0 ? bal : 0;
    const value = positiveBal * item.costPrice;
    return {
      ...item,
      currentBalance: bal,
      valuation: value
    };
  });

  const cumulativeAssetValuation = inventoryValueSheet.reduce((sum, i) => sum + i.valuation, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
          <FileSpreadsheet className="text-amber-500" size={20} />
          Corporate P&L & Inventory Valuation Audit Dashboard
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Perform institutional audit checks on shop income statements, gross and net profit margins, operational outlays, and stock valuations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PROFIT & LOSS LEDGER SHEET */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-gray-250 shadow-md">
          <div className="flex justify-between items-center pb-3 border-b border-gray-150">
            <h3 className="font-extrabold text-gray-900 tracking-tight font-display text-base">Flower Business Income Statement</h3>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
              Active Period Log
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Sales Revenue */}
            <div className="space-y-1.5 pb-2 border-b">
              <div className="flex justify-between text-sm font-bold text-gray-950">
                <span>1. Operating Revenue</span>
                <span className="font-mono text-emerald-600">₹{totalSalesRevenue.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-400">Yielded from POS touch register cashier sales receipts</p>
            </div>

            {/* COGS Segment */}
            <div className="space-y-2 pb-2 border-b">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>2. Cost of Sales (COGS)</span>
                <span className="font-mono text-rose-500">-₹{(computedSoldCOGS + totalSpoliedCOGS).toFixed(2)}</span>
              </div>
              <div className="pl-3.5 space-y-1 text-xs text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span>• Flowers Material Sold COGS:</span>
                  <span className="font-mono">₹{computedSoldCOGS.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Molded / broken flowers shrinkage loss:</span>
                  <span className="font-mono">₹{totalSpoliedCOGS.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Margin */}
            <div className="space-y-1.5 pb-2 border-b">
              <div className="flex justify-between text-sm font-extrabold text-gray-900">
                <span>3. Gross Operating Profit</span>
                <span className="font-mono text-emerald-700">₹{grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-400">
                <span>Gross Margin Percentage:</span>
                <span className="font-mono text-gray-700">
                  {totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>

            {/* Operations Overhead segment */}
            <div className="space-y-2 pb-2 border-b">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>4. Operational Overhead Bills</span>
                <span className="font-mono text-rose-500">-₹{totalOverheadCost.toFixed(2)}</span>
              </div>
              
              <div className="pl-3.5 space-y-1.5 text-xs text-gray-650 font-medium">
                <div className="flex justify-between">
                  <span>• Landlord Space Rent:</span>
                  <span className="font-mono">₹{totalRentOverhead.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Cold Storage & Electricity:</span>
                  <span className="font-mono">₹{totalUtilities.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Florist & Cashier Wages:</span>
                  <span className="font-mono">₹{totalSalariesPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Wrapping Burlap/Gel tubes:</span>
                  <span className="font-mono">₹{totalPackaging.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Ads campaigns:</span>
                  <span className="font-mono">₹{totalMarketing.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Miscellaneous / Admin bills:</span>
                  <span className="font-mono">₹{totalOtherOverhead.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Profits */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <strong className="text-sm font-extrabold text-gray-900 font-display">Net Cash Profit Earnings</strong>
                <strong className={`text-lg font-mono font-black ${netEarnings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹{netEarnings.toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-400">
                <span>Net Margin ratio:</span>
                <span className="font-mono text-gray-800">
                  {totalSalesRevenue > 0 ? ((netEarnings / totalSalesRevenue) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INVENTORY VALUATION LIST */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-gray-250 hover:shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b mb-4">
            <h3 className="font-bold text-gray-900 tracking-tight font-display text-base">Floral Asset Stock Audit</h3>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border-emerald-100 border px-2 py-0.5 rounded-full">
              Valuation: ₹{cumulativeAssetValuation.toFixed(2)}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[420px] divide-y space-y-3 pr-1">
            {inventoryValueSheet.map(row => {
              const balRatio = row.currentBalance > 0 
                ? (row.valuation / cumulativeAssetValuation) * 100 
                : 0;

              return (
                <div key={row.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-gray-850">{row.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">{row.sku} • {row.type}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs block font-bold text-gray-900">
                        {row.currentBalance} units × ₹{row.costPrice.toFixed(2)}
                      </span>
                      <strong className="text-xs font-mono text-amber-700 block mt-0.5">
                        ₹{row.valuation.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Visual weight indicator */}
                  {row.currentBalance > 0 && (
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${balRatio}%` }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
