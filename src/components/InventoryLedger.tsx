/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Search, 
  Plus, 
  BookOpen, 
  ArrowDownToLine, 
  AlertTriangle, 
  Edit3,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { InventoryItem, LedgerTransaction, User, ItemType } from '../types';

interface InventoryLedgerProps {
  items: InventoryItem[];
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdatePrices: (itemId: string, cost: number, retail: number, wholesale: number) => void;
  ledger: LedgerTransaction[];
  ledgerBalances: Record<string, number>;
  currentUser: User;
}

type TabType = 'ITEMS' | 'LEDGER';

export default function InventoryLedger({
  items,
  onAddItem,
  onUpdatePrices,
  ledger,
  ledgerBalances,
  currentUser
}: InventoryLedgerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ITEMS');
  const [searchQuery, setSearchQuery] = useState('');

  // Item Creator form states
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemType, setItemType] = useState<ItemType>('STEM');
  const [itemStemCount, setItemStemCount] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(1.50);
  const [itemRetail, setItemRetail] = useState<number>(4.00);
  const [itemWholesale, setItemWholesale] = useState<number>(3.20);
  const [itemMinStock, setItemMinStock] = useState<number>(20);

  // Price Editing quick dialog
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<number>(0);
  const [editRetail, setEditRetail] = useState<number>(0);
  const [editWholesale, setEditWholesale] = useState<number>(0);

  // Ledger filter states
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('ALL');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemSku) return;

    onAddItem({
      name: itemName,
      sku: itemSku,
      type: itemType,
      stemCountPerBunch: itemType === 'BUNCH' ? itemStemCount : undefined,
      costPrice: itemCost,
      retailPrice: itemRetail,
      wholesalePrice: itemWholesale,
      minStockLevel: itemMinStock
    });

    // Resetting states
    setItemName('');
    setItemSku('');
    setItemType('STEM');
    setItemStemCount(10);
    setItemCost(1.50);
    setItemRetail(4.00);
    setItemWholesale(3.20);
    setItemMinStock(20);
    setIsAddingItem(false);
  };

  const handleOpenEditPrice = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditCost(item.costPrice);
    setEditRetail(item.retailPrice);
    setEditWholesale(item.wholesalePrice);
  };

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;
    onUpdatePrices(editingItemId, editCost, editRetail, editWholesale);
    setEditingItemId(null);
  };

  // Searching current catalog
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting ledger logs cronologically
  const filteredLedger = ledger
    .filter(tx => {
      const item = items.find(i => i.id === tx.itemId);
      const matchesSearch = item 
        ? item.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || item.sku.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
        : false;
      const matchesType = ledgerTypeFilter === 'ALL' || tx.type === ledgerTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-1.5 shadow-xs flex select-none max-w-md">
        <button
          id="btn-subtab-items"
          onClick={() => setActiveTab('ITEMS')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'ITEMS' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Package size={16} />
          Catalog Directory
        </button>
        <button
          id="btn-subtab-ledger"
          onClick={() => setActiveTab('LEDGER')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'LEDGER' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <BookOpen size={16} />
          Transactional Ledger
        </button>
      </div>

      {/* RENDER ITEMS TAB */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Floral Inventory & Catalog</h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time stock yields derived entirely from transactional sub-ledgers.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  id="catalog-search"
                  type="text"
                  placeholder="Search SKU or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg w-full sm:w-60 focus:outline-none focus:border-amber-500 bg-gray-50/50"
                />
              </div>

              {!isAddingItem && (
                <button
                  id="btn-add-item-toggle"
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Catalog Item
                </button>
              )}
            </div>
          </div>

          {/* New Catalog form */}
          {isAddingItem && (
            <form id="form-item" onSubmit={handleAddItemSubmit} className="bg-white p-5 rounded-xl border border-amber-200 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-800 text-sm">Add New Catalog Item</h3>
                <button 
                  id="btn-close-item"
                  type="button" 
                  onClick={() => setIsAddingItem(false)} 
                  className="text-xs text-gray-400 hover:text-gray-700 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Item Name</label>
                  <input
                    id="item-name-input"
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    placeholder="e.g. Pink Carnations stem"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Aesthetic UPC / SKU</label>
                  <input
                    id="item-sku-input"
                    type="text"
                    required
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                    placeholder="e.g. STEM-PINK-CARNATION"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Logistics Unit Type</label>
                  <select
                    id="item-type-select"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as ItemType)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="STEM">STEM (Single loose flower)</option>
                    <option value="BUNCH">BUNCH (Sealed farm wrap)</option>
                    <option value="BOUQUET">BOUQUET / PRODUCT (Composite recipe)</option>
                  </select>
                </div>

                {itemType === 'BUNCH' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 uppercase">Stems Count Per Bunch</label>
                    <input
                      id="item-stemcount-input"
                      type="number"
                      required
                      min="1"
                      value={itemStemCount}
                      onChange={(e) => setItemStemCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Estimated purchase cost (₹)</label>
                  <input
                    id="item-cost-input"
                    type="number"
                    step="0.01"
                    required
                    value={itemCost}
                    onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Retail Selling Price (₹)</label>
                  <input
                    id="item-retail-input"
                    type="number"
                    step="0.01"
                    required
                    value={itemRetail}
                    onChange={(e) => setItemRetail(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase font-sans">Wholesale Price (₹)</label>
                  <input
                    id="item-wholesale-input"
                    type="number"
                    step="0.01"
                    required
                    value={itemWholesale}
                    onChange={(e) => setItemWholesale(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Safety Low Alert Limit</label>
                  <input
                    id="item-minstock-input"
                    type="number"
                    required
                    value={itemMinStock}
                    onChange={(e) => setItemMinStock(parseInt(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  id="btn-submit-item"
                  type="submit"
                  className="bg-amber-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-amber-600 cursor-pointer"
                >
                  Create Catalog Record
                </button>
              </div>
            </form>
          )}

          {/* Quick Edit Price modal / form inline overlay */}
          {editingItemId && (
            <form id="form-edit-prices" onSubmit={handleSavePrices} className="bg-amber-50 border border-amber-300 p-5 rounded-xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-amber-950 uppercase">Update catalog margins for: {items.find(i=>i.id===editingItemId)?.name}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-amber-800">Unit Cost Price (₹)</label>
                  <input
                    id="edit-cost-input"
                    type="number"
                    step="0.01"
                    required
                    value={editCost}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-amber-800">Retail Price (₹)</label>
                  <input
                    id="edit-retail-input"
                    type="number"
                    step="0.01"
                    required
                    value={editRetail}
                    onChange={(e) => setEditRetail(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-amber-800">Wholesale Price (₹)</label>
                  <input
                    id="edit-wholesale-input"
                    type="number"
                    step="0.01"
                    required
                    value={editWholesale}
                    onChange={(e) => setEditWholesale(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button 
                  id="btn-cancel-edit"
                  type="button" 
                  onClick={() => setEditingItemId(null)} 
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button 
                  id="btn-submit-edit"
                  type="submit" 
                  className="px-3 py-1.5 bg-amber-500 text-white rounded cursor-pointer font-bold"
                >
                  Save Margins
                </button>
              </div>
            </form>
          )}

          {/* Catalog items Table */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                    <th className="py-3 px-4">Flowers Metadata</th>
                    <th className="py-3 px-4">Sku</th>
                    <th className="py-3 px-4">Logistics Unit</th>
                    <th className="py-3 px-4 text-right">Ledger Stock</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Retail Sell</th>
                    <th className="py-3 px-4 text-right font-sans">Wholesale Sell</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredItems.map(item => {
                    const balance = ledgerBalances[item.id] || 0;
                    const isLow = balance < item.minStockLevel;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/20">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">{item.name}</div>
                          {item.type === 'BUNCH' && (
                            <div className="text-[11px] text-amber-700 font-medium">Bunch holds {item.stemCountPerBunch} single stems</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.type==='STEM' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            item.type==='BUNCH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                          <span className={`font-mono font-bold text-sm ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                            {balance}
                          </span>
                          {isLow && (
                            <span className="inline-block shrink-0 pl-1 text-amber-500 cursor-help" title="Fallen below low limit alert threshold">
                              ⚠️
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">₹{item.costPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">₹{item.retailPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">₹{item.wholesalePrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            id={`btn-edit-item-prices-${item.id}`}
                            onClick={() => handleOpenEditPrice(item)}
                            className="p-1 px-2.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg flex items-center justify-center gap-1 mx-auto cursor-pointer border border-transparent hover:border-amber-200 transition-colors font-semibold"
                          >
                            <Edit3 size={11} /> Prices
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER LEDGER TAB */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Log Audit Double-Entry Ledger</h2>
              <p className="text-xs text-gray-400 mt-0.5">Absolute history logs of all additions, sales, conversions and damages on file.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">Filter</span>
                <select
                  id="ledger-type-filter"
                  value={ledgerTypeFilter}
                  onChange={(e) => setLedgerTypeFilter(e.target.value)}
                  className="p-1 text-xs bg-white rounded border border-gray-200 outline-none"
                >
                  <option value="ALL">ALL ACTIVITIES</option>
                  <option value="PURCHASE">PURCHASES</option>
                  <option value="CONVERSION_IN">CONVERSIONS IN</option>
                  <option value="CONVERSION_OUT">CONVERSIONS OUT</option>
                  <option value="SALE">POS SALES</option>
                  <option value="PRODUCTION_YIELD">PRODUCTION YIELDS</option>
                  <option value="PRODUCTION_CONSUME">PRODUCTION CONSUMED</option>
                  <option value="DAMAGE_WRITE_OFF">DAMAGES</option>
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                <input
                  id="ledger-search"
                  type="text"
                  placeholder="Filter by item..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-250 bg-white rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date Entry</th>
                    <th className="py-3 px-4">Particular Item</th>
                    <th className="py-3 px-4">Ledger Category</th>
                    <th className="py-3 px-4 text-right">Quantity Delta</th>
                    <th className="py-3 px-4 text-right">Cost/Value</th>
                    <th className="py-3 px-4">Audit Reference Notes</th>
                    <th className="py-3 px-4">By Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-450 font-medium">
                        No ledger logs match current audit filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(tx => {
                      const item = items.find(i => i.id === tx.itemId);
                      const isAddition = tx.quantity > 0;

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-mono text-gray-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            <div>{item?.name || 'Deleted Catalog Item'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">Sku: {item?.sku}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block text-[10px] font-bold uppercase rounded border px-1.5 py-0.5 ${
                              tx.type === 'PURCHASE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              tx.type === 'SALE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              tx.type === 'CONVERSION_IN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              tx.type === 'CONVERSION_OUT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              tx.type === 'PRODUCTION_CONSUME' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              tx.type === 'PRODUCTION_YIELD' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isAddition ? `+${tx.quantity}` : tx.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-gray-650">
                            ₹{tx.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 italic text-gray-500 font-sans leading-relaxed max-w-xs truncate">
                            {tx.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-semibold">{tx.createdBy}</td>
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
    </div>
  );
}
