
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

// Initialize empty storage arrays if they don't exist
export const initializeSampleData = (): void => {
  // Initialize empty arrays only if storage is not set
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    saveProducts([]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    saveCustomers([]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    saveSales([]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.UTANG_PAYMENTS)) {
    saveUtangPayments([]);
  }
};
