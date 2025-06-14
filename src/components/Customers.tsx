import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer, UtangPayment, Sale } from '@/types';
import { 
  loadCustomers, 
  saveCustomers, 
  loadUtangPayments, 
  saveUtangPayments, 
  loadSales, 
  generateId 
} from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, User, DollarSign } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [utangPayments, setUtangPayments] = useState<UtangPayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setCustomers(loadCustomers());
    setUtangPayments(loadUtangPayments());
    setSales(loadSales());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    let updatedCustomers;
    
    if (editingCustomer) {
      // Update existing customer
      updatedCustomers = customers.map(customer =>
        customer.id === editingCustomer.id
          ? {
              ...customer,
              name: formData.name,
              contact: formData.contact,
              updatedAt: new Date().toISOString()
            }
          : customer
      );
      toast({
        title: "Customer Updated",
        description: `${formData.name} has been updated successfully.`
      });
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: generateId(),
        name: formData.name,
        contact: formData.contact,
        totalOwed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      updatedCustomers = [...customers, newCustomer];
      toast({
        title: "Customer Added",
        description: `${formData.name} has been added successfully.`
      });
    }

    saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    resetForm();
    setIsDialogOpen(false);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !paymentAmount) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }

    if (amount > selectedCustomer.totalOwed) {
      toast({
        title: "Payment Too Large",
        description: "Payment amount cannot exceed the outstanding balance.",
        variant: "destructive"
      });
      return;
    }

    // Create payment record
    const payment: UtangPayment = {
      id: generateId(),
      customerId: selectedCustomer.id,
      amount,
      description: `Payment for utang balance`,
      createdAt: new Date().toISOString()
    };

    // Update customer balance
    const updatedCustomers = customers.map(customer =>
      customer.id === selectedCustomer.id
        ? {
            ...customer,
            totalOwed: customer.totalOwed - amount,
            updatedAt: new Date().toISOString()
          }
        : customer
    );

    // Save updates
    const allPayments = [...utangPayments, payment];
    saveUtangPayments(allPayments);
    saveCustomers(updatedCustomers);

    setUtangPayments(allPayments);
    setCustomers(updatedCustomers);
    setPaymentAmount('');
    setIsPaymentDialogOpen(false);
    setSelectedCustomer(null);

    toast({
      title: "Payment Recorded",
      description: `Payment of ₱${amount.toFixed(2)} has been recorded.`
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (customer.totalOwed > 0) {
      toast({
        title: "Cannot Delete Customer",
        description: "Cannot delete customer with outstanding balance.",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      const updatedCustomers = customers.filter(c => c.id !== customer.id);
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      
      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted.`
      });
    }
  };

  const openPaymentDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setIsPaymentDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', contact: '' });
    setEditingCustomer(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCustomerTransactions = (customerId: string) => {
    const customerSales = sales.filter(sale => 
      sale.customerId === customerId && sale.paymentType === 'utang'
    );
    const customerPayments = utangPayments.filter(payment => 
      payment.customerId === customerId
    );
    
    return [...customerSales, ...customerPayments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customers and their utang (credit) accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Enter contact number"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {customer.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{customer.contact}</p>
                </div>
                <Badge 
                  variant={customer.totalOwed > 0 ? "destructive" : "secondary"}
                >
                  ₱{customer.totalOwed.toFixed(2)} owed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.totalOwed > 0 && (
                  <Button
                    size="sm"
                    className="w-full mb-2"
                    onClick={() => openPaymentDialog(customer)}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Record Payment
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(customer)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(customer)}
                    disabled={customer.totalOwed > 0}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>

                {/* Transaction History Preview */}
                {getCustomerTransactions(customer.id).length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Recent Activity:</p>
                    <div className="space-y-1">
                      {getCustomerTransactions(customer.id).slice(0, 2).map((transaction) => (
                        <div key={transaction.id} className="text-xs flex justify-between">
                          <span>
                            {'items' in transaction ? 'Purchase' : 'Payment'}
                          </span>
                          <span className={
                            'items' in transaction ? 'text-red-600' : 'text-green-600'
                          }>
                            {'items' in transaction ? '+' : '-'}₱{
                              ('total' in transaction ? transaction.total : transaction.amount).toFixed(2)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Customer:</strong> {selectedCustomer.name}</p>
                <p><strong>Outstanding Balance:</strong> ₱{selectedCustomer.totalOwed.toFixed(2)}</p>
              </div>
              
              <div>
                <Label htmlFor="paymentAmount">Payment Amount (₱)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCustomer.totalOwed}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Record Payment
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {customers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No customers added yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Customers;
