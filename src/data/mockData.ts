/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Expense 
} from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u-1', name: 'Alexander Sterling', email: 'admin@florachain.com', role: 'ADMIN', hourlyRate: 35.00 },
  { id: 'u-2', name: 'Sophia Rosengard', email: 'florist@florachain.com', role: 'FLORIST', hourlyRate: 22.50 },
  { id: 'u-3', name: 'Mark Cashman', email: 'cashier@florachain.com', role: 'CASHIER', hourlyRate: 18.00 },
  { id: 'u-4', name: 'Emma Stem', email: 'manager@florachain.com', role: 'MANAGER', hourlyRate: 28.00 },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'EcoFlora Farms Ltd',
    contactName: 'Carlos Santillan',
    phone: '+1 (555) 382-9921',
    email: 'carlos@ecoflorafarms.com',
    address: 'Andes High Slopes Sector 4, Tabacundo, Ecuador',
    status: 'ACTIVE'
  },
  {
    id: 'sup-2',
    name: 'Pacific Wholesale Florist',
    contactName: 'Sarah Tanaka',
    phone: '+1 (555) 761-0428',
    email: 'sales@pacificflorist.com',
    address: '928 Marina Boulevard, South San Francisco, CA',
    status: 'ACTIVE'
  },
  {
    id: 'sup-3',
    name: 'Ribbons & Paper Supply Co.',
    contactName: 'John Burlap',
    phone: '+1 (555) 948-1102',
    email: 'support@wrappingco.com',
    address: '403 Industrial Parkway, Chicago, IL',
    status: 'ACTIVE'
  }
];

