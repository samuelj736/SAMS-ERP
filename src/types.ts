/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'FLORIST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  hourlyRate: number;
}

export type ItemType = 'BUNCH' | 'STEM' | 'BOUQUET';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  stemCountPerBunch?: number; // Only for BUNCH items
  costPrice: number; // Cost price per unit (bunch or stem)
  retailPrice: number; // Retail price per unit
  wholesalePrice: number; // Wholesale price per unit (typically less, for bulk buyers)
  minStockLevel: number; // For low stock alerts
}

export type LedgerType = 
  | 'PURCHASE'          // Buying items from suppliers
  | 'CONVERSION_OUT'    // Decomposing a bunch
  | 'CONVERSION_IN'     // Releasing stems from bunch decomposition
  | 'SALE'              // POS sales
  | 'PRODUCTION_CONSUME' // Stems used for a recipe
  | 'PRODUCTION_YIELD'  // Finished bouquets manufactured
  | 'DAMAGE_WRITE_OFF';  // Spoiled or damaged flowers

export interface LedgerTransaction {
  id: string;
  itemId: string;
  type: LedgerType;
  quantity: number; // Positive for additions, negative for reductions
  unitPrice: number; // Price of item at transaction
  referenceId?: string; // Links to Purchase ID, POS Bill ID, Damage ID, etc.
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  status: 'RECEIVED' | 'PENDING';
  totalAmount: number;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number; // Number of items purchased
  unitCost: number;
  receivedStems?: number; // If it's a bunch, the amount of stems received initially or converted
}

export interface RecipeItem {
  itemId: string; // Must refer to STEM items
  quantity: number; // Number of stems required
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  sku: string;
  items: RecipeItem[];
  laborCost: number; // Secondary pricing element
  retailPrice: number;
  wholesalePrice: number;
}

export interface ProductionLog {
  id: string;
  recipeId: string;
  quantityProduced: number;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface DamageLog {
  id: string;
  itemId: string;
  quantity: number;
  reason: 'SPOILED' | 'BROKEN_STEM' | 'DRIED_OUT' | 'OTHER';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'RETAIL' | 'WHOLESALE';
  discountRate: number; // In percentage (e.g. 5 means 5% discount)
  totalSpent: number;
}

export interface SaleItem {
  itemId: string; // STEM, BUNCH or BOUQUET
  name: string;
  type: ItemType;
  quantity: number;
  unitPrice: number;
  discount: number; // Percentage discount for this line item or customer
  billingUnit?: 'BUNCH' | 'SINGLE';
}

export interface Sale {
  id: string;
  customerId?: string;
  invoiceNumber: string;
  customerType: 'RETAIL' | 'WHOLESALE';
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  createdAt: string;
  createdBy: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  clockIn: string;
  clockOut?: string;
  date: string;
  hoursWorked?: number;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'PENDING' | 'PAID';
  paymentDate?: string;
}

export interface Expense {
  id: string;
  category: 'RENT' | 'UTILITIES' | 'MARKETING' | 'PACKAGING' | 'SALARIES' | 'OTHER';
  amount: number;
  description: string;
  date: string;
  supplierId?: string;
}
