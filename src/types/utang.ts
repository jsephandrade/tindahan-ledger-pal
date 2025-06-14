
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
