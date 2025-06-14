
export interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
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
