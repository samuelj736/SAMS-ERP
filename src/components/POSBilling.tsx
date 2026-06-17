/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  UserPlus, 
  Trash2, 
  Search, 
  CheckCircle, 
  Percent, 
  CreditCard, 
  DollarSign, 
  Receipt,
  FileText,
  Printer,
  ChevronRight
} from 'lucide-react';
import { InventoryItem, Customer, Sale, User } from '../types';

interface POSBillingProps {
  items: InventoryItem[];
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalSpent'>) => void;
  onRecordSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>) => Sale;
  ledgerBalances: Record<string, number>;
  onConvertBunchesToStems?: (bunchItemId: string, stemItemId: string, bunchesCount: number, notes?: string) => { success: boolean; message: string };
  currentUser: User;
}

export default function POSBilling({
  items,
  customers,
  onAddCustomer,
  onRecordSale,
  ledgerBalances,
  onConvertBunchesToStems,
  currentUser
}: POSBillingProps) {
  // POS States
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number; selectedPrice: number; unitType: 'BUNCH' | 'SINGLE' }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'>('CASH');

  // Selected unit type for BUNCH items in the catalog (key: itemId, value: 'BUNCH' | 'SINGLE')
  const [catalogUnits, setCatalogUnits] = useState<Record<string, 'BUNCH' | 'SINGLE'>>({});

  // Customer Creator Popup
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustType, setNewCustType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  const [newCustDiscount, setNewCustDiscount] = useState<number>(0);

  // Search filter
  const [itemSearch, setItemSearch] = useState('');

  // Finished receipt state to render standard receipt modal
  const [renderedReceipt, setRenderedReceipt] = useState<Sale | null>(null);

  // Status/conversion feedback message banner
  const [conversionMessage, setConversionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Quick decomposition of 1 bunch into single stems
  const handleQuickDecompose = (stemItem: InventoryItem) => {
    setConversionMessage(null);
    const baseSku = stemItem.sku.replace('STEM-', '');
    const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
    if (!matchingBunch) {
      setConversionMessage({ text: `Could not find matching bunch item in database catalog for SKU base: ${baseSku}.`, isError: true });
      return;
    }
    
    const bunchQty = ledgerBalances[matchingBunch.id] || 0;
    if (bunchQty <= 0) {
      setConversionMessage({ text: `Cannot decompose: You have 0 bunches of ${matchingBunch.name} in stock.`, isError: true });
      return;
    }

    if (onConvertBunchesToStems) {
      const res = onConvertBunchesToStems(matchingBunch.id, stemItem.id, 1, 'Quick decomposition in POS Billing terminal');
      if (res.success) {
        setConversionMessage({ text: res.message });
        setTimeout(() => setConversionMessage(prev => prev?.text === res.message ? null : prev), 4000);
      } else {
        setConversionMessage({ text: res.message, isError: true });
      }
    }
  };

  // Retrieve customer context
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerType = activeCustomer ? activeCustomer.type : 'RETAIL';
  const customerDiscount = activeCustomer ? activeCustomer.discountRate : 0;

  // Pricing helper for single stems of BUNCH items
  const getSingleStemPricing = (bunchItem: InventoryItem, custType: 'RETAIL' | 'WHOLESALE') => {
    const baseSku = bunchItem.sku.replace('BUNCH-', '').replace(/-\d+$/, ''); // e.g. "RED-ROSE"
    const matchingStem = items.find(i => i.type === 'STEM' && i.sku.includes(baseSku));
    
    if (matchingStem) {
      return {
        price: custType === 'WHOLESALE' ? matchingStem.wholesalePrice : matchingStem.retailPrice,
        isComputed: false,
        stemItemId: matchingStem.id,
        name: matchingStem.name
      };
    }
    
    const divider = bunchItem.stemCountPerBunch || 10;
    const basePrice = custType === 'WHOLESALE' ? bunchItem.wholesalePrice : bunchItem.retailPrice;
    return {
      price: parseFloat((basePrice / divider).toFixed(2)),
      isComputed: true,
      stemItemId: null,
      name: `${bunchItem.name} (Single)`
    };
  };

  // Add catalog item to cart
  const addToCart = (item: InventoryItem, unitType: 'BUNCH' | 'SINGLE' = 'BUNCH') => {
    const existing = cart.find(c => c.item.id === item.id && c.unitType === unitType);
    const balance = ledgerBalances[item.id] || 0;
    
    // Check if there is enough stock combined across other rows
    const otherRowsBunches = cart
      .filter(c => c.item.id === item.id && c.unitType !== unitType)
      .reduce((sum, c) => {
        if (c.unitType === 'SINGLE') {
          const stems = c.item.stemCountPerBunch || 10;
          return sum + (c.quantity / stems);
        }
        return sum + c.quantity;
      }, 0);

    const currentQtyInThisRow = existing ? existing.quantity : 0;
    const nextQtyInThisRow = currentQtyInThisRow + 1;
    const neededInBunchesForThisRow = unitType === 'SINGLE' ? (nextQtyInThisRow / (item.stemCountPerBunch || 10)) : nextQtyInThisRow;
    
    if (balance < (otherRowsBunches + neededInBunchesForThisRow)) {
      if (unitType === 'SINGLE') {
        const availableStems = Math.floor((balance - otherRowsBunches) * (item.stemCountPerBunch || 10));
        alert(`Insufficient inventory. Available: ${availableStems} single stems.`);
      } else {
        const availableBunches = Math.floor(balance - otherRowsBunches);
        alert(`Insufficient inventory. Available: ${availableBunches} bunches.`);
      }
      return;
    }

    // Determine correct rate depending on retail/wholesale customer type and unitType
    let rate = customerType === 'WHOLESALE' ? item.wholesalePrice : item.retailPrice;
    if (unitType === 'SINGLE' && item.type === 'BUNCH') {
      const stemPricing = getSingleStemPricing(item, customerType);
      rate = stemPricing.price;
    }

    if (existing) {
      setCart(cart.map(c => 
        (c.item.id === item.id && c.unitType === unitType)
          ? { ...c, quantity: nextQtyInThisRow, selectedPrice: rate } 
          : c
      ));
    } else {
      setCart([...cart, { item, quantity: 1, selectedPrice: rate, unitType }]);
    }
  };

  // Update line details
  const updateCartQty = (itemId: string, unitType: 'BUNCH' | 'SINGLE', q: number) => {
    if (q <= 0) {
      setCart(cart.filter(c => !(c.item.id === itemId && c.unitType === unitType)));
      return;
    }

    const target = cart.find(c => c.item.id === itemId && c.unitType === unitType);
    if (!target) return;

    const balance = ledgerBalances[itemId] || 0;
    const otherRowsBunches = cart
      .filter(c => c.item.id === itemId && c.unitType !== unitType)
      .reduce((sum, c) => {
        if (c.unitType === 'SINGLE') {
          const stems = c.item.stemCountPerBunch || 10;
          return sum + (c.quantity / stems);
        }
        return sum + c.quantity;
      }, 0);

    const neededInBunchesForThisRow = unitType === 'SINGLE' ? (q / (target.item.stemCountPerBunch || 10)) : q;
    
    if (balance < (otherRowsBunches + neededInBunchesForThisRow)) {
      if (unitType === 'SINGLE') {
        const maxStems = Math.floor((balance - otherRowsBunches) * (target.item.stemCountPerBunch || 10));
        alert(`Cannot increase. Stock limit: ${maxStems} single stems.`);
      } else {
        const maxBunches = Math.floor(balance - otherRowsBunches);
        alert(`Cannot increase. Stock limit: ${maxBunches} bunches.`);
      }
      return;
    }

    setCart(cart.map(c => 
      (c.item.id === itemId && c.unitType === unitType)
        ? { ...c, quantity: q } 
        : c
    ));
  };

  // Switch row units dynamically within the cart
  const toggleCartRowUnit = (itemId: string, oldUnit: 'BUNCH' | 'SINGLE', newUnit: 'BUNCH' | 'SINGLE') => {
    if (oldUnit === newUnit) return;
    
    const target = cart.find(c => c.item.id === itemId && c.unitType === oldUnit);
    if (!target) return;

    const q = target.quantity;
    const balance = ledgerBalances[itemId] || 0;

    const otherRowsBunches = cart
      .filter(c => !(c.item.id === itemId && c.unitType === oldUnit))
      .reduce((sum, c) => {
        if (c.unitType === 'SINGLE') {
          const stems = c.item.stemCountPerBunch || 10;
          return sum + (c.quantity / stems);
        }
        return sum + c.quantity;
      }, 0);

    const neededInBunchesForNewRow = newUnit === 'SINGLE' 
      ? (q / (target.item.stemCountPerBunch || 10)) 
      : q;

    if (balance < (otherRowsBunches + neededInBunchesForNewRow)) {
      alert("Insufficient stock to change billing unit on this item quantity.");
      return;
    }

    let rate = customerType === 'WHOLESALE' ? target.item.wholesalePrice : target.item.retailPrice;
    if (newUnit === 'SINGLE' && target.item.type === 'BUNCH') {
      const stemPricing = getSingleStemPricing(target.item, customerType);
      rate = stemPricing.price;
    }

    const existingNewUnitRow = cart.find(c => c.item.id === itemId && c.unitType === newUnit);
    if (existingNewUnitRow) {
      setCart(cart
        .filter(c => !(c.item.id === itemId && c.unitType === oldUnit))
        .map(c => 
          (c.item.id === itemId && c.unitType === newUnit)
            ? { ...c, quantity: c.quantity + q, selectedPrice: rate }
            : c
        )
      );
    } else {
      setCart(cart.map(c => 
        (c.item.id === itemId && c.unitType === oldUnit)
          ? { ...c, unitType: newUnit, selectedPrice: rate }
          : c
      ));
    }
  };

  // Remove cart row
  const removeRow = (itemId: string, unitType: 'BUNCH' | 'SINGLE') => {
    setCart(cart.filter(c => !(c.item.id === itemId && c.unitType === unitType)));
  };

  // Pricing math
  const cartSubtotal = cart.reduce((sum, c) => sum + (c.quantity * c.selectedPrice), 0);
  const discountAmount = (cartSubtotal * customerDiscount) / 100;
  const taxableBasis = cartSubtotal - discountAmount;
  const taxAmount = taxableBasis * 0.0825; // 8.25% sales tax standard
  const cartTotal = taxableBasis + taxAmount;

  // Submit and check out
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const saleItems = cart.map(c => ({
      itemId: c.item.id,
      name: c.unitType === 'SINGLE' && c.item.type === 'BUNCH' ? `${c.item.name} (Single Stems)` : c.item.name,
      type: c.item.type,
      quantity: c.quantity,
      unitPrice: c.selectedPrice,
      discount: customerDiscount,
      billingUnit: c.unitType
    }));

    const finalSale = onRecordSale({
      customerId: selectedCustomerId || undefined,
      customerType,
      items: saleItems,
      subtotal: cartSubtotal,
      discountAmount,
      taxAmount,
      totalAmount: cartTotal,
      paymentMethod,
      createdBy: currentUser.name
    });

    setRenderedReceipt(finalSale);
    // Reset Cart
    setCart([]);
    setSelectedCustomerId('');
  };

  // Trigger quick rate reload whenever customer type swaps
  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const targetCust = customers.find(c => c.id === id);
    const resolvedType = targetCust ? targetCust.type : 'RETAIL';
    
    // Automatically update existing line item prices based on wholesaling criteria
    setCart(prev => prev.map(row => {
      let properPrice = resolvedType === 'WHOLESALE' ? row.item.wholesalePrice : row.item.retailPrice;
      if (row.unitType === 'SINGLE' && row.item.type === 'BUNCH') {
        properPrice = getSingleStemPricing(row.item, resolvedType).price;
      }
      return { ...row, selectedPrice: properPrice };
    }));
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    onAddCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || undefined,
      type: newCustType,
      discountRate: newCustDiscount
    });

    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustType('RETAIL');
    setNewCustDiscount(0);
    setIsAddingCustomer(false);
  };

  // Search items catalog filter
  const filteredCatalog = items.filter(item => {
    const isMatched = item.name.toLowerCase().includes(itemSearch.toLowerCase()) || item.sku.toLowerCase().includes(itemSearch.toLowerCase());
    if (!isMatched) return false;
    
    // Positive balance on the item itself
    const balance = ledgerBalances[item.id] || 0;
    if (balance > 0) return true;

    // Show STEM items whose parent BUNCH has stock ready for breakdown
    if (item.type === 'STEM') {
      const baseSku = item.sku.replace('STEM-', '');
      const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
      const bunchBal = matchingBunch ? (ledgerBalances[matchingBunch.id] || 0) : 0;
      if (bunchBal > 0) return true;
    }
    return false;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Flower shopping catalog selector */}
      <div className="lg:col-span-7 space-y-4">
        {conversionMessage && (
          <div className={`p-3 rounded-lg text-xs font-semibold flex justify-between items-center border ${conversionMessage.isError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-250'}`}>
            <span>{conversionMessage.text}</span>
            <button className="text-gray-400 hover:text-gray-600 font-bold ml-2 font-mono cursor-pointer" type="button" onClick={() => setConversionMessage(null)}>✕</button>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
              <ShoppingCart className="text-amber-500" size={18} />
              Stock Terminal
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Pick available floral rows to log POS customer sale items</p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            <input
              id="pos-search"
              type="text"
              placeholder="Filter flowers..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 w-44"
            />
          </div>
        </div>

        {/* Flower select buttons list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredCatalog.length === 0 ? (
            <div className="sm:col-span-2 text-center py-12 bg-gray-50 border border-dashed rounded-lg text-gray-400 text-xs">
              No floral stock listed in inventory. Restock stems or produce bouquets first.
            </div>
          ) : (
            filteredCatalog.map(item => {
              const balance = ledgerBalances[item.id] || 0;
              const selectedUnit = catalogUnits[item.id] || 'BUNCH';
              
              let displayPrice = customerType === 'WHOLESALE' ? item.wholesalePrice : item.retailPrice;
              let displayBalance = `${balance} ${item.type === 'BUNCH' ? 'bunches' : item.type === 'STEM' ? 'stems' : 'pcs'}`;
              
              if (item.type === 'BUNCH' && selectedUnit === 'SINGLE') {
                const stemPricing = getSingleStemPricing(item, customerType);
                displayPrice = stemPricing.price;
                const multiplier = item.stemCountPerBunch || 10;
                displayBalance = `${Math.floor(balance * multiplier)} stems`;
              }

              return (
                <div
                  id={`block-catalog-card-${item.id}`}
                  key={item.id}
                  onClick={() => addToCart(item, item.type === 'BUNCH' ? selectedUnit : 'BUNCH')}
                  className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-amber-400 text-left transition-all hover:shadow-xs group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-gray-800 text-xs leading-relaxed group-hover:text-amber-600 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[9px] font-mono font-semibold bg-gray-50 px-1 py-0.5 rounded text-gray-400">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">SKU: {item.sku}</span>

                    {/* Unit Selector strictly for BUNCH types */}
                    {item.type === 'BUNCH' && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Unit:</span>
                        <div className="flex bg-gray-150 rounded-md p-0.5 w-32 border border-gray-200">
                          <button
                            id={`btn-unit-bunch-${item.id}`}
                            type="button"
                            onClick={() => setCatalogUnits(prev => ({ ...prev, [item.id]: 'BUNCH' }))}
                            className={`flex-1 text-[9px] font-extrabold text-center py-0.5 rounded transition-all cursor-pointer ${
                              selectedUnit === 'BUNCH'
                                ? 'bg-amber-500 text-white shadow-3xs'
                                : 'text-gray-400 hover:text-gray-600 font-semibold'
                            }`}
                          >
                            Bunch
                          </button>
                          <button
                            id={`btn-unit-single-${item.id}`}
                            type="button"
                            onClick={() => setCatalogUnits(prev => ({ ...prev, [item.id]: 'SINGLE' }))}
                            className={`flex-1 text-[9px] font-extrabold text-center py-0.5 rounded transition-all cursor-pointer ${
                              selectedUnit === 'SINGLE'
                                ? 'bg-amber-500 text-white shadow-3xs'
                                : 'text-gray-400 hover:text-gray-600 font-semibold'
                            }`}
                          >
                            Single
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Decompose Helper strictly for STEM types */}
                    {item.type === 'STEM' && (() => {
                      const baseSku = item.sku.replace('STEM-', '');
                      const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
                      const bunchBal = matchingBunch ? (ledgerBalances[matchingBunch.id] || 0) : 0;
                      if (matchingBunch && bunchBal > 0) {
                        return (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded leading-none">
                              {bunchBal} Bunch{bunchBal > 1 ? 'es' : ''} in stock
                            </div>
                            <button
                              id={`btn-quick-decomp-${item.id}`}
                              type="button"
                              onClick={() => handleQuickDecompose(item)}
                              className="text-[9px] bg-amber-500 hover:bg-amber-600 font-bold text-white px-2 py-1 rounded-md transition-colors shadow-3xs cursor-pointer leading-none"
                            >
                              Decompose 1 Bunch (+{matchingBunch.stemCountPerBunch || 10} stems)
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex justify-between items-end mt-4 w-full">
                    <span className="text-[10px] bg-slate-50 border px-1.5 py-0.5 rounded font-mono font-bold text-slate-600 whitespace-nowrap">
                      {displayBalance}
                    </span>
                    <strong className="text-gray-900 text-sm font-mono flex items-baseline gap-0.5">
                      ₹{displayPrice.toFixed(2)}
                      <span className="text-[9px] text-gray-400 font-normal">/{item.type === 'BUNCH' && selectedUnit === 'BUNCH' ? 'bch' : 'stem'}</span>
                    </strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart, Checkout, and Customers Section */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-200/80 shadow-md flex flex-col">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 text-sm font-display flex items-center justify-between">
          <span>Billing Register Card</span>
          <span className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-bold">
            {cart.reduce((sum, c) => sum + c.quantity, 0)} items
          </span>
        </h3>

        {/* Customer select row */}
        <div className="mt-4 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Active Customer</label>
            {!isAddingCustomer ? (
              <button
                id="btn-add-customer-toggle"
                onClick={() => setIsAddingCustomer(true)}
                className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 hover:text-amber-700 cursor-pointer"
              >
                <UserPlus size={12} /> New Customer
              </button>
            ) : (
              <button
                id="btn-close-customer"
                onClick={() => setIsAddingCustomer(false)}
                className="text-[10px] font-bold text-rose-500 cursor-pointer"
              >
                Close form
              </button>
            )}
          </div>

          {isAddingCustomer && (
            <form onSubmit={handleCustomerSubmit} className="mb-4 bg-gray-50 border p-3 rounded-lg space-y-3 shadow-2xs">
              <h4 className="text-[11px] font-bold text-gray-700">Add Customer Account</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="customer-name-input"
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="p-1.5 bg-white border rounded text-xs"
                />
                <input
                  id="customer-phone-input"
                  type="text"
                  required
                  placeholder="Phone"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="p-1.5 bg-white border rounded text-xs"
                />
                <input
                  id="customer-email-input"
                  type="email"
                  placeholder="Email (Optional)"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="p-1.5 bg-white border rounded text-xs col-span-2"
                />
                <select
                  id="customer-type-select"
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as 'RETAIL' | 'WHOLESALE')}
                  className="p-1.5 bg-white border rounded text-xs"
                >
                  <option value="RETAIL">Retail Pricing Choice</option>
                  <option value="WHOLESALE">Wholesale Pricing Choice</option>
                </select>
                <input
                  id="customer-discount-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Discount %"
                  value={newCustDiscount}
                  onChange={(e) => setNewCustDiscount(parseInt(e.target.value) || 0)}
                  className="p-1.5 bg-white border rounded text-xs font-mono"
                />
              </div>
              <button id="btn-save-customer" type="submit" className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-xs cursor-pointer">
                Save Customer profile
              </button>
            </form>
          )}

          <select
            id="pos-customer-select"
            value={selectedCustomerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full p-2 bg-gray-50 border rounded-lg text-xs"
          >
            <option value="">-- Guest Walk-in / Unregistered --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.type} • {c.discountRate}% discount)</option>
            ))}
          </select>
        </div>

        {/* Cart Rows List */}
        <div className="my-4 flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              Shopping cart context is currently empty. Select flowers on the left.
            </div>
          ) : (
            cart.map(row => {
              const uniqueRowId = `${row.item.id}-${row.unitType}`;
              return (
                <div key={uniqueRowId} className="flex justify-between items-center p-2.5 bg-gray-50 border rounded-lg">
                  <div className="space-y-1 select-none flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-gray-800 text-xs">{row.item.name}</h4>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                        row.unitType === 'SINGLE' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {row.unitType === 'SINGLE' ? 'Single Stem' : 'Bunch'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        ₹{row.selectedPrice.toFixed(2)} / {row.unitType === 'SINGLE' ? 'stem' : 'bch'}
                      </span>

                      {/* Dropdown switch to toggle billing unit type directly in the cart row */}
                      {row.item.type === 'BUNCH' && (
                        <select
                          id={`select-rowunit-${uniqueRowId}`}
                          value={row.unitType}
                          onChange={(e) => {
                            const val = e.target.value as 'BUNCH' | 'SINGLE';
                            toggleCartRowUnit(row.item.id, row.unitType, val);
                          }}
                          className="text-[9px] bg-white border border-gray-200 rounded px-1 py-0.5 font-bold text-gray-600 focus:outline-none"
                        >
                          <option value="BUNCH">As Bunch</option>
                          <option value="SINGLE">As Single</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border rounded-md p-0.5">
                      <button
                        id={`btn-qty-dec-${uniqueRowId}`}
                        type="button"
                        onClick={() => updateCartQty(row.item.id, row.unitType, row.quantity - 1)}
                        className="px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 rounded font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono px-1.5 text-gray-800">{row.quantity}</span>
                      <button
                        id={`btn-qty-inc-${uniqueRowId}`}
                        type="button"
                        onClick={() => updateCartQty(row.item.id, row.unitType, row.quantity + 1)}
                        className="px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 rounded font-bold"
                      >
                        +
                      </button>
                    </div>

                    <strong className="text-gray-900 font-mono text-xs w-16 text-right font-bold">
                      ₹{(row.quantity * row.selectedPrice).toFixed(2)}
                    </strong>

                    <button
                      id={`btn-remove-cart-${uniqueRowId}`}
                      type="button"
                      onClick={() => removeRow(row.item.id, row.unitType)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pricing Totals Card */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-medium text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">₹{cartSubtotal.toFixed(2)}</span>
          </div>

          {customerDiscount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="flex items-center gap-1 font-semibold">
                <Percent size={12} /> Discount ({customerDiscount}%):
              </span>
              <span className="font-mono font-bold">-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Govt GST (8.25%):</span>
            <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-gray-900 font-bold border-t border-dashed border-gray-200 pt-2 text-sm">
            <span>Grand Total Due:</span>
            <span className="font-mono text-amber-600">₹{cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <form onSubmit={handleCheckout} className="mt-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['CASH', 'CARD', 'BANK_TRANSFER', 'CREDIT'] as const).map(method => (
                <button
                  id={`btn-paymethod-${method}`}
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentMethod === method 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                      : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-process-checkout"
            type="submit"
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
          >
            <CheckCircle size={16} /> Mark Paid & Print Invoice
          </button>
        </form>
      </div>

      {/* PRINT MOCK RECEIPT MODAL */}
      {renderedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-gray-200 mt-10 shadow-2xl relative space-y-4">
            {/* Close */}
            <button
              id="btn-dismiss-receipt"
              onClick={() => setRenderedReceipt(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer text-sm font-bold"
            >
              ✕ Dismiss
            </button>

            {/* Receipt Content */}
            <div className="text-center font-sans">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-wide uppercase font-display">Floral Chain ERP</h2>
              <p className="text-[11px] text-gray-500">102 Fresh Blossom Boulevard, California</p>
              <p className="text-[11px] text-gray-500">Tel: +1 (555) 123-Blossom</p>
              
              <div className="border-t border-b border-dashed border-gray-300 py-2.5 my-3 text-left space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Invoice Number:</span>
                  <strong className="font-mono">#INV-{renderedReceipt.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{new Date(renderedReceipt.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client type:</span>
                  <span className="font-bold text-gray-700">{renderedReceipt.customerType}</span>
                </div>
                {activeCustomer && (
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <span className="font-semibold text-amber-700">{activeCustomer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Cashier Counter:</span>
                  <span>{renderedReceipt.createdBy}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-left my-4 text-xs">
                <h4 className="font-bold text-gray-800 uppercase text-[10px] border-b pb-1">Particulars</h4>
                {renderedReceipt.items.map((line, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{line.name}</h4>
                      <p className="text-[10px] text-gray-400">{line.quantity} × ₹{line.unitPrice.toFixed(2)}</p>
                    </div>
                    <strong className="font-mono text-gray-800">₹{(line.quantity * line.unitPrice).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              {/* Accounting details */}
              <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-right text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{renderedReceipt.subtotal.toFixed(2)}</span>
                </div>
                {renderedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discounted adjustment:</span>
                    <span className="font-mono">-₹{renderedReceipt.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (8.25%):</span>
                  <span className="font-mono">₹{renderedReceipt.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1.5 border-t text-gray-900 border-gray-200">
                  <span>Grand Total Paid ({renderedReceipt.paymentMethod}):</span>
                  <span className="font-mono text-emerald-700">₹{renderedReceipt.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Fake barcode */}
              <div className="flex flex-col items-center justify-center pt-6 space-y-2">
                <div className="h-10 w-2/3 bg-gray-900 flex justify-around p-1 rounded-sm overflow-hidden border border-gray-500 opacity-80">
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-0.5 h-full bg-white"></div>
                  <div className="w-2 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-0.5 h-full bg-white"></div>
                  <div className="w-3 h-full bg-white"></div>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-gray-400">#FC-{renderedReceipt.invoiceNumber}#</span>
              </div>

              <div className="text-center pt-5 text-[10px] font-medium text-gray-400 italic">
                Thank you for shopping at Lourd Flowers eco wholesale! Let love grow.
              </div>
            </div>

            <button
              id="btn-print-receipt"
              onClick={() => {
                alert("Triggering thermal receipt printer stream... Done!");
                setRenderedReceipt(null);
              }}
              className="w-full py-2 bg-amber-500 text-white rounded-lg font-bold text-xs hover:bg-amber-600 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <Printer size={13} /> Close and Print Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