export const INITIAL_ITEMS: InventoryItem[] = [
  // BUNCH items (purchased in bulk, can be sold or converted)
  {
    id: 'item-b1',
    name: 'Red Roses Bunch (10s)',
    sku: 'BUNCH-RED-ROSE-10',
    type: 'BUNCH',
    stemCountPerBunch: 10,
    costPrice: 15.00, // $15 per bunch ($1.50 per stem cost)
    retailPrice: 28.00,
    wholesalePrice: 24.00,
    minStockLevel: 10
  },
  {
    id: 'item-b2',
    name: 'White Lilies Bunch (5s)',
    sku: 'BUNCH-WHT-LILY-5',
    type: 'BUNCH',
    stemCountPerBunch: 5,
    costPrice: 12.50, // $12.50 per bunch ($2.50 per stem cost)
    retailPrice: 22.00,
    wholesalePrice: 19.00,
    minStockLevel: 8
  },
  {
    id: 'item-b3',
    name: 'Lilac Bunch (10s)',
    sku: 'BUNCH-LILAC-10',
    type: 'BUNCH',
    stemCountPerBunch: 10,
    costPrice: 18.00,
    retailPrice: 32.00,
    wholesalePrice: 28.00,
    minStockLevel: 5
  },

  // STEM items (for single retail or production recipe consumption)
  {
    id: 'item-s1',
    name: 'Red Rose Stem',
    sku: 'STEM-RED-ROSE',
    type: 'STEM',
    costPrice: 1.50,
    retailPrice: 4.00,
    wholesalePrice: 3.20,
    minStockLevel: 50
  },
  {
    id: 'item-s2',
    name: 'White Lily Stem',
    sku: 'STEM-WHT-LILY',
    type: 'STEM',
    costPrice: 2.50,
    retailPrice: 6.00,
    wholesalePrice: 4.80,
    minStockLevel: 40
  },
  {
    id: 'item-s3',
    name: 'Lilac Stem',
    sku: 'STEM-LILAC',
    type: 'STEM',
    costPrice: 1.80,
    retailPrice: 5.00,
    wholesalePrice: 4.00,
    minStockLevel: 30
  },
  {
    id: 'item-s4',
    name: 'Baby’s Breath Filaments (Misty)',
    sku: 'STEM-BABYS-BREATH',
    type: 'STEM',
    costPrice: 0.80,
    retailPrice: 2.20,
    wholesalePrice: 1.80,
    minStockLevel: 100
  },
  {
    id: 'item-s5',
    name: 'Eucalyptus Greenery Bunch-Stem',
    sku: 'STEM-EUCALYPTUS',
    type: 'STEM',
    costPrice: 0.60,
    retailPrice: 1.80,
    wholesalePrice: 1.40,
    minStockLevel: 80
  },

  // BOUQUETS / PRODUCTS (yielded from recipes, can be sold)
  {
    id: 'item-p1',
    name: 'Crimson Romance Bouquet',
    sku: 'BOUQ-CRIMSON',
    type: 'BOUQUET',
    costPrice: 24.40, // Computed from BOM layout cost + labor
    retailPrice: 65.00,
    wholesalePrice: 55.00,
    minStockLevel: 5
  },
  {
    id: 'item-p2',
    name: 'Vase of Serene Lilies',
    sku: 'BOUQ-SERENE',
    type: 'BOUQUET',
    costPrice: 23.80,
    retailPrice: 58.00,
    wholesalePrice: 50.00,
    minStockLevel: 4
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Crimson Romance Bouquet',
    sku: 'BOUQ-CRIMSON',
    description: 'A classic romantic hand-gathered bouquet of red roses set in clouds of baby’s breath and fresh eucalyptus greens, tied with premium double-satin crimson ribbons.',
    items: [
      { itemId: 'item-s1', quantity: 12 }, // 12 Red Rose Stems ($18.00 cost)
      { itemId: 'item-s4', quantity: 5 },  // 5 Baby's Breath Stems ($4.00 cost)
      { itemId: 'item-s5', quantity: 4 },  // 4 Eucalyptus Stems ($2.40 cost)
    ],
    laborCost: 10.00, // Artist time
    retailPrice: 65.00,
    wholesalePrice: 55.00
  },
  {
    id: 'rec-2',
    name: 'Vase of Serene Lilies',
    sku: 'BOUQ-SERENE',
    description: 'An elegant display vase consisting of fragrant white lilies mixed with eucalyptus greenery and subtle lilac stems.',
    items: [
      { itemId: 'item-s2', quantity: 6 },  // 6 White Lily Stems ($15.00 cost)
      { itemId: 'item-s3', quantity: 3 },  // 3 Lilac Stems ($5.40 cost)
      { itemId: 'item-s5', quantity: 5 },  // 5 Eucalyptus Stems ($3.00 cost)
    ],
    laborCost: 12.00,
    retailPrice: 58.00,
    wholesalePrice: 50.00
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Downtown Wedding Floriculture', phone: '+1 (555) 234-8891', email: 'design@downtownweddings.com', type: 'WHOLESALE', discountRate: 10, totalSpent: 2840.00 },
  { id: 'cust-2', name: 'Hotel Grand Plaza Concierge', phone: '+1 (555) 902-1133', email: 'facilities@grandplaza.com', type: 'WHOLESALE', discountRate: 15, totalSpent: 4720.00 },
  { id: 'cust-3', name: 'Benjamin Harrison', phone: '+1 (555) 304-5891', email: 'ben.h@gmail.com', type: 'RETAIL', discountRate: 0, totalSpent: 185.00 },
  { id: 'cust-4', name: 'Katherine Vance', phone: '+1 (555) 766-3392', email: 'k.vance@yahoo.com', type: 'RETAIL', discountRate: 5, totalSpent: 340.00 },
];

export const INITIAL_LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  // Red Roses Bunch purchases
  { id: 'tx-1', itemId: 'item-b1', type: 'PURCHASE', quantity: 40, unitPrice: 15.00, referenceId: 'po-1', notes: 'Supplier delivery raw bunch stock', createdAt: '2026-06-01T09:30:00Z', createdBy: 'Alexander Sterling' },
  // White Lilies Bunch purchases
  { id: 'tx-2', itemId: 'item-b2', type: 'PURCHASE', quantity: 30, unitPrice: 12.50, referenceId: 'po-1', notes: 'Supplier delivery raw bunch stock', createdAt: '2026-06-01T09:32:00Z', createdBy: 'Alexander Sterling' },
  // Lilac Bunch purchases
  { id: 'tx-3', itemId: 'item-b3', type: 'PURCHASE', quantity: 15, unitPrice: 18.00, referenceId: 'po-1', notes: 'Supplier delivery raw bunch stock', createdAt: '2026-06-01T09:33:00Z', createdBy: 'Alexander Sterling' },

  // Baby's Breath purchase
  { id: 'tx-4', itemId: 'item-s4', type: 'PURCHASE', quantity: 200, unitPrice: 0.80, referenceId: 'po-2', notes: 'Purchase order of retail stems', createdAt: '2026-06-02T10:15:00Z', createdBy: 'Emma Stem' },
  // Eucalyptus purchase
  { id: 'tx-5', itemId: 'item-s5', type: 'PURCHASE', quantity: 150, unitPrice: 0.60, referenceId: 'po-2', notes: 'Purchase order of retail greens', createdAt: '2026-06-02T10:16:00Z', createdBy: 'Emma Stem' },

  // Now, decompose bunches into stems for recipes and single stem retail
  // Red Roses Bunch: Convert 25 bunches to stems (gives 250 Stems)
  { id: 'tx-6', itemId: 'item-b1', type: 'CONVERSION_OUT', quantity: -25, unitPrice: 15.00, notes: 'Decomposing 25 bunches into single florist stems', createdAt: '2026-06-02T11:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-7', itemId: 'item-s1', type: 'CONVERSION_IN', quantity: 250, unitPrice: 1.50, notes: 'Stems gained from 25 decomposed bunches', createdAt: '2026-06-02T11:00:00Z', createdBy: 'Sophia Rosengard' },

  // White Lilies Bunch: Convert 20 bunches to stems (gives 100 Stems)
  { id: 'tx-8', itemId: 'item-b2', type: 'CONVERSION_OUT', quantity: -20, unitPrice: 12.50, notes: 'Decomposing 20 bunches into single stems', createdAt: '2026-06-02T11:05:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-9', itemId: 'item-s2', type: 'CONVERSION_IN', quantity: 100, unitPrice: 2.50, notes: 'Stems gained from 20 decomposed bunches', createdAt: '2026-06-02T11:05:00Z', createdBy: 'Sophia Rosengard' },

  // Lilac Bunch: Convert 10 bunchs to stems (gives 100 Stems)
  { id: 'tx-10', itemId: 'item-b3', type: 'CONVERSION_OUT', quantity: -10, unitPrice: 18.00, notes: 'Decomposing 10 bunches into stems', createdAt: '2026-06-02T11:10:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-11', itemId: 'item-s3', type: 'CONVERSION_IN', quantity: 100, unitPrice: 1.80, notes: 'Stems gained from 10 decomposed bunches', createdAt: '2026-06-02T11:10:00Z', createdBy: 'Sophia Rosengard' },

  // Let's produce some initial bouquets of Crimson Romance (10 bouquets)
  // 10 Bouquets consume 120 Red Rose Stems, 50 Baby's Breath, 40 Eucalyptus
  { id: 'tx-12', itemId: 'item-s1', type: 'PRODUCTION_CONSUME', quantity: -120, unitPrice: 1.50, referenceId: 'prod-1', notes: 'Used for Crimson Romance production run 1', createdAt: '2026-06-03T14:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-13', itemId: 'item-s4', type: 'PRODUCTION_CONSUME', quantity: -50, unitPrice: 0.80, referenceId: 'prod-1', notes: 'Used for Crimson Romance production run 1', createdAt: '2026-06-03T14:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-14', itemId: 'item-s5', type: 'PRODUCTION_CONSUME', quantity: -40, unitPrice: 0.60, referenceId: 'prod-1', notes: 'Used for Crimson Romance production run 1', createdAt: '2026-06-03T14:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-15', itemId: 'item-p1', type: 'PRODUCTION_YIELD', quantity: 10, unitPrice: 24.40, referenceId: 'prod-1', notes: 'Crimson Romance bouquets production run completed', createdAt: '2026-06-03T14:05:00Z', createdBy: 'Sophia Rosengard' },

  // Let's produce some initial bouquets of Serene Lilies (8 bouquets)
  // 8 Bouquets consume 48 Lilies, 24 Lilacs, 40 Eucalyptus
  { id: 'tx-16', itemId: 'item-s2', type: 'PRODUCTION_CONSUME', quantity: -48, unitPrice: 2.50, referenceId: 'prod-2', notes: 'Used for Serene Lilies production run 1', createdAt: '2026-06-04T15:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-17', itemId: 'item-s3', type: 'PRODUCTION_CONSUME', quantity: -24, unitPrice: 1.80, referenceId: 'prod-2', notes: 'Used for Serene Lilies production run 1', createdAt: '2026-06-04T15:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-18', itemId: 'item-s5', type: 'PRODUCTION_CONSUME', quantity: -40, unitPrice: 0.60, referenceId: 'prod-2', notes: 'Used for Serene Lilies production run 1', createdAt: '2026-06-04T15:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-19', itemId: 'item-p2', type: 'PRODUCTION_YIELD', quantity: 8, unitPrice: 23.80, referenceId: 'prod-2', notes: 'Vase of Serene Lilies production run completed', createdAt: '2026-06-04T15:05:00Z', createdBy: 'Sophia Rosengard' },

  // Sales
  { id: 'tx-21', itemId: 'item-p1', type: 'SALE', quantity: -3, unitPrice: 65.00, referenceId: 'sale-1', notes: 'POS Sale Invoice #FC-1001', createdAt: '2026-06-05T11:30:00Z', createdBy: 'Mark Cashman' },
  { id: 'tx-22', itemId: 'item-p2', type: 'SALE', quantity: -2, unitPrice: 58.00, referenceId: 'sale-1', notes: 'POS Sale Invoice #FC-1001', createdAt: '2026-06-05T11:30:00Z', createdBy: 'Mark Cashman' },

  { id: 'tx-23', itemId: 'item-b1', type: 'SALE', quantity: -5, unitPrice: 24.00, referenceId: 'sale-2', notes: 'Wholesale Purchase Invoice #FC-1002', createdAt: '2026-06-06T14:45:00Z', createdBy: 'Alexander Sterling' },
  { id: 'tx-24', itemId: 'item-s1', type: 'SALE', quantity: -20, unitPrice: 3.20, referenceId: 'sale-2', notes: 'Wholesale Purchase Invoice #FC-1002', createdAt: '2026-06-06T14:45:00Z', createdBy: 'Alexander Sterling' },

  // Damages
  { id: 'tx-25', itemId: 'item-s1', type: 'DAMAGE_WRITE_OFF', quantity: -15, unitPrice: 1.50, referenceId: 'dmg-1', notes: 'Dried out and split stems written off', createdAt: '2026-06-07T17:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'tx-26', itemId: 'item-s2', type: 'DAMAGE_WRITE_OFF', quantity: -5, unitPrice: 2.50, referenceId: 'dmg-2', notes: 'Lily tips broken in shipping transport damage', createdAt: '2026-06-07T17:15:00Z', createdBy: 'Sophia Rosengard' }
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po-1',
    supplierId: 'sup-1',
    invoiceNumber: 'EF-INV-99321',
    status: 'RECEIVED',
    totalAmount: 1245.00,
    createdAt: '2026-06-01T09:30:00Z',
    items: [
      { itemId: 'item-b1', quantity: 40, unitCost: 15.00 },
      { itemId: 'item-b2', quantity: 30, unitCost: 12.50 },
      { itemId: 'item-b3', quantity: 15, unitCost: 18.00 }
    ]
  },
  {
    id: 'po-2',
    supplierId: 'sup-2',
    invoiceNumber: 'PAC-48283',
    status: 'RECEIVED',
    totalAmount: 250.00,
    createdAt: '2026-06-02T10:15:00Z',
    items: [
      { itemId: 'item-s4', quantity: 200, unitCost: 0.80 },
      { itemId: 'item-s5', quantity: 150, unitCost: 0.60 }
    ]
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    customerId: 'cust-4',
    invoiceNumber: 'FC-1001',
    customerType: 'RETAIL',
    items: [
      { itemId: 'item-p1', name: 'Crimson Romance Bouquet', type: 'BOUQUET', quantity: 3, unitPrice: 65.00, discount: 5 },
      { itemId: 'item-p2', name: 'Vase of Serene Lilies', type: 'BOUQUET', quantity: 2, unitPrice: 58.00, discount: 5 }
    ],
    subtotal: 311.00,
    discountAmount: 15.55,
    taxAmount: 23.64,
    totalAmount: 319.09,
    paymentMethod: 'CARD',
    createdAt: '2026-06-05T11:30:00Z',
    createdBy: 'Mark Cashman'
  },
  {
    id: 'sale-2',
    customerId: 'cust-1',
    invoiceNumber: 'FC-1002',
    customerType: 'WHOLESALE',
    items: [
      { itemId: 'item-b1', name: 'Red Roses Bunch (10s)', type: 'BUNCH', quantity: 5, unitPrice: 24.00, discount: 10 },
      { itemId: 'item-s1', name: 'Red Rose Stem', type: 'STEM', quantity: 20, unitPrice: 3.20, discount: 10 }
    ],
    subtotal: 184.00,
    discountAmount: 18.40,
    taxAmount: 13.25,
    totalAmount: 178.85,
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2026-06-06T14:45:00Z',
    createdBy: 'Alexander Sterling'
  }
];

