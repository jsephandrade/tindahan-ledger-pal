
import { Product, Customer } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const tokenKey = 'auth_token';

export const getToken = () => localStorage.getItem(tokenKey);
export const setToken = (token: string) => localStorage.setItem(tokenKey, token);
export const clearToken = () => localStorage.removeItem(tokenKey);

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    unitPrice: parseFloat(p.unit_price),
    stockQuantity: parseInt(p.stock_quantity),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      unit_price: data.unitPrice,
      stock_quantity: data.stockQuantity
    })
  });
  if (!res.ok) throw new Error('Failed to create product');
  const p = await res.json();
  return {
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    unitPrice: parseFloat(p.unit_price),
    stockQuantity: parseInt(p.stock_quantity),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      unit_price: data.unitPrice,
      stock_quantity: data.stockQuantity,
      total_owed: (data as any).total_owed
    })
  });
  if (!res.ok) throw new Error('Failed to update product');
  const p = await res.json();
  return {
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    unitPrice: parseFloat(p.unit_price),
    stockQuantity: parseInt(p.stock_quantity),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

export async function deleteProduct(id: number): Promise<void> {
  await fetch(`${BASE_URL}/products/${id}/`, { method: 'DELETE', headers: getHeaders() });
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${BASE_URL}/customers/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch customers');
  const data = await res.json();
  return data.map((c: any) => ({
    id: String(c.id),
    name: c.name,
    contact: c.contact,
    totalOwed: c.total_owed,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }));
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${BASE_URL}/customers/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      contact: data.contact,
      total_owed: data.totalOwed || 0
    })
  });
  if (!res.ok) throw new Error('Failed to create customer');
  const c = await res.json();
  return {
    id: String(c.id),
    name: c.name,
    contact: c.contact,
    totalOwed: c.total_owed,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${BASE_URL}/customers/${id}/`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      contact: data.contact,
      total_owed: data.totalOwed
    })
  });
  if (!res.ok) throw new Error('Failed to update customer');
  const c = await res.json();
  return {
    id: String(c.id),
    name: c.name,
    contact: c.contact,
    totalOwed: c.total_owed,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

export async function deleteCustomer(id: number): Promise<void> {
  await fetch(`${BASE_URL}/customers/${id}/`, { method: 'DELETE', headers: getHeaders() });
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  return data.access;
}

export async function register(username: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) throw new Error('Registration failed');
}
