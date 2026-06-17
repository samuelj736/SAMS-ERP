/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Wrench, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Recipe, InventoryItem, ProductionLog, User } from '../types';

interface BOMProductionProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  productionLogs: ProductionLog[];
  onProduceBouquet: (recipeId: string, quantity: number, notes?: string) => { success: boolean; message: string };
  items: InventoryItem[];
  ledgerBalances: Record<string, number>;
  onConvertBunchesToStems?: (bunchItemId: string, stemItemId: string, bunchesCount: number, notes?: string) => { success: boolean; message: string };
  currentUser: User;
}

type TabType = 'RECIPES' | 'PRODUCTION';

export default function BOMProduction({
  recipes,
  onAddRecipe,
  productionLogs,
  onProduceBouquet,
  items,
  ledgerBalances,
  onConvertBunchesToStems,
  currentUser
}: BOMProductionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('PRODUCTION');
  const [productionNotes, setProductionNotes] = useState('');

  // Recipe Creator Form states
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeSku, setRecipeSku] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [recipeLabor, setRecipeLabor] = useState<number>(10.00);
  const [recipeRetail, setRecipeRetail] = useState<number>(45.00);
  const [recipeWholesale, setRecipeWholesale] = useState<number>(38.00);
  const [components, setComponents] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: '', quantity: 1 }
  ]);

  // Production Execution states
  const [isProducing, setIsProducing] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [productionQty, setProductionQty] = useState<number>(1);
  const [productionStatus, setProductionStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Filter components search lists (STEM items only are consumed in recipes)
  const stemItems = items.filter(item => item.type === 'STEM');

  // Add component row in Recipe form
  const addComponentRow = () => {
    setComponents([...components, { itemId: '', quantity: 1 }]);
  };

  // Remove component row
  const removeComponentRow = (index: number) => {
    if (components.length === 1) return;
    setComponents(components.filter((_, idx) => idx !== index));
  };

  // Update component item
  const updateComponentRow = (index: number, field: 'itemId' | 'quantity', value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  // Submit Recipe form
  const handleRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName || !recipeSku) return;

    // Filter valid parts
    const validParts = components.filter(c => c.itemId && c.quantity > 0);
    if (validParts.length === 0) {
      alert("Please provide at least one flower ingredient stem.");
      return;
    }

    onAddRecipe({
      name: recipeName,
      sku: recipeSku,
      description: recipeDesc,
      items: validParts,
      laborCost: recipeLabor,
      retailPrice: recipeRetail,
      wholesalePrice: recipeWholesale
    });

    // Resetting form
    setRecipeName('');
    setRecipeSku('');
    setRecipeDesc('');
    setRecipeLabor(10.00);
    setRecipeRetail(45.00);
    setRecipeWholesale(38.00);
    setComponents([{ itemId: '', quantity: 1 }]);
    setIsAddingRecipe(false);
  };

  // Submit Production
  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId || productionQty <= 0) return;

    const outcome = onProduceBouquet(selectedRecipeId, productionQty, productionNotes);
    setProductionStatus(outcome);
    if (outcome.success) {
      setProductionNotes('');
      setProductionQty(1);
      // Wait for a bit then close draft
      setTimeout(() => {
        setIsProducing(false);
        setProductionStatus(null);
      }, 2000);
    }
  };

  // Convert bunch for shortage
  const handleDecomposeBunchForShortage = (stemItemId: string, bunchesCount: number) => {
    setProductionStatus(null);
    const stemItem = items.find(i => i.id === stemItemId);
    if (!stemItem) return;

    const baseSku = stemItem.sku.replace('STEM-', '');
    const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
    if (!matchingBunch) {
      setProductionStatus({ success: false, message: `Could not find parent bunch for stem type: ${stemItem.name}` });
      return;
    }

    if (onConvertBunchesToStems) {
      const res = onConvertBunchesToStems(matchingBunch.id, stemItemId, bunchesCount, `Decomposed to resolve shortages for manufacturing run of recipe`);
      setProductionStatus(res);
    }
  };

  // Auto resolve all shortages
  const handleAutoResolveAllShortages = () => {
    if (!selectedRecipeForRun) return;
    setProductionStatus(null);
    let logs: string[] = [];
    let hadError = false;

    selectedRecipeForRun.items.forEach(part => {
      const stemItem = items.find(i => i.id === part.itemId);
      if (!stemItem) return;

      const requiredCount = part.quantity * productionQty;
      const availableCount = ledgerBalances[stemItem.id] || 0;
      if (availableCount < requiredCount) {
        const missing = requiredCount - availableCount;
        const baseSku = stemItem.sku.replace('STEM-', '');
        const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
        if (matchingBunch) {
          const stemsPerBunch = matchingBunch.stemCountPerBunch || 10;
          const bunchBal = ledgerBalances[matchingBunch.id] || 0;
          const neededBunches = Math.ceil(missing / stemsPerBunch);
          const decompQty = Math.min(bunchBal, neededBunches);

          if (decompQty > 0 && onConvertBunchesToStems) {
            const res = onConvertBunchesToStems(matchingBunch.id, stemItem.id, decompQty, `Auto-resolved shortage for manufacturing of ${selectedRecipeForRun.name}`);
            if (res.success) {
              logs.push(`Decomposed ${decompQty} bunch${decompQty > 1 ? 'es' : ''} of ${matchingBunch.name} (+${decompQty * stemsPerBunch} stems)`);
            } else {
              hadError = true;
              logs.push(`Error decomposing ${matchingBunch.name}: ${res.message}`);
            }
          }
        }
      }
    });

    if (logs.length > 0) {
      setProductionStatus({
        success: !hadError,
        message: logs.join('. ')
      });
    } else {
      setProductionStatus({
        success: false,
        message: "No resolvable shortages with matching parent bunch stock found."
      });
    }
  };

  // Live preview calculations for production constraints
  const selectedRecipeForRun = recipes.find(r => r.id === selectedRecipeId);

  // Check stem shortages
  const checkRecipeShortage = (recipe: Recipe, runQty: number) => {
    const shortages: { itemName: string; required: number; available: number; missing: number }[] = [];
    recipe.items.forEach(component => {
      const dbItem = items.find(i => i.id === component.itemId);
      if (dbItem) {
        const available = ledgerBalances[dbItem.id] || 0;
        const required = component.quantity * runQty;
        if (available < required) {
          shortages.push({
            itemName: dbItem.name,
            required,
            available,
            missing: required - available
          });
        }
      }
    });
    return shortages;
  };

  const shortagesForRun = selectedRecipeForRun 
    ? checkRecipeShortage(selectedRecipeForRun, productionQty) 
    : [];

  const laborCostSumForRun = selectedRecipeForRun 
    ? selectedRecipeForRun.laborCost * productionQty 
    : 0;

  const stemCostsSumForRun = selectedRecipeForRun
    ? selectedRecipeForRun.items.reduce((sum, part) => {
        const dbItem = items.find(i => i.id === part.itemId);
        return sum + (dbItem ? dbItem.costPrice * part.quantity : 0);
      }, 0) * productionQty
    : 0;

  const runTotalCost = laborCostSumForRun + stemCostsSumForRun;

  return (
    <div className="space-y-6">
      {/* Sub tabs selectors */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-1.5 shadow-xs flex select-none max-w-md">
        <button
          id="btn-subtab-production"
          onClick={() => { setActiveTab('PRODUCTION'); setProductionStatus(null); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'PRODUCTION' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Wrench size={16} />
          Active Florist Station
        </button>
        <button
          id="btn-subtab-recipes"
          onClick={() => { setActiveTab('RECIPES'); setProductionStatus(null); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'RECIPES' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Layers size={16} />
          BOM Layouts Recipe (({recipes.length}))
        </button>
      </div>

      {/* RENDER PRODUCTION Logs TAB */}
      {activeTab === 'PRODUCTION' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Active Florist Production Station</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manufacture flower products from recipes by atomically consuming component stems.</p>
            </div>
            {!isProducing && (
              <button
                id="btn-produce-toggle"
                onClick={() => {
                  setIsProducing(true);
                  setProductionStatus(null);
                }}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Manufacture Bouquet Batch
              </button>
            )}
          </div>

          {isProducing && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Output Form */}
              <form onSubmit={handleProductionSubmit} className="lg:col-span-7 bg-white p-6 rounded-xl border border-amber-200 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    Trigger Production Run
                  </h3>
                  <button
                    id="btn-close-production"
                    type="button"
                    onClick={() => {
                      setIsProducing(false);
                      setProductionStatus(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {productionStatus && (
                  <div className={`p-4 rounded-lg text-xs font-semibold ${productionStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    {productionStatus.message}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Select Bouquet Arrangement Recipe</label>
                    <select
                      id="production-recipe-select"
                      required
                      value={selectedRecipeId}
                      onChange={(e) => {
                        setSelectedRecipeId(e.target.value);
                        setProductionStatus(null);
                      }}
                      className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">-- Choose Recipe --</option>
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase font-sans">Manufactured Quantity</label>
                    <input
                      id="production-qty-input"
                      type="number"
                      required
                      min="1"
                      value={productionQty}
                      onChange={(e) => {
                        setProductionQty(Math.max(1, parseInt(e.target.value) || 1));
                        setProductionStatus(null);
                      }}
                      className="w-32 mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Production & Supervisor Notes</label>
                    <input
                      id="production-notes-input"
                      type="text"
                      placeholder="e.g. Preparing wedding batch deliveries..."
                      value={productionNotes}
                      onChange={(e) => setProductionNotes(e.target.value)}
                      className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  <div className="text-xs text-gray-500 font-semibold font-mono">
                    Supervisor: <strong className="text-gray-800">{currentUser.name}</strong>
                  </div>
                  <button
                    id="btn-submit-production"
                    type="submit"
                    disabled={!selectedRecipeId || shortagesForRun.length > 0}
                    className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm shadow-xs disabled:opacity-40"
                  >
                    Approve & Run Florist Assembly
                  </button>
                </div>
              </form>

              {/* Live constraint calculator */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                  <h4 className="font-bold text-amber-950 text-sm">Realitime Audit Details</h4>

                  {selectedRecipeForRun ? (
                    <div className="mt-4 space-y-4 text-xs">
                      <div>
                        <span className="text-amber-800 font-semibold leading-relaxed">Arrangement Ingredients list constraints for quantity {productionQty}:</span>
                        
                        <div className="mt-3.5 space-y-2">
                          {selectedRecipeForRun.items.map(part => {
                            const stemItem = items.find(i => i.id === part.itemId);
                            const requiredCount = part.quantity * productionQty;
                            const availableCount = stemItem ? (ledgerBalances[stemItem.id] || 0) : 0;
                            const isShortage = availableCount < requiredCount;

                            // Calculate parent bunch stock availability
                            let parentBunchBadge = null;
                            if (isShortage && stemItem) {
                              const baseSku = stemItem.sku.replace('STEM-', '');
                              const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
                              const bunchBal = matchingBunch ? (ledgerBalances[matchingBunch.id] || 0) : 0;
                              if (matchingBunch && bunchBal > 0) {
                                const missing = requiredCount - availableCount;
                                const stemsPerBunch = matchingBunch.stemCountPerBunch || 10;
                                const neededBunches = Math.ceil(missing / stemsPerBunch);
                                const decompQty = Math.min(bunchBal, neededBunches);
                                parentBunchBadge = (
                                  <div className="mt-2.5 text-left bg-emerald-50/70 p-2 rounded-lg border border-emerald-155 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] text-emerald-800 font-medium">
                                      💡 Stocked: {bunchBal} bunch{bunchBal > 1 ? 'es' : ''} of {matchingBunch.name} available
                                    </span>
                                    <button
                                      id={`btn-shortage-decomp-${part.itemId}`}
                                      type="button"
                                      onClick={() => handleDecomposeBunchForShortage(part.itemId, decompQty)}
                                      className="text-[9px] bg-amber-500 hover:bg-amber-600 font-bold text-white px-2 py-1 rounded transition-colors cursor-pointer leading-none"
                                    >
                                      Decompose {decompQty} bunch{decompQty > 1 ? 'es' : ''} (+{decompQty * stemsPerBunch} stems)
                                    </button>
                                  </div>
                                );
                              }
                            }

                            return (
                              <div key={part.itemId} className="p-2.5 rounded-lg bg-white border border-amber-100 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-semibold text-gray-800">{stemItem?.name}</span>
                                    <span className="text-[10px] text-gray-400 block font-mono">Need: {part.quantity} per unit • Total: {requiredCount}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`block font-mono font-bold ${isShortage ? 'text-red-600' : 'text-emerald-700'}`}>
                                      {availableCount} Available
                                    </span>
                                    {isShortage && (
                                      <span className="block text-[10px] text-red-500 font-bold font-mono">Missing: {requiredCount - availableCount}</span>
                                    )}
                                  </div>
                                </div>
                                {parentBunchBadge}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cost projections */}
                      <div className="pt-3 border-t border-amber-200 space-y-2 mt-4 text-amber-900 font-medium">
                        <div className="flex justify-between">
                          <span>Total Stems COGS:</span>
                          <span className="font-mono font-bold">₹{stemCostsSumForRun.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Staff Labor Cost:</span>
                          <span className="font-mono font-bold">₹{laborCostSumForRun.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-amber-300 font-bold text-sm text-amber-950">
                          <span>Cumulative Cost Price:</span>
                          <span className="font-mono">₹{runTotalCost.toFixed(2)}</span>
                        </div>
                      </div>

                      {shortagesForRun.length > 0 && (() => {
                        const hasResolvableShortages = selectedRecipeForRun.items.some(part => {
                          const stemItem = items.find(i => i.id === part.itemId);
                          if (!stemItem) return false;
                          const requiredCount = part.quantity * productionQty;
                          const availableCount = ledgerBalances[stemItem.id] || 0;
                          if (availableCount >= requiredCount) return false;

                          const baseSku = stemItem.sku.replace('STEM-', '');
                          const matchingBunch = items.find(i => i.type === 'BUNCH' && i.sku.includes(baseSku));
                          return matchingBunch && (ledgerBalances[matchingBunch.id] || 0) > 0;
                        });

                        return (
                          <div className="bg-red-50 text-red-800 border border-red-200 p-3.5 rounded-lg text-[11px] leading-relaxed font-semibold space-y-2.5">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                              <span>Insufficient stems in stock to support this production run. Please convert more Bunches to Stems first!</span>
                            </div>
                            {hasResolvableShortages && (
                              <div className="pt-2 border-t border-red-150 flex justify-end">
                                <button
                                  id="btn-autoresolve-production"
                                  type="button"
                                  onClick={handleAutoResolveAllShortages}
                                  className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white text-[10px] px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-3xs uppercase tracking-wider"
                                >
                                  ⚡ Auto-Resolve Stem Shortages
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      Select an assembly recipe to compute real-time stem shortages and financial run costs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Logs List */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Arrangement Production Run Log</h3>
              <span className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                {productionLogs.length} runs recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date Run</th>
                    <th className="py-3 px-4">Yield Arrangement</th>
                    <th className="py-3 px-4 text-center">Batch Quantity</th>
                    <th className="py-3 px-4">Supervisor Florist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {productionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        No production batches logged. Click "Manufacture Bouquet Batch" to create.
                      </td>
                    </tr>
                  ) : (
                    productionLogs.map((log) => {
                      const rec = recipes.find(r => r.id === log.recipeId);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/30">
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-800">{rec?.name || 'Unknown Bouquet'}</div>
                            <div className="text-xs text-gray-400 font-mono">Derived from Recipe: {rec?.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded font-mono">
                              +{log.quantityProduced} Bouquets
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
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
      )}

      {/* RENDER RECIPES BOM PANEL */}
      {activeTab === 'RECIPES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">BOM Arrangement Blueprints</h2>
              <p className="text-xs text-gray-500 mt-0.5">Specify layout details, labor rates, and component stems for flower arrangements.</p>
            </div>
            {!isAddingRecipe && (
              <button
                id="btn-add-recipe-toggle"
                onClick={() => setIsAddingRecipe(true)}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-2 rounded-lg hover:bg-amber-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={16} /> Define Recipe
              </button>
            )}
          </div>

          {isAddingRecipe && (
            <form id="form-recipe" onSubmit={handleRecipeSubmit} className="bg-white p-6 rounded-xl border border-amber-200 shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-800">Add Arrangement Recipe Layout</h3>
                <button
                  id="btn-close-recipe"
                  type="button"
                  onClick={() => setIsAddingRecipe(false)}
                  className="text-xs text-rose-500 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Recipe Name</label>
                  <input
                    id="recipe-name-input"
                    type="text"
                    required
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g. Royal Bridal Crown Lavender"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase font-sans">Arrangement SKU</label>
                  <input
                    id="recipe-sku-input"
                    type="text"
                    required
                    value={recipeSku}
                    onChange={(e) => setRecipeSku(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    placeholder="e.g. BOUQ-ROYAL-CROWN"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Aesthetic Description</label>
                  <input
                    id="recipe-desc-input"
                    type="text"
                    value={recipeDesc}
                    onChange={(e) => setRecipeDesc(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="Fine descriptive text displayed to clients..."
                  />
                </div>
              </div>

              {/* Financials segment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 uppercase">Labor Charge (₹)</label>
                  <input
                    id="recipe-labor-input"
                    type="number"
                    step="0.01"
                    required
                    value={recipeLabor}
                    onChange={(e) => setRecipeLabor(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 uppercase">Retail Price (₹)</label>
                  <input
                    id="recipe-retail-input"
                    type="number"
                    step="0.01"
                    required
                    value={recipeRetail}
                    onChange={(e) => setRecipeRetail(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 uppercase font-sans">Wholesale Price (₹)</label>
                  <input
                    id="recipe-wholesale-input"
                    type="number"
                    step="0.01"
                    required
                    value={recipeWholesale}
                    onChange={(e) => setRecipeWholesale(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1.5 p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Components repeater */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Required Stem Ingredients</label>
                  <button
                    id="btn-add-recipe-component"
                    type="button"
                    onClick={addComponentRow}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus size={14} /> Add Stem Component
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {components.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="sm:col-span-7">
                        <label className="block text-[10px] text-gray-400">Select Single Stem Flower</label>
                        <select
                          id={`recipe-component-select-${index}`}
                          required
                          value={row.itemId}
                          onChange={(e) => updateComponentRow(index, 'itemId', e.target.value)}
                          className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="">-- Choose Stem --</option>
                          {stemItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} (₹{item.costPrice.toFixed(2)} cost)</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-gray-400">Stem Count</label>
                        <input
                          id={`recipe-component-qty-${index}`}
                          type="number"
                          required
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateComponentRow(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          id={`btn-remove-recipe-component-${index}`}
                          type="button"
                          disabled={components.length === 1}
                          onClick={() => removeComponentRow(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right pt-4 border-t border-gray-100">
                <button
                  id="btn-submit-recipe"
                  type="submit"
                  className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-amber-600 transition-colors text-sm shadow-xs cursor-pointer"
                >
                  Define Bouquet Arrangement Recipe
                </button>
              </div>
            </form>
          )}

          {/* Recipes Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recipes.map(recipe => {
              // Calculate composite cost price
              const stemCostSum = recipe.items.reduce((sum, part) => {
                const dbItem = items.find(i => i.id === part.itemId);
                return sum + (dbItem ? dbItem.costPrice * part.quantity : 0);
              }, 0);
              
              const calculatedCost = stemCostSum + recipe.laborCost;

              return (
                <div key={recipe.id} className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm font-display">{recipe.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {recipe.sku}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-sans">
                        BOM Active
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 italic leading-normal">"{recipe.description}"</p>

                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Flower Stems Needed:</span>
                      
                      <div className="space-y-1">
                        {recipe.items.map((ingredient, i) => {
                          const dbItem = items.find(item => item.id === ingredient.itemId);
                          return (
                            <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                              <span className="text-gray-700 font-medium">{dbItem?.name || 'Unknown Item'}</span>
                              <span className="font-mono font-bold text-amber-600">{ingredient.quantity} stems</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[11px] font-sans">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-gray-400 font-medium">BOM COGS</p>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">₹{calculatedCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                      <p className="text-amber-800 font-medium">Retail Sell</p>
                      <p className="font-mono font-semibold text-amber-900 mt-0.5">₹{recipe.retailPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <p className="text-emerald-800 font-medium font-sans">Wholesale Sell</p>
                      <p className="font-mono font-semibold text-emerald-950 mt-0.5">₹{recipe.wholesalePrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