export const INITIAL_DAMAGES: DamageLog[] = [
  { id: 'dmg-1', itemId: 'item-s1', quantity: 15, reason: 'DRIED_OUT', notes: 'Dried out and split stems written off', createdAt: '2026-06-07T17:00:00Z', createdBy: 'Sophia Rosengard' },
  { id: 'dmg-2', itemId: 'item-s2', quantity: 5, reason: 'SPOILED', notes: 'Lily tips broken in shipping transport damage', createdAt: '2026-06-07T17:15:00Z', createdBy: 'Sophia Rosengard' }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', userId: 'u-1', clockIn: '2026-06-12T08:00:00Z', clockOut: '2026-06-12T17:00:00Z', date: '2026-06-12', hoursWorked: 8.5 },
  { id: 'att-2', userId: 'u-2', clockIn: '2026-06-12T08:30:00Z', clockOut: '2026-06-12T17:15:00Z', date: '2026-06-12', hoursWorked: 8.25 },
  { id: 'att-3', userId: 'u-3', clockIn: '2026-06-12T09:00:00Z', clockOut: '2026-06-12T15:00:00Z', date: '2026-06-12', hoursWorked: 6.0 },
  { id: 'att-4', userId: 'u-2', clockIn: '2026-06-13T08:15:00Z', clockOut: '2026-06-13T17:30:00Z', date: '2026-06-13', hoursWorked: 8.75 },
];

