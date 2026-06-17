/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  Layers, 
  Package, 
  Users, 
  DollarSign, 
  FileSpreadsheet, 
  Code2, 
  Clock, 
  HeartCrack,
  Menu,
  X,
  Sparkles,
  Lock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Shared Types
import { 
  User, 
  InventoryItem, 
  LedgerTransaction, 
  Supplier, 
  PurchaseOrder, 
  Recipe, 
  ProductionLog, 
  DamageLog, 
  Customer, 
  Sale, 
  AttendanceRecord, 
  PayrollRecord, 
  Expense,
  Role
} from './types';

// Mock Data Seeding
import {
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_ITEMS,
  INITIAL_RECIPES,
  INITIAL_CUSTOMERS,
  INITIAL_LEDGER_TRANSACTIONS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_DAMAGES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_EXPENSES
} from './data/mockData';

// Pages components
import Dashboard from './components/Dashboard';
import SuppliersPurchases from './components/SuppliersPurchases';
import POSBilling from './components/POSBilling';
import InventoryLedger from './components/InventoryLedger';
import BOMProduction from './components/BOMProduction';
import DamagesRegistry from './components/DamagesRegistry';
import HRSystem from './components/HRSystem';
import ExpensesDashboard from './components/ExpensesDashboard';
import Reports from './components/Reports';
import CodeGenerator from './components/CodeGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  // Core Persistent State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fc_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [activeUserId, setActiveUserId] = useState<string>('u-1'); // Alexander (Admin)

  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('fc_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('fc_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('fc_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('fc_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [ledger, setLedger] = useState<LedgerTransaction[]>(() => {
    const saved = localStorage.getItem('fc_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER_TRANSACTIONS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('fc_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('fc_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [damageLogs, setDamageLogs] = useState<DamageLog[]>(() => {
    const saved = localStorage.getItem('fc_damages');
    return saved ? JSON.parse(saved) : INITIAL_DAMAGES;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('fc_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('fc_payroll');
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('fc_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  // Hydrate localized date logs
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save states to local storage every update
  useEffect(() => {
    localStorage.setItem('fc_users', JSON.stringify(users));
    localStorage.setItem('fc_items', JSON.stringify(items));
    localStorage.setItem('fc_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('fc_purchases', JSON.stringify(purchaseOrders));
    localStorage.setItem('fc_recipes', JSON.stringify(recipes));
    localStorage.setItem('fc_ledger', JSON.stringify(ledger));
    localStorage.setItem('fc_customers', JSON.stringify(customers));
    localStorage.setItem('fc_sales', JSON.stringify(sales));
    localStorage.setItem('fc_damages', JSON.stringify(damageLogs));
    localStorage.setItem('fc_attendance', JSON.stringify(attendance));
    localStorage.setItem('fc_payroll', JSON.stringify(payroll));
    localStorage.setItem('fc_expenses', JSON.stringify(expenses));
  }, [users, items, suppliers, purchaseOrders, recipes, ledger, customers, sales, damageLogs, attendance, payroll, expenses]);

  // Derived current inventory levels helper
  const getLedgerBalances = (): Record<string, number> => {
    const balances: Record<string, number> = {};
    items.forEach(i => { balances[i.id] = 0; });
    ledger.forEach(tx => {
      balances[tx.itemId] = (balances[tx.itemId] || 0) + tx.quantity;
    });
    return balances;
  };

  const ledgerBalances = getLedgerBalances();
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  // Helper helper to draft clean double-entry record transaction logs
  const addLedgerTransaction = (
    itemId: string,
    type: LedgerTransaction['type'],
    quantity: number,
    unitPrice: number,
    referenceId?: string,
    notes?: string
  ) => {
    const newTx: LedgerTransaction = {
      id: 'tx-' + Math.floor(100000 + Math.random() * 900000),
      itemId,
      type,
      quantity,
      unitPrice,
      referenceId,
      notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };
    setLedger(prev => [...prev, newTx]);
  };

  // State Adjustments Controllers
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const sup: Supplier = {
      id: 'sup-' + Math.floor(100000 + Math.random() * 900000),
      ...newSup
    };
    setSuppliers(prev => [...prev, sup]);
  };

  const handleAddPurchase = (
    supplierId: string, 
    invoiceNum: string, 
    purchaseItems: { itemId: string; quantity: number; unitCost: number }[]
  ) => {
    const totalVal = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const newPO: PurchaseOrder = {
      id: 'po-' + Math.floor(100000 + Math.random() * 900000),
      supplierId,
      invoiceNumber: invoiceNum,
      status: 'RECEIVED',
      totalAmount: totalVal,
      createdAt: new Date().toISOString(),
      items: purchaseItems
    };

    setPurchaseOrders(prev => [...prev, newPO]);

    // Append and write entries into ledger
    purchaseItems.forEach(line => {
      addLedgerTransaction(
        line.itemId,
        'PURCHASE',
        line.quantity,
        line.unitCost,
        newPO.id,
        `Supplier purchase invoice #${invoiceNum}`
      );
    });
  };

  const handleConvertBunchesToStems = (
    bunchItemId: string,
    stemItemId: string,
    bunchesCount: number,
    notes?: string
  ) => {
    const bunch = items.find(i => i.id === bunchItemId);
    const stem = items.find(i => i.id === stemItemId);

    if (!bunch || !stem || bunch.type !== 'BUNCH' || stem.type !== 'STEM') {
      return { success: false, message: "Invalid conversion floral units chosen." };
    }

    const availableBunchCount = ledgerBalances[bunchItemId] || 0;
    if (availableBunchCount < bunchesCount) {
      return { success: false, message: `Insufficient bunches stock. Holds ${availableBunchCount} units, but requested convert: ${bunchesCount}.` };
    }

    const stemsMultiplier = bunch.stemCountPerBunch || 10;
    const releaseStemsCount = bunchesCount * stemsMultiplier;

    // Log dual activities to sub-ledger
    const referenceId = 'conv-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Convert out of bunches
    addLedgerTransaction(
      bunchItemId,
      'CONVERSION_OUT',
      -bunchesCount,
      bunch.costPrice,
      referenceId,
      notes || `Decomposed ${bunchesCount} bunches into single stems.`
    );

    // 2. Convert into stems
    const derivedStemUnitCost = bunch.costPrice / stemsMultiplier;
    addLedgerTransaction(
      stemItemId,
      'CONVERSION_IN',
      releaseStemsCount,
      derivedStemUnitCost,
      referenceId,
      `Releasing ${releaseStemsCount} single stems from decomposed bunches.`
    );

    return { 
      success: true, 
      message: `Successfully dissolved ${bunchesCount} bunches out of stock, releasing ${releaseStemsCount} stalks of ${stem.name}! Ledger logs appended.` 
    };
  };

  const handleAddRecipe = (newRec: Omit<Recipe, 'id'>) => {
    const recipe: Recipe = {
      id: 'rec-' + Math.floor(100000 + Math.random() * 900000),
      ...newRec
    };
    setRecipes(prev => [...prev, recipe]);

    // Add Bouquet Item into the inventory catalog registry if not already present
    const exists = items.some(i => i.sku === recipe.sku);
    if (!exists) {
      // Calculate composite stems cost to derive initial item cost price
      const stemCostSum = recipe.items.reduce((sum, ri) => {
        const item = items.find(cat => cat.id === ri.itemId);
        return sum + (item ? item.costPrice * ri.quantity : 0);
      }, 0);

      const computedCost = stemCostSum + recipe.laborCost;

      const bouquetCatalogItem: InventoryItem = {
        id: 'item-' + Math.floor(100000 + Math.random() * 900000),
        name: recipe.name,
        sku: recipe.sku,
        type: 'BOUQUET',
        costPrice: computedCost,
        retailPrice: recipe.retailPrice,
        wholesalePrice: recipe.wholesalePrice,
        minStockLevel: 5
      };
      setItems(prev => [...prev, bouquetCatalogItem]);
    }
  };

  const handleProduceBouquet = (recipeId: string, quantity: number, notes?: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return { success: false, message: 'Source recipe formula page not found.' };

    // Check stem shortages
    let shortageFound = false;
    let shortageMsg = '';

    recipe.items.forEach(component => {
      const dbItem = items.find(i => i.id === component.itemId);
      if (dbItem) {
        const bal = ledgerBalances[dbItem.id] || 0;
        const req = component.quantity * quantity;
        if (bal < req) {
          shortageFound = true;
          shortageMsg += `${dbItem.name} needs ${req} pieces (Available: ${bal}). `;
        }
      }
    });

    if (shortageFound) {
      return { success: false, message: `Shortage alert! Cannot run florist production: ${shortageMsg}` };
    }

    const prodId = 'prod-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Consume required STEM components from ledger
    recipe.items.forEach(component => {
      const dbItem = items.find(i => i.id === component.itemId)!;
      const consumedStemsCount = component.quantity * quantity;
      
      addLedgerTransaction(
        component.itemId,
        'PRODUCTION_CONSUME',
        -consumedStemsCount,
        dbItem.costPrice,
        prodId,
        `Consumed in art production of recipe: ${recipe.name}`
      );
    });

    // 2. Increment yielded BOUQUET item standard stock in ledger
    const bouquetItem = items.find(i => i.sku === recipe.sku)!;
    addLedgerTransaction(
      bouquetItem.id,
      'PRODUCTION_YIELD',
      quantity,
      bouquetItem.costPrice,
      prodId,
      notes || `Florist batch manufacture yield: ${recipe.name}`
    );

    // Append to production history log
    const newLog: ProductionLog = {
      id: prodId,
      recipeId,
      quantityProduced: quantity,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      notes
    };
    setProductionLogs(prev => [...prev, newLog]);

    return { 
      success: true, 
      message: `Success! Checked stem quantities, decreased component stalks, and stored +${quantity} of ${recipe.name} on standard inventory ledger.` 
    };
  };

  const handleRecordSale = (newSale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    const saleId = 'sale-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceNum = 'FC-' + Math.floor(1000 + Math.random() * 9000);
    const sale: Sale = {
      id: saleId,
      invoiceNumber: invoiceNum,
      createdAt: new Date().toISOString(),
      ...newSale
    };

    setSales(prev => [...prev, sale]);

    // Append negative offsets to the inventory list ledger
    newSale.items.forEach(line => {
      const dbItem = items.find(i => i.id === line.itemId);
      let qtyDeducted = line.quantity;
      if (dbItem && dbItem.type === 'BUNCH' && line.billingUnit === 'SINGLE') {
        const divider = dbItem.stemCountPerBunch || 10;
        qtyDeducted = line.quantity / divider;
      }

      addLedgerTransaction(
        line.itemId,
        'SALE',
        -qtyDeducted,
        line.unitPrice,
        saleId,
        `Cashier billing invoice FC-${invoiceNum}${line.billingUnit === 'SINGLE' ? ` (${line.quantity} stems)` : ''}`
      );
    });

    // Handle updating customer metrics totalSpent
    if (newSale.customerId) {
      setCustomers(prev => prev.map(c => 
        c.id === newSale.customerId 
          ? { ...c, totalSpent: c.totalSpent + newSale.totalAmount } 
          : c
      ));
    }

    return sale;
  };

  const handleAddCustomer = (newC: Omit<Customer, 'id' | 'totalSpent'>) => {
    const c: Customer = {
      id: 'cust-' + Math.floor(100000 + Math.random() * 900000),
      totalSpent: 0,
      ...newC
    };
    setCustomers(prev => [...prev, c]);
  };

  const handleRecordDamage = (
    itemId: string, 
    quantity: number, 
    reason: 'SPOILED' | 'BROKEN_STEM' | 'DRIED_OUT' | 'OTHER', 
    notes?: string
  ) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item lookup failed.' };

    const damageId = 'dmg-' + Math.floor(100000 + Math.random() * 900000);
    
    const log: DamageLog = {
      id: damageId,
      itemId,
      quantity,
      reason,
      notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };

    setDamageLogs(prev => [...prev, log]);

    // Record reduction double entry into inventory logs
    addLedgerTransaction(
      itemId,
      'DAMAGE_WRITE_OFF',
      -quantity,
      item.costPrice,
      damageId,
      notes || `Flower shrinkage: ${reason}`
    );

    return { 
      success: true, 
      message: `Recorded write-off code. Decreased ${quantity} units of ${item.name} from stock ledger.` 
    };
  };

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const item: InventoryItem = {
      id: 'item-' + Math.floor(100000 + Math.random() * 900000),
      ...newItem
    };
    setItems(prev => [...prev, item]);
  };

  const handleUpdatePrices = (itemId: string, cost: number, retail: number, wholesale: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, costPrice: cost, retailPrice: retail, wholesalePrice: wholesale } 
        : item
    ));
  };

  const handleClockIn = (userId: string) => {
    const record: AttendanceRecord = {
      id: 'att-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      clockIn: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
    setAttendance(prev => [...prev, record]);
  };

  const handleClockOut = (recordId: string) => {
    setAttendance(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const outTime = new Date().toISOString();
        const diffMs = new Date(outTime).getTime() - new Date(rec.clockIn).getTime();
        const hrsWorked = Math.max(0.1, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
        return {
          ...rec,
          clockOut: outTime,
          hoursWorked: hrsWorked
        };
      }
      return rec;
    }));
  };

  const handleGeneratePayroll = (userId: string, start: string, end: string, withheldFees: number) => {
    const employee = users.find(u => u.id === userId)!;
    
    // Sum hours worked in period
    const periodHours = attendance
      .filter(rec => rec.userId === userId && rec.clockOut && rec.date >= start && rec.date <= end)
      .reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0);

    // Overtime rule: hours over 80 are overtime (paid at 1.5x rate)
    const overtimeThreshold = 80;
    const regularHours = Math.min(periodHours, overtimeThreshold);
    const overtimeHours = Math.max(0, periodHours - overtimeThreshold);

    const regularPay = regularHours * employee.hourlyRate;
    const overtimePay = overtimeHours * (employee.hourlyRate * 1.5);
    const grossPay = regularPay + overtimePay;

    const netPay = Math.max(0, grossPay - withheldFees);

    const record: PayrollRecord = {
      id: 'pay-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      payPeriodStart: start,
      payPeriodEnd: end,
      regularHours,
      overtimeHours,
      grossPay,
      deductions: withheldFees,
      netPay,
      status: 'PENDING'
    };

    setPayroll(prev => [...prev, record]);
  };

  const handlePaySalary = (payrollId: string) => {
    setPayroll(prev => prev.map(p => {
      if (p.id === payrollId) {
        const paidDate = new Date().toISOString().split('T')[0];
        const user = users.find(u => u.id === p.userId);
        
        // When salary is paid, automatically dispatch a "Salaries" expense entry so that Reports / margins update dynamically
        const salariesExpense: Expense = {
          id: 'exp-' + Math.floor(100000 + Math.random() * 900000),
          category: 'SALARIES',
          amount: p.netPay,
          description: `Wages payment payout voucher for: ${user?.name || 'Employee'}`,
          date: paidDate
        };
        setExpenses(prevExp => [...prevExp, salariesExpense]);

        return {
          ...p,
          status: 'PAID',
          paymentDate: paidDate
        };
      }
      return p;
    }));
  };

  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const exp: Expense = {
      id: 'exp-' + Math.floor(100000 + Math.random() * 900000),
      ...newExp
    };
    setExpenses(prev => [...prev, exp]);
  };

  // State values for child pages
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(() => {
    const saved = localStorage.getItem('fc_production');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulated Authorization Perm Checker (graceful alerts for Cashier/Florist)
  const isAuthorized = (reqRoles: Role[]) => {
    return reqRoles.includes(currentUser.role);
  };

  return (
    <div className="flex bg-[#fbfbfd] min-h-screen text-slate-800 antialiased font-sans">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
        {/* Filament Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <div className="p-2 bg-amber-500 rounded-lg text-white">
            <Layers size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-widest uppercase font-display">Lourd Flowers</h1>
            <span className="text-[10px] text-amber-500 font-bold block mt-0.5 tracking-wider uppercase">Filament ERP Suite</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Overview Metrics', icon: <Layers size={16} /> },
            { id: 'pos', label: 'CASHIER TERMINAL', icon: <Sparkles size={16} /> },
            { id: 'purchases', label: 'Supply & Bunches', icon: <ShoppingBag size={16} /> },
            { id: 'inventory', label: 'Inventory Ledger', icon: <Package size={16} /> },
            { id: 'recipes', label: 'Recipe BOM Room', icon: <Layers size={16} /> },
            { id: 'damages', label: 'Waste shrinkage', icon: <HeartCrack size={16} /> },
            { id: 'hr', label: 'Shift hours logs', icon: <Users size={16} /> },
            { id: 'expenses', label: 'Operating Bills', icon: <DollarSign size={16} /> },
            { id: 'reports', label: 'P&L Reports', icon: <FileSpreadsheet size={16} /> },
            { id: 'code', label: 'Laravel Exporter', icon: <Code2 size={16} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                id={`sidebar-nav-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-3.5 rounded-lg flex items-center gap-3 text-xs font-semibold cursor-pointer transition-colors ${
                  active 
                    ? 'bg-amber-500 text-white shadow-xs font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User context selector widget */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Simulated User Context</span>
            <div className="mt-1 flex items-center gap-2">
              <select
                id="global-user-selector"
                value={activeUserId}
                onChange={(e) => {
                  setActiveUserId(e.target.value);
                  setActiveTab('dashboard'); // Auto redirect
                }}
                className="w-full bg-slate-800 border border-slate-700/80 rounded p-1.5 font-bold text-white outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 leading-normal font-semibold">
            Change context to test simulated permission role limits on billing, HR systems or Laravel codes.
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-slate-300 flex justify-between items-center px-4 z-40">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-amber-500" />
          <h1 className="text-xs font-black text-white tracking-widest uppercase">Lourd Flowers</h1>
        </div>

        <button 
          id="btn-mobile-menu"
          onClick={() => setNavOpen(!navOpen)} 
          className="p-1 px-2 hover:bg-slate-800 rounded font-bold cursor-pointer text-slate-300"
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-slate-900/95 z-30 flex flex-col p-6 space-y-3">
          {[
            { id: 'dashboard', label: 'Overview Metrics', icon: <Layers size={16} /> },
            { id: 'pos', label: 'CASHIER TERMINAL', icon: <Sparkles size={16} /> },
            { id: 'purchases', label: 'Supply & Bunches', icon: <ShoppingBag size={16} /> },
            { id: 'inventory', label: 'Inventory Ledger', icon: <Package size={16} /> },
            { id: 'recipes', label: 'Recipe BOM Room', icon: <Layers size={16} /> },
            { id: 'damages', label: 'Waste shrinkage', icon: <HeartCrack size={16} /> },
            { id: 'hr', label: 'Shift hours logs', icon: <Users size={16} /> },
            { id: 'expenses', label: 'Operating Bills', icon: <DollarSign size={16} /> },
            { id: 'reports', label: 'P&L Reports', icon: <FileSpreadsheet size={16} /> },
            { id: 'code', label: 'Laravel Exporter', icon: <Code2 size={16} /> },
          ].map((tab) => (
            <button
              id={`mobile-nav-${tab.id}`}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setNavOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-lg flex items-center gap-3 text-xs font-bold ${
                activeTab === tab.id ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* User selector */}
          <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-bold">Change User Context:</span>
            <select
              id="mobile-user-selector"
              value={activeUserId}
              onChange={(e) => {
                setActiveUserId(e.target.value);
                setActiveTab('dashboard');
                setNavOpen(false);
              }}
              className="w-full bg-slate-800 border rounded p-2 text-white outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 w-screen overflow-hidden space-y-6">
        
        {/* TOP STATUS BAR */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2.5 px-4 bg-white rounded-xl border border-gray-150 text-xs shadow-3xs gap-2 select-none">
          <div className="flex items-center gap-2 font-semibold text-gray-500">
            <Clock size={14} className="text-amber-500" />
            Active Session: <strong className="text-gray-900 font-mono">{currentTime || new Date().toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold font-sans">Role Clear:</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
              currentUser.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              currentUser.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
              currentUser.role === 'FLORIST' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {currentUser.role} Clear
            </span>
          </div>
        </header>

        {/* ROLE BARRIER GATE FOR SENSITIVE TABS (RBAC) */}
        {(() => {
          // Rule 1: Cashier is ONLY authorized for Overview, POS and Inventory Ledger tabs
          if (currentUser.role === 'CASHIER' && !['dashboard', 'pos', 'inventory'].includes(activeTab)) {
            return (
              <div id="rbac-lockout" className="bg-white p-12 border rounded-xl shadow-md text-center max-w-xl mx-auto space-y-4">
                <Lock className="mx-auto text-amber-500 animate-bounce" size={48} />
                <h3 className="font-extrabold text-gray-900 text-base font-display">Administrative Block Gated</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your current logged role permission level (<strong className="font-bold text-gray-800">{currentUser.role}</strong>) is unauthorized to execute records inside this tab. 
                  Filament authorization policies have restricted this view.
                </p>
                <button
                  id="btn-rbac-bypass"
                  onClick={() => {
                    setActiveUserId('u-1'); // Bypass swap to admin
                    setActiveTab('dashboard');
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer"
                >
                  Bypass with Alex Sterling (Admin) Context
                </button>
              </div>
            );
          }

          // Rule 2: Florist is unauthorized for HR attendance system, Operating Expenses ledger, Reports and Developer port exporter
          if (currentUser.role === 'FLORIST' && ['hr', 'expenses', 'reports', 'code'].includes(activeTab)) {
            return (
              <div id="rbac-lockout" className="bg-white p-12 border rounded-xl shadow-md text-center max-w-xl mx-auto space-y-4">
                <Lock className="mx-auto text-amber-500 animate-bounce" size={48} />
                <h3 className="font-extrabold text-gray-900 text-base font-display">Administrative Block Gated</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The Florist role restricts financial outlays, employees hours clockings payroll, reports, and developer templates views.
                </p>
                <button
                  id="btn-rbac-bypass"
                  onClick={() => {
                    setActiveUserId('u-1');
                    setActiveTab('dashboard');
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer"
                >
                  Bypass with Alex Sterling (Admin) Context
                </button>
              </div>
            );
          }

          // RENDER TAB VIEW
          return (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    items={items} 
                    ledger={ledger} 
                    sales={sales} 
                    expenses={expenses} 
                    onNavigate={(tab) => setActiveTab(tab)} 
                  />
                )}
                {activeTab === 'purchases' && (
                  <SuppliersPurchases
                    suppliers={suppliers}
                    onAddSupplier={handleAddSupplier}
                    purchaseOrders={purchaseOrders}
                    onAddPurchase={handleAddPurchase}
                    items={items}
                    ledgerBalances={ledgerBalances}
                    onConvertBunchesToStems={handleConvertBunchesToStems}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'pos' && (
                  <POSBilling
                    items={items}
                    customers={customers}
                    onAddCustomer={handleAddCustomer}
                    onRecordSale={handleRecordSale}
                    ledgerBalances={ledgerBalances}
                    onConvertBunchesToStems={handleConvertBunchesToStems}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'inventory' && (
                  <InventoryLedger
                    items={items}
                    onAddItem={handleAddItem}
                    onUpdatePrices={handleUpdatePrices}
                    ledger={ledger}
                    ledgerBalances={ledgerBalances}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'recipes' && (
                  <BOMProduction
                    recipes={recipes}
                    onAddRecipe={handleAddRecipe}
                    productionLogs={productionLogs}
                    onProduceBouquet={handleProduceBouquet}
                    items={items}
                    ledgerBalances={ledgerBalances}
                    onConvertBunchesToStems={handleConvertBunchesToStems}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'damages' && (
                  <DamagesRegistry
                    items={items}
                    damageLogs={damageLogs}
                    onRecordDamage={handleRecordDamage}
                    ledgerBalances={ledgerBalances}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'hr' && (
                  <HRSystem
                    users={users}
                    attendance={attendance}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    payroll={payroll}
                    onGeneratePayroll={handleGeneratePayroll}
                    onPaySalary={handlePaySalary}
                  />
                )}
                {activeTab === 'expenses' && (
                  <ExpensesDashboard
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                    suppliers={suppliers}
                  />
                )}
                {activeTab === 'reports' && (
                  <Reports
                    items={items}
                    ledger={ledger}
                    sales={sales}
                    expenses={expenses}
                    suppliers={suppliers}
                  />
                )}
                {activeTab === 'code' && (
                  <CodeGenerator />
                )}
              </motion.div>
            </AnimatePresence>
          );
        })()}
      </main>
    </div>
  );
}
