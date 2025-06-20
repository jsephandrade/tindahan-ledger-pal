export interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  totalOwed: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  paymentType: 'cash' | 'utang';
  customerId?: string;
  customerName?: string;
  createdAt: string;
  status: 'completed' | 'pending';
}

export interface UtangPayment {
  id: string;
  customerId: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  cashSalesToday: number;
  utangSalesToday: number;
  totalUtangOutstanding: number;
  lowStockProducts: Product[];
}

export interface UtangTransaction {
  id: string;
  customerId: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: 'unpaid' | 'partially_paid' | 'fully_paid';
  createdAt: string;
  updatedAt: string;
}

export interface UtangSummary {
  customerId: string;
  customerName: string;
  totalUtang: number;
  totalPaid: number;
  remainingBalance: number;
  transactions: UtangTransaction[];
}
