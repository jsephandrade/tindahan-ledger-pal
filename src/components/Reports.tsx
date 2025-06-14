
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sale, Customer, UtangPayment } from '@/types';
import { loadSales, loadCustomers, loadUtangPayments } from '@/utils/storage';
import { Calendar, DollarSign, User, TrendingUp, Clock, Receipt } from 'lucide-react';

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
    .slice(0, 20);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "text-green-600" }: {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg md:text-2xl font-bold ${color}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm md:text-base text-gray-600">Overview of your store's performance and finances</p>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="daily" className="text-xs md:text-sm py-2 md:py-3">
            Daily Summary
          </TabsTrigger>
          <TabsTrigger value="utang" className="text-xs md:text-sm py-2 md:py-3">
            Utang Report
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs md:text-sm py-2 md:py-3">
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={TrendingUp}
              title="Total Sales Today"
              value={`₱${dailyStats.totalSales.toFixed(2)}`}
              subtitle={`${dailyStats.totalTransactions} transactions`}
              color="text-green-600"
            />

            <StatCard
              icon={DollarSign}
              title="Cash Sales"
              value={`₱${dailyStats.cashSales.toFixed(2)}`}
              subtitle={`${dailyStats.cashTransactions} transactions`}
              color="text-blue-600"
            />

            <StatCard
              icon={User}
              title="Utang Sales"
              value={`₱${dailyStats.utangSales.toFixed(2)}`}
              subtitle={`${dailyStats.utangTransactions} transactions`}
              color="text-orange-600"
            />

            <StatCard
              icon={Receipt}
              title="Payments Received"
              value={`₱${totalPaymentsToday.toFixed(2)}`}
              subtitle={`${todayPayments.length} payments`}
              color="text-purple-600"
            />
          </div>

          {/* Daily Summary Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Sales Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Cash Sales</span>
                    <div className="text-right">
                      <div className="font-medium text-sm md:text-base">₱{dailyStats.cashSales.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {dailyStats.totalSales > 0 
                          ? ((dailyStats.cashSales / dailyStats.totalSales) * 100).toFixed(1)
                          : 0
                        }%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Utang Sales</span>
                    <div className="text-right">
                      <div className="font-medium text-sm md:text-base">₱{dailyStats.utangSales.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
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
                <CardTitle className="text-base md:text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Total Transactions</span>
                    <Badge variant="secondary">{dailyStats.totalTransactions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Average Sale</span>
                    <span className="font-medium text-sm md:text-base">
                      ₱{dailyStats.totalTransactions > 0 
                        ? (dailyStats.totalSales / dailyStats.totalTransactions).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Cash vs Utang</span>
                    <span className="font-medium text-sm md:text-base">
                      {dailyStats.cashTransactions}:{dailyStats.utangTransactions}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utang" className="space-y-4">
          {/* Utang Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <StatCard
              icon={DollarSign}
              title="Total Outstanding"
              value={`₱${totalUtangOutstanding.toFixed(2)}`}
              color="text-red-600"
            />

            <StatCard
              icon={User}
              title="Customers with Utang"
              value={customersWithUtang.length.toString()}
              subtitle={`of ${customers.length} total customers`}
              color="text-orange-600"
            />

            <StatCard
              icon={TrendingUp}
              title="Average Utang"
              value={`₱${customersWithUtang.length > 0 
                ? (totalUtangOutstanding / customersWithUtang.length).toFixed(2)
                : '0.00'
              }`}
              color="text-purple-600"
            />
          </div>

          {/* Customer Utang Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Customer Utang Details</CardTitle>
            </CardHeader>
            <CardContent>
              {customersWithUtang.length > 0 ? (
                <div className="space-y-2">
                  {customersWithUtang
                    .sort((a, b) => b.totalOwed - a.totalOwed)
                    .map((customer) => (
                      <div key={customer.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{customer.name}</div>
                          <div className="text-xs md:text-sm text-gray-600 truncate">{customer.contact}</div>
                        </div>
                        <Badge variant="destructive" className="ml-2">
                          ₱{customer.totalOwed.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm md:text-base">
                  No outstanding utang accounts.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="space-y-2">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={sale.paymentType === 'cash' ? 'default' : 'secondary'} className="text-xs">
                            {sale.paymentType === 'cash' ? 'Cash' : 'Utang'}
                          </Badge>
                          {sale.customerName && (
                            <span className="text-xs md:text-sm text-gray-600 truncate">
                              {sale.customerName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.items.length} items • {new Date(sale.createdAt).toLocaleString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-bold text-green-600 text-sm md:text-base">
                          ₱{sale.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 text-sm md:text-base">
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
