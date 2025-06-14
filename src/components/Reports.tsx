import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sale, Customer, UtangPayment } from '@/types';
import { loadSales, loadCustomers, loadUtangPayments } from '@/utils/storage';
import { Calendar, DollarSign, User, TrendingUp } from 'lucide-react';

const Reports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [utangPayments, setUtangPayments] = useState<UtangPayment[]>([]);

  useEffect(() => {
    setSales(loadSales());
    setCustomers(loadCustomers());
    setUtangPayments(loadUtangPayments());
  }, []);

  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => 
    new Date(sale.createdAt).toDateString() === today
  );

  const dailyStats = {
    totalSales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
    cashSales: todaySales
      .filter(sale => sale.paymentType === 'cash')
      .reduce((sum, sale) => sum + sale.total, 0),
    utangSales: todaySales
      .filter(sale => sale.paymentType === 'utang')
      .reduce((sum, sale) => sum + sale.total, 0),
    totalTransactions: todaySales.length,
    cashTransactions: todaySales.filter(sale => sale.paymentType === 'cash').length,
    utangTransactions: todaySales.filter(sale => sale.paymentType === 'utang').length
  };

  const totalUtangOutstanding = customers.reduce((sum, customer) => 
    sum + customer.totalOwed, 0
  );

  const customersWithUtang = customers.filter(customer => customer.totalOwed > 0);

  const todayPayments = utangPayments.filter(payment =>
    new Date(payment.createdAt).toDateString() === today
  );
  const totalPaymentsToday = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get recent sales for transaction history
  const recentSales = sales
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Overview of your store's performance and finances</p>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          <TabsTrigger value="utang">Utang Report</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Sales Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₱{dailyStats.totalSales.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dailyStats.totalTransactions} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cash Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₱{dailyStats.cashSales.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dailyStats.cashTransactions} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Utang Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₱{dailyStats.utangSales.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dailyStats.utangTransactions} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Payments Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{totalPaymentsToday.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {todayPayments.length} payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Summary Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Cash Sales</span>
                    <div className="text-right">
                      <div className="font-medium">₱{dailyStats.cashSales.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {dailyStats.totalSales > 0 
                          ? ((dailyStats.cashSales / dailyStats.totalSales) * 100).toFixed(1)
                          : 0
                        }%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Utang Sales</span>
                    <div className="text-right">
                      <div className="font-medium">₱{dailyStats.utangSales.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {dailyStats.totalSales > 0 
                          ? ((dailyStats.utangSales / dailyStats.totalSales) * 100).toFixed(1)
                          : 0
                        }%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Transactions</span>
                    <Badge variant="secondary">{dailyStats.totalTransactions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Sale</span>
                    <span className="font-medium">
                      ₱{dailyStats.totalTransactions > 0 
                        ? (dailyStats.totalSales / dailyStats.totalTransactions).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cash vs Utang Ratio</span>
                    <span className="font-medium">
                      {dailyStats.cashTransactions}:{dailyStats.utangTransactions}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utang" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₱{totalUtangOutstanding.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Customers with Utang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {customersWithUtang.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  of {customers.length} total customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Utang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{customersWithUtang.length > 0 
                    ? (totalUtangOutstanding / customersWithUtang.length).toFixed(2)
                    : '0.00'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Utang Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Utang Details</CardTitle>
            </CardHeader>
            <CardContent>
              {customersWithUtang.length > 0 ? (
                <div className="space-y-2">
                  {customersWithUtang
                    .sort((a, b) => b.totalOwed - a.totalOwed)
                    .map((customer) => (
                      <div key={customer.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">{customer.contact}</div>
                        </div>
                        <Badge variant="destructive">
                          ₱{customer.totalOwed.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No outstanding utang accounts.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={sale.paymentType === 'cash' ? 'default' : 'secondary'}>
                            {sale.paymentType === 'cash' ? 'Cash' : 'Utang'}
                          </Badge>
                          {sale.customerName && (
                            <span className="text-sm text-gray-600">
                              {sale.customerName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.items.length} items • {new Date(sale.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₱{sale.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No transactions recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
