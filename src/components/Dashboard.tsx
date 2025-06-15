
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Product } from '@/types';
import { fetchProducts, fetchCustomers } from '@/utils/api';
import { loadSales } from '@/utils/storage';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesToday: 0,
    cashSalesToday: 0,
    utangSalesToday: 0,
    totalUtangOutstanding: 0,
    lowStockProducts: []
  });

  useEffect(() => {
    const calculateStats = async () => {
      try {
        const products = await fetchProducts();
        const customers = await fetchCustomers();
        const sales = loadSales();
      
      const today = new Date().toDateString();
      const todaySales = sales.filter(sale => 
        new Date(sale.createdAt).toDateString() === today
      );

      const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const cashSalesToday = todaySales
        .filter(sale => sale.paymentType === 'cash')
        .reduce((sum, sale) => sum + sale.total, 0);
      const utangSalesToday = todaySales
        .filter(sale => sale.paymentType === 'utang')
        .reduce((sum, sale) => sum + sale.total, 0);

      const totalUtangOutstanding = customers.reduce((sum, customer) => 
        sum + customer.totalOwed, 0
      );

      const lowStockProducts = products.filter(product => 
        product.stockQuantity <= 10
      );

        setStats({
          totalSalesToday,
          cashSalesToday,
          utangSalesToday,
          totalUtangOutstanding,
          lowStockProducts
        });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };

    calculateStats();
  }, []);

  return (
    <div className="mobile-container space-y-6">
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your store's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sales Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{stats.totalSalesToday.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cash Sales Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₱{stats.cashSalesToday.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Utang Sales Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₱{stats.utangSalesToday.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Utang Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₱{stats.totalUtangOutstanding.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-600">
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({product.sku})</span>
                  </div>
                  <Badge variant="destructive">
                    {product.stockQuantity} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