export const INITIAL_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-1',
    userId: 'u-1',
    payPeriodStart: '2026-06-01',
    payPeriodEnd: '2026-06-14',
    regularHours: 80.00,
    overtimeHours: 5.50,
    grossPay: 3088.75, // (80 * 35) + (5.5 * 35 * 1.5)
    deductions: 450.00,
    netPay: 2638.75,
    status: 'PENDING',
  },
  {
    id: 'pay-2',
    userId: 'u-2',
    payPeriodStart: '2026-06-01',
    payPeriodEnd: '2026-06-14',
    regularHours: 72.50,
    overtimeHours: 0.00,
    grossPay: 1631.25, // 72.50 * 22.50
    deductions: 220.00,
    netPay: 1411.25,
    status: 'PAID',
    paymentDate: '2026-06-14'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', category: 'RENT', amount: 1500.00, description: 'Monthly lease for Retail Hub & Store Front', date: '2026-06-01' },
  { id: 'exp-2', category: 'UTILITIES', amount: 320.00, description: 'Cold Storage Room electric utility balance', date: '2026-06-04' },
  { id: 'exp-3', category: 'MARKETING', amount: 450.00, description: 'Google Local Ads promotion campaign for wedding agency sales', date: '2026-06-05' },
  { id: 'exp-4', category: 'PACKAGING', amount: 180.00, description: 'Ribbons, rustic burlap wrap paper and hydration gel tubes', date: '2026-06-08', supplierId: 'sup-3' },
];
