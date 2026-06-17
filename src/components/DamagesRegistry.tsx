/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HeartCrack, 
  Plus, 
  Calendar, 
  Trash, 
  CheckCircle, 
  AlertOctagon, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { InventoryItem, DamageLog, User } from '../types';

interface DamagesRegistryProps {
  items: InventoryItem[];
  damageLogs: DamageLog[];
  onRecordDamage: (itemId: string, quantity: number, reason: 'SPOILED' | 'BROKEN_STEM' | 'DRIED_OUT' | 'OTHER', notes?: string) => { success: boolean; message: string };
  ledgerBalances: Record<string, number>;
  currentUser: User;
}

export default function DamagesRegistry({
  items,
  damageLogs,
  onRecordDamage,
  ledgerBalances,
  currentUser
}: DamagesRegistryProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [reason, setReason] = useState<'SPOILED' | 'BROKEN_STEM' | 'DRIED_OUT' | 'OTHER'>('SPOILED');
  const [notes, setNotes] = useState('');

  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const selectedItemStock = selectedItemId ? (ledgerBalances[selectedItemId] || 0) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || damageQty <= 0) return;

    if (damageQty > selectedItemStock) {
      setStatus({ success: false, message: `Insufficient inventory balance on ledger. Only ${selectedItemStock} items available to write-off.` });
      return;
    }

    const outcome = onRecordDamage(selectedItemId, damageQty, reason, notes);
    setStatus(outcome);
    
    if (outcome.success) {
      setSelectedItemId('');
      setDamageQty(1);
      setReason('SPOILED');
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
          <HeartCrack className="text-amber-500" size={20} />
          Floral Damage & Shrinkage Registry
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Record broken stems, dried out, and spoiled flower items. 
          Deductions are instantly recorded onto the transaction ledger as write-off entries to maintain audit compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Record Damage Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200/80 shadow-md space-y-4">
          <h3 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-1.5">
            <Plus size={16} className="text-amber-500" />
            File Shrinkage Record
          </h3>

          {status && (
            <div className={`p-4 rounded-lg text-xs font-semibold ${status.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {status.message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Damaged Flower Item</label>
            <select
              id="damage-item-select"
              required
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setStatus(null);
              }}
              className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:border-amber-500"
            >
              <option value="">-- Choose Item --</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} [Sku: {i.sku}] (Stock: {ledgerBalances[i.id] || 0})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Write-Off quantity</label>
              <input
                id="damage-qty-input"
                type="number"
                required
                min="1"
                value={damageQty}
                onChange={(e) => setDamageQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Shrinkage Reason</label>
              <select
                id="damage-reason-select"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:border-amber-500"
              >
                <option value="SPOILED">Spoiled / Dried out</option>
                <option value="BROKEN_STEM">Broken Stems / Snapped</option>
                <option value="DRIED_OUT">Molded during cold-storage</option>
                <option value="OTHER">Client Return / Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Incident Explanation (Audit Trail)</label>
            <textarea
              id="damage-notes-input"
              rows={3}
              placeholder="Explain how the damage occurred for municipal audit and tax claims..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <button
            id="btn-execute-damage"
            type="submit"
            disabled={!selectedItemId || selectedItemStock < damageQty}
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <HeartCrack size={14} /> Record and Deduct Inventory
          </button>
        </form>

        {/* Shrinkage logs List */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          <h3 className="font-bold text-gray-900 text-sm border-b pb-3 mb-3">Historical Damage Entries ({damageLogs.length})</h3>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-right">Written-off Qty</th>
                  <th className="py-2.5 px-3 text-center">Reason</th>
                  <th className="py-2.5 px-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {damageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No flower wastage has been logged on file. Optimal operations!
                    </td>
                  </tr>
                ) : (
                  [...damageLogs]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(log => {
                      const item = items.find(i => i.id === log.itemId);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/20">
                          <td className="py-2.5 px-3 font-mono text-gray-400 text-[10px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-800">{item?.name || 'Deleted catalog item'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">Sku: {item?.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                            -{log.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-100 rounded">
                              {log.reason}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 font-medium">
                            {log.createdBy}
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
    </div>
  );
}
