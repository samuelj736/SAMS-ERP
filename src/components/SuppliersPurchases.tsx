/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  CheckCircle, 
  Layers, 
  Plus, 
  ArrowRightLeft, 
  Maximize2,
  Minimize2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Supplier, PurchaseOrder, InventoryItem, User } from '../types';

interface SuppliersPurchasesProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  purchaseOrders: PurchaseOrder[];
  onAddPurchase: (supplierId: string, invoiceNum: string, purchaseItems: { itemId: string; quantity: number; unitCost: number }[]) => void;
  items: InventoryItem[];
  ledgerBalances: Record<string, number>;
  onConvertBunchesToStems: (bunchItemId: string, stemItemId: string, bunchesCount: number, notes?: string) => { success: boolean; message: string };
  currentUser: User;
}

type SubTab = 'SUPPLIERS' | 'PURCHASES' | 'CONVERSION';

export default function SuppliersPurchases({ 
  suppliers, 
  onAddSupplier, 
  purchaseOrders, 
  onAddPurchase, 
  items, 
  ledgerBalances,
  onConvertBunchesToStems,
  currentUser
}: SuppliersPurchasesProps) {
  const [subTab, setSubTab] = useState<SubTab>('PURCHASES');

  // Supplier forms states
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  // Purchase Order form states
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseLines, setPurchaseLines] = useState<{ itemId: string; quantity: number; unitCost: number }[]>([
    { itemId: '', quantity: 1, unitCost: 0 }
  ]);

  // Conversion Room states
  const [selectedBunchId, setSelectedBunchId] = useState('');
  const [selectedStemId, setSelectedStemId] = useState('');
  const [bunchesToConvert, setBunchesToConvert] = useState<number>(1);
  const [conversionNotes, setConversionNotes] = useState('');
  const [conversionStatus, setConversionStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Calculations for conversion previews
  const selectedBunch = items.find(i => i.id === selectedBunchId);
  const selectedStem = items.find(i => i.id === selectedStemId);
  const stemCountYield = selectedBunch && selectedBunch.stemCountPerBunch 
    ? bunchesToConvert * selectedBunch.stemCountPerBunch 
    : 0;

  const currentBunchStock = selectedBunchId ? (ledgerBalances[selectedBunchId] || 0) : 0;

  // Handle supplier submit
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName) return;
    onAddSupplier({
      name: supplierName,
      contactName: supplierContact,
      phone: supplierPhone,
      email: supplierEmail,
      address: supplierAddress,
      status: 'ACTIVE'
    });
    // Reset
    setSupplierName('');
    setSupplierContact('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierAddress('');
    setIsAddingSupplier(false);
  };

  // Handle purchase submit
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !invoiceNumber) return;
    
    // Filter out rows without selected item or 0 quant
    const validLines = purchaseLines.filter(line => line.itemId && line.quantity > 0 && line.unitCost >= 0);
    if (validLines.length === 0) return;

    onAddPurchase(selectedSupplierId, invoiceNumber, validLines);

    // Reset
    setSelectedSupplierId('');
    setInvoiceNumber('');
    setPurchaseLines([{ itemId: '', quantity: 1, unitCost: 0 }]);
    setIsAddingPurchase(false);
  };

  // Add line item to purchase form
  const addPurchaseLine = () => {
    setPurchaseLines([...purchaseLines, { itemId: '', quantity: 1, unitCost: 0 }]);
  };

  // Update line item in purchase form
  const updatePurchaseLine = (index: number, field: string, value: any) => {
    const updated = [...purchaseLines];
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      updated[index] = { 
        ...updated[index], 
        itemId: value, 
        unitCost: selectedItem ? selectedItem.costPrice : 0 
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPurchaseLines(updated);
  };

  // Remove line item
  const removePurchaseLine = (index: number) => {
    if (purchaseLines.length === 1) return;
    setPurchaseLines(purchaseLines.filter((_, idx) => idx !== index));
  };

  // Handle bunch disassembly conversion click
  const handleDecompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBunchId || !selectedStemId || bunchesToConvert <= 0) return;
    
    const outcome = onConvertBunchesToStems(
      selectedBunchId,
      selectedStemId,
      bunchesToConvert,
      conversionNotes
    );

    setConversionStatus(outcome);
    if (outcome.success) {
      setBunchesToConvert(1);
      setConversionNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-1.5 shadow-xs flex select-none max-w-xl">
        <button
          id="subtab-purchases"
          onClick={() => { setSubTab('PURCHASES'); setConversionStatus(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${subTab === 'PURCHASES' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <ShoppingBag size={16} />
          Purchases (PO)
        </button>
        <button
          id="subtab-conversion"
          onClick={() => { setSubTab('CONVERSION'); setConversionStatus(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${subTab === 'CONVERSION' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <ArrowRightLeft size={16} />
          Bunch-to-Stem Room
        </button>
        <button
          id="subtab-suppliers"
          onClick={() => { setSubTab('SUPPLIERS'); setConversionStatus(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${subTab === 'SUPPLIERS' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Building2 size={16} />
          Suppliers Directory
        </button>
      </div>

      {/* RENDER PURCHASES TAB */}
      {subTab === 'PURCHASES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Flower Consignments & Purchases</h2>
              <p className="text-xs text-gray-500 mt-0.5">Procuring wholesale raw bunches from high-altitude farms.</p>
            </div>
            {!isAddingPurchase && (
              <button
                id="btn-add-purchase-toggle"
                onClick={() => {
                  setIsAddingPurchase(true);
                  setInvoiceNumber('INVP-' + Math.floor(100000 + Math.random() * 900000));
                }}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-2 rounded-lg hover:bg-amber-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Receive Consignment
              </button>
            )}
          </div>

          {isAddingPurchase && (
            <form id="form-purchase" onSubmit={handlePurchaseSubmit} className="bg-white p-6 rounded-xl border border-amber-200 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingBag className="text-amber-500" size={18} />
                  New Incoming Consignment Draft
                </h3>
                <button
                  id="btn-close-purchase"
                  type="button"
                  onClick={() => setIsAddingPurchase(false)}
                  className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Vendor Supplier</label>
                  <select
                    id="purchase-supplier-select"
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- Choose Supplying Farm --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.contactName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Supplier Invoice #</label>
                  <input
                    id="purchase-invoice-input"
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Line items repeater */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Flowers Received</label>
                  <button 
                    id="btn-add-purchase-line"
                    type="button" 
                    onClick={addPurchaseLine}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus size={14} /> Add Raw Item
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {purchaseLines.map((line, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] text-gray-400 font-medium">Floral Item (Bunch/Stem)</label>
                        <select
                          id={`purchase-line-item-${index}`}
                          required
                          value={line.itemId}
                          onChange={(e) => updatePurchaseLine(index, 'itemId', e.target.value)}
                          className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="">-- Choose Item --</option>
                          {items.filter(i => i.type !== 'BOUQUET').map(i => (
                            <option key={i.id} value={i.id}>{i.name} [SKU: {i.sku}] (₹{i.costPrice.toFixed(2)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-gray-400 font-medium">Quantity (Units)</label>
                        <input
                          id={`purchase-line-qty-${index}`}
                          type="number"
                          required
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updatePurchaseLine(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-gray-400 font-medium">Cost Price (₹)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-3 text-xs text-gray-400">₹</span>
                          <input
                            id={`purchase-line-cost-${index}`}
                            type="number"
                            step="0.01"
                            required
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => updatePurchaseLine(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full mt-1 pl-6 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          id={`btn-remove-purchase-line-${index}`}
                          type="button"
                          disabled={purchaseLines.length === 1}
                          onClick={() => removePurchaseLine(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm font-semibold text-gray-600">
                  Total Declared Cost:{' '}
                  <span className="text-lg font-bold text-gray-900 font-mono pl-1">
                    ₹{purchaseLines.reduce((sum, l) => sum + (l.quantity * l.unitCost), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  id="btn-submit-purchase"
                  type="submit"
                  className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm shadow-xs cursor-pointer"
                >
                  Approve and File Ledger Entries
                </button>
              </div>
            </form>
          )}

          {/* Historical PO table */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Historical Purchase Registry</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date Logged</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Farm Supplier</th>
                    <th className="py-3 px-4 text-center">Assorted Goods</th>
                    <th className="py-3 px-4 text-right">Order Value</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">
                        No purchase consignments recorded. Receive supplier raw stock to start.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const sup = suppliers.find(s => s.id === po.supplierId);
                      return (
                        <tr key={po.id} className="hover:bg-gray-50/20">
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">
                            {new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800 font-mono">{po.invoiceNumber}</td>
                          <td className="py-3 px-4 text-gray-600">{sup?.name || 'Unknown Supplier'}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="text-xs bg-slate-50 border border-slate-100 font-bold px-2 py-1 rounded inline-block">
                              {po.items.length} different items ({po.items.reduce((sum, item) => sum + item.quantity, 0)} total units)
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">₹{po.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-100 rounded-full">
                              <CheckCircle size={12} /> Received
                            </span>
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
      )}

      {/* RENDER CONVERSION TAB */}
      {subTab === 'CONVERSION' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 font-display">Floral Bunch-to-Stem Breakdown Room</h2>
            <p className="text-xs text-gray-500 mt-1">
              Wholesale flower business process: break down purchased dense Bunches into individual single Stems. 
              The raw bunch is deducted, and stems are recorded in the transaction ledger for single sale or florist recipes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversion Form */}
            <form onSubmit={handleDecompose} className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200/80 shadow-md space-y-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-gray-100">
                <ArrowRightLeft className="text-amber-500" size={18} />
                Breakdown Stock Execution
              </h3>

              {conversionStatus && (
                <div className={`p-4 rounded-lg text-xs font-semibold ${conversionStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {conversionStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">1. Source Flower Bunch</label>
                  <select
                    id="convert-bunch-select"
                    required
                    value={selectedBunchId}
                    onChange={(e) => {
                      setSelectedBunchId(e.target.value);
                      setConversionStatus(null);
                    }}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500"
                  >
                    <option value="">-- Select Bunch Type --</option>
                    {items.filter(i => i.type === 'BUNCH').map(i => (
                      <option key={i.id} value={i.id}>{i.name} [Sku: {i.sku}] (Holds {i.stemCountPerBunch} Stems)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">2. Target Storage Stem</label>
                  <select
                    id="convert-stem-select"
                    required
                    value={selectedStemId}
                    onChange={(e) => {
                      setSelectedStemId(e.target.value);
                      setConversionStatus(null);
                    }}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500"
                  >
                    <option value="">-- Select Target Stem --</option>
                    {items.filter(i => i.type === 'STEM').map(i => (
                      <option key={i.id} value={i.id}>{i.name} [Sku: {i.sku}] (₹{i.costPrice.toFixed(2)} cost)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">3. Number of Bunches to Decompose</label>
                <div className="flex gap-4 items-center">
                  <input
                    id="convert-bunch-qty-input"
                    type="number"
                    required
                    min="1"
                    max={currentBunchStock > 0 ? currentBunchStock : 100}
                    value={bunchesToConvert}
                    onChange={(e) => setBunchesToConvert(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400 mt-1 font-semibold">
                    Current Bunch Stock available: <strong className="font-mono text-gray-800">{currentBunchStock}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">4. Internal Audit Notes</label>
                <input
                  id="convert-notes-input"
                  type="text"
                  placeholder="e.g., Splitting for Crimson Romance production batches..."
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                id="btn-execute-conversion"
                type="submit"
                disabled={!selectedBunchId || !selectedStemId || currentBunchStock < bunchesToConvert}
                className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-40"
              >
                <ArrowRightLeft size={16} />
                Confirm Breakdown
              </button>
            </form>

            {/* Calculations & Flowchart Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                <h4 className="font-bold text-amber-900 text-sm">Ledger Conversion Mechanics</h4>
                <p className="text-xs text-amber-800 mt-1">
                  Our system maintains stock integrity strictly via ledger double entries. 
                  Executing simple bunch decomposition will record the following adjustments:
                </p>

                {selectedBunch && selectedStem ? (
                  <div className="mt-5 space-y-4 text-xs font-medium text-amber-950">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100 shadow-2xs">
                      <div>
                        <span className="text-gray-400 block font-normal">Source Column</span>
                        <strong className="text-gray-900">{selectedBunch.name}</strong>
                      </div>
                      <span className="text-rose-600 font-bold font-mono">-{bunchesToConvert} Bunches</span>
                    </div>

                    <div className="flex justify-center text-amber-400 py-1">
                      <ArrowRightLeft className="rotate-90" size={20} />
                    </div>

                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100 shadow-2xs">
                      <div>
                        <span className="text-gray-400 block font-normal">Target Release</span>
                        <strong className="text-gray-900">{selectedStem.name}</strong>
                      </div>
                      <span className="text-emerald-600 font-bold font-mono">+{stemCountYield} Stems</span>
                    </div>

                    <div className="bg-amber-100/50 p-3 rounded-lg text-[11px] text-amber-900 space-y-1">
                      <p>• Bunch Config: <strong className="font-mono">{selectedBunch.stemCountPerBunch} stems</strong> per bunch.</p>
                      <p>• Estimated Valuation Transfer: <strong className="font-mono">₹{(bunchesToConvert * selectedBunch.costPrice).toFixed(2)}</strong>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 border border-dashed border-amber-300 text-center py-10 rounded-lg text-xs leading-relaxed text-amber-700 font-semibold">
                    Select a Source Bunch and a Target Stem to live-preview the transactional double entries here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SUPPLIERS TAB */}
      {subTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Floral Suppliers & Farms</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage details and compliance of our global eco-farm vendors.</p>
            </div>
            {!isAddingSupplier && (
              <button
                id="btn-add-supplier-toggle"
                onClick={() => setIsAddingSupplier(true)}
                className="flex items-center gap-1 bg-amber-500 text-white px-3.5 py-2 rounded-lg hover:bg-amber-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={16} /> Register Farm
              </button>
            )}
          </div>

          {isAddingSupplier && (
            <form id="form-supplier" onSubmit={handleSupplierSubmit} className="bg-white p-5 rounded-xl border border-amber-200 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-800">Register Supply Farm</h3>
                <button 
                  id="btn-close-supplier"
                  type="button" 
                  onClick={() => setIsAddingSupplier(false)} 
                  className="text-xs text-gray-400 hover:text-gray-700 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Farm Name</label>
                  <input
                    id="supplier-name-input"
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Quito Heights Organic Farms"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Representative</label>
                  <input
                    id="supplier-contact-input"
                    type="text"
                    required
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Isabella Rosales"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <input
                    id="supplier-phone-input"
                    type="text"
                    required
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="+593 992 188 231"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                  <input
                    id="supplier-email-input"
                    type="email"
                    required
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="logistics@quitoheights.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Physical Farm Address</label>
                  <input
                    id="supplier-address-input"
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="Panamerican Highway North Km 82, Cayambe, Ecuador"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  id="btn-submit-supplier"
                  type="submit"
                  className="bg-amber-500 text-white font-bold px-5 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm cursor-pointer shadow-xs"
                >
                  Save Supplier Farm
                </button>
              </div>
            </form>
          )}

          {/* Suppliers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-sm font-display">{s.name}</h3>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">{s.contactName} (Primary Sales)</p>

                  <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <p>Phone: <span className="font-mono font-medium text-gray-800">{s.phone}</span></p>
                    <p>Email: <span className="font-mono text-gray-800">{s.email}</span></p>
                    <p className="line-clamp-2 text-gray-500 leading-normal mt-2 italic">"{s.address}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
