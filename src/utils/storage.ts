
import { Product, Customer, Sale, UtangPayment } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'sari_products',
  CUSTOMERS: 'sari_customers',
  SALES: 'sari_sales',
  UTANG_PAYMENTS: 'sari_utang_payments'
};

// Generic storage utilities
export const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const loadFromStorage = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Product operations
export const saveProducts = (products: Product[]): void => {
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
};

export const loadProducts = (): Product[] => {
  return loadFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
};

// Customer operations
export const saveCustomers = (customers: Customer[]): void => {
  saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
};

export const loadCustomers = (): Customer[] => {
  return loadFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
};

// Sales operations
export const saveSales = (sales: Sale[]): void => {
  saveToStorage(STORAGE_KEYS.SALES, sales);
};

export const loadSales = (): Sale[] => {
  return loadFromStorage<Sale>(STORAGE_KEYS.SALES);
};

// Utang payment operations
export const saveUtangPayments = (payments: UtangPayment[]): void => {
  saveToStorage(STORAGE_KEYS.UTANG_PAYMENTS, payments);
};

export const loadUtangPayments = (): UtangPayment[] => {
  return loadFromStorage<UtangPayment>(STORAGE_KEYS.UTANG_PAYMENTS);
};

// Initialize with sample data if empty
export const initializeSampleData = (): void => {
  const products = loadProducts();
  const customers = loadCustomers();

  if (products.length === 0) {
    const sampleProducts: Product[] = [
      {
        id: generateId(),
        name: 'Rice (1kg)',
        sku: 'RICE001',
        unitPrice: 55,
        stockQuantity: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Instant Noodles',
        sku: 'NOODLE001',
        unitPrice: 15,
        stockQuantity: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Cooking Oil (1L)',
        sku: 'OIL001',
        unitPrice: 85,
        stockQuantity: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Soft Drinks',
        sku: 'SODA001',
        unitPrice: 25,
        stockQuantity: 48,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Bread',
        sku: 'BREAD001',
        unitPrice: 35,
        stockQuantity: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    saveProducts(sampleProducts);
  }

  if (customers.length === 0) {
    const sampleCustomers: Customer[] = [
      {
        id: generateId(),
        name: 'Maria Santos',
        contact: '09171234567',
        totalOwed: 250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Juan Dela Cruz',
        contact: '09187654321',
        totalOwed: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    saveCustomers(sampleCustomers);
  }
};
