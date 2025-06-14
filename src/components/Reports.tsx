
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
    <Card className="mobile-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-bold ${color} truncate`}>
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
    <div className="mobile-container">
      <div className="mobile-section-spacing">
        {/* Header */}
        <div>
          <h2 className="mobile-title">Reports & Analytics</h2>
          <p className="mobile-subtitle">Overview of your store's performance and finances</p>
        </div>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="daily" className="text-xs py-3">
              Daily Summary
            </TabsTrigger>
            <TabsTrigger value="utang" className="text-xs py-3">
              Utang Report
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs py-3">
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mobile-item-spacing">
            {/* Daily Stats Grid */}
            <div className="mobile-stats-grid">
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
            <div className="mobile-grid-1-2">
              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="mobile-title">Sales Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mobile-item-spacing">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cash Sales</span>
                      <div className="text-right">
                        <div className="font-medium text-sm">₱{dailyStats.cashSales.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {dailyStats.totalSales > 0 
                            ? ((dailyStats.cashSales / dailyStats.totalSales) * 100).toFixed(1)
                            : 0
                          }%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Utang Sales</span>
                      <div className="text-right">
                        <div className="font-medium text-sm">₱{dailyStats.utangSales.toFixed(2)}</div>
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

              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="mobile-title">Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mobile-item-spacing">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Transactions</span>
                      <Badge variant="secondary" className="mobile-badge">{dailyStats.totalTransactions}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Sale</span>
                      <span className="font-medium text-sm">
                        ₱{dailyStats.totalTransactions > 0 
                          ? (dailyStats.totalSales / dailyStats.totalTransactions).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cash vs Utang</span>
                      <span className="font-medium text-sm">
                        {dailyStats.cashTransactions}:{dailyStats.utangTransactions}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="utang" className="mobile-item-spacing">
            {/* Utang Stats */}
            <div className="mobile-grid-1-3">
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
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-title">Customer Utang Details</CardTitle>
              </CardHeader>
              <CardContent>
                {customersWithUtang.length > 0 ? (
                  <div className="mobile-item-spacing">
                    {customersWithUtang
                      .sort((a, b) => b.totalOwed - a.totalOwed)
                      .map((customer) => (
                        <div key={customer.id} className="mobile-list-item">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{customer.name}</div>
                              <div className="text-xs text-gray-600 truncate">{customer.contact}</div>
                            </div>
                            <Badge variant="destructive" className="ml-2 mobile-badge">
                              ₱{customer.totalOwed.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 mobile-subtitle">
                    No outstanding utang accounts.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mobile-item-spacing">
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-title flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSales.length > 0 ? (
                  <div className="mobile-item-spacing">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="mobile-list-item">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={sale.paymentType === 'cash' ? 'default' : 'secondary'} 
                                className="mobile-badge"
                              >
                                {sale.paymentType === 'cash' ? 'Cash' : 'Utang'}
                              </Badge>
                              {sale.customerName && (
                                <span className="text-xs text-gray-600 truncate">
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
                            <div className="font-bold text-green-600 text-sm">
                              ₱{sale.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 mobile-subtitle">
                    No transactions recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
