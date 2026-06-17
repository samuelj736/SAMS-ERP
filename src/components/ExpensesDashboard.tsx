/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  FileText, 
  Building2, 
  ShoppingBag, 
  TrendingDown, 
  Tag
} from 'lucide-react';
import { Expense, Supplier } from '../types';

interface ExpensesDashboardProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  suppliers: Supplier[];
}

export default function ExpensesDashboard({
  expenses,
  onAddExpense,
  suppliers
}: ExpensesDashboardProps) {
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('UTILITIES');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSupplierId, setExpenseSupplierId] = useState('');

  const [isAdding, setIsAdding] = useState(false);

  // Group math
  const categories: Expense['category'][] = ['RENT', 'UTILITIES', 'MARKETING', 'PACKAGING', 'SALARIES', 'OTHER'];
  const getCategoryTotal = (cat: Expense['category']) => {
    return expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const cumulativeOpsExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDesc) return;

    onAddExpense({
      amount: expenseAmount,
      category: expenseCategory,
      description: expenseDesc,
      date: expenseDate,
      supplierId: expenseSupplierId || undefined
    });

    setExpenseAmount(0);
    setExpenseDesc('');
    setExpenseSupplierId('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
            <DollarSign className="text-amber-500" size={20} />
            Operations Expenses Ledger
          </h2>
          <p className="text-xs text-gray-500 mt-1">File rents, electricity utilities, ribbons/paper wrappers packing materials, marketing ads budgets, and operational overheads.</p>
        </div>

        {!isAdding && (
          <button
            id="btn-add-expense-toggle"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 bg-amber-500 text-white px-3.5 py-2 rounded-lg hover:bg-amber-600 font-semibold text-xs whitespace-nowrap transition-all cursor-pointer"
          >
            <Plus size={14} /> Log Operations Bill
          </button>
        )}
      </div>

      {isAdding && (
        <form id="form-expense" onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-amber-200 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-800 text-sm">Add Operations Bill Row</h3>
            <button
              id="btn-close-expense"
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-rose-500 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Expense Category</label>
              <select
                id="expense-category-select"
                required
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as any)}
                className="w-full mt-1.5 p-2 bg-gray-50 border rounded-lg text-xs"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Cost price (₹)</label>
              <input
                id="expense-amount-input"
                type="number"
                step="0.01"
                required
                min="0.01"
                value={expenseAmount || ''}
                onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                className="w-full mt-1.5 p-2 bg-gray-50 border rounded-lg text-xs font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase font-sans">Expense Date</label>
              <input
                id="expense-date-input"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full mt-1.5 p-2 bg-gray-50 border rounded-lg text-xs font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Related Supplier</label>
              <select
                id="expense-supplier-select"
                value={expenseSupplierId}
                onChange={(e) => setExpenseSupplierId(e.target.value)}
                className="w-full mt-1.5 p-2 bg-gray-50 border rounded-lg text-xs"
              >
                <option value="">-- None / General Overhead --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Voucher Description</label>
              <input
                id="expense-desc-input"
                type="text"
                required
                placeholder="Brief receipt purpose explanation..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full mt-1.5 p-2 bg-gray-50 border rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="text-right pt-2 border-t">
            <button
              id="btn-submit-expense"
              type="submit"
              className="bg-amber-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-amber-600 transition-colors"
            >
              Post Operations Expense
            </button>
          </div>
        </form>
      )}

      {/* Categories widget grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {categories.map(cat => {
          const catVal = getCategoryTotal(cat);
          const ratio = cumulativeOpsExpenses > 0 ? (catVal / cumulativeOpsExpenses) * 100 : 0;
          return (
            <div key={cat} className="bg-white p-3.5 border rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block font-sans">{cat}</span>
                <strong className="text-sm font-mono mt-1 block text-gray-950">₹{catVal.toFixed(2)}</strong>
              </div>
              <div className="mt-3.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${ratio}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses History List */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm">Corporate Operations Log Archive</h3>
          <span className="text-xs bg-slate-100 border px-2.5 py-0.5 rounded text-slate-800 font-mono font-bold">
            Total Operational Bill: ₹{cumulativeOpsExpenses.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/20 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Particular Description</th>
                <th className="py-3 px-4 text-center">Category Tag</th>
                <th className="py-3 px-4">Supplier farm</th>
                <th className="py-3 px-4 text-right">Debit outlays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No operating bills recorded on spreadsheet.
                  </td>
                </tr>
              ) : (
                [...expenses]
                  .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(exp => {
                    const sup = suppliers.find(s => s.id === exp.supplierId);
                    return (
                      <tr key={exp.id} className="hover:bg-gray-50/20">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{exp.date}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800 font-sans">{exp.description}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block text-[10px] font-bold border rounded bg-slate-50 border-slate-100 text-slate-700 uppercase px-2 py-0.5">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-650 text-xs">
                          {sup ? (
                            <span className="flex items-center gap-1 font-semibold text-gray-800">
                              <Building2 size={12} className="text-amber-500" />
                              {sup.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No supplier link</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          -₹{exp.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
