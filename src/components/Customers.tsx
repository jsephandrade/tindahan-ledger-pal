import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { Plus, Edit, Trash, User, DollarSign, History } from 'lucide-react';

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

  const CustomerForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Customer Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter customer name"
          className="input-touch"
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
          className="input-touch"
          required
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button type="submit" className="flex-1 btn-touch">
          {editingCustomer ? 'Update Customer' : 'Add Customer'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          className="flex-1 btn-touch"
          onClick={() => setIsDialogOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  const PaymentForm = () => (
    selectedCustomer && (
      <form onSubmit={handlePayment} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
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
            className="input-touch"
            required
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button type="submit" className="flex-1 btn-touch">
            Record Payment
          </Button>
          <Button 
            type="button" 
            variant="outline"
            className="flex-1 btn-touch"
            onClick={() => setIsPaymentDialogOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    )
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-sm md:text-base text-gray-600">Manage customers and their utang (credit) accounts</p>
        </div>

        {/* Mobile Add Button */}
        <div className="md:hidden">
          <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <SheetTrigger asChild>
              <Button onClick={openAddDialog} className="w-full btn-touch">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="mb-6">
                <SheetTitle>
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </SheetTitle>
              </SheetHeader>
              <CustomerForm />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Add Button */}
        <div className="hidden md:block">
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
              <CustomerForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 truncate">
                    <User className="h-4 w-4 flex-shrink-0" />
                    {customer.name}
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{customer.contact}</p>
                </div>
                <Badge 
                  variant={customer.totalOwed > 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  ₱{customer.totalOwed.toFixed(2)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.totalOwed > 0 && (
                <Button
                  size="sm"
                  className="w-full touch-target"
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
                  className="flex-1 touch-target"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(customer)}
                  disabled={customer.totalOwed > 0}
                  className="touch-target"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>

              {/* Transaction History Preview */}
              {getCustomerTransactions(customer.id).length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-1 mb-2">
                    <History className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Recent Activity:</p>
                  </div>
                  <div className="space-y-1">
                    {getCustomerTransactions(customer.id).slice(0, 2).map((transaction) => (
                      <div key={transaction.id} className="text-xs flex justify-between items-center">
                        <span className="truncate">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog - Mobile */}
      <div className="md:hidden">
        <Sheet open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="mb-6">
              <SheetTitle>Record Payment</SheetTitle>
            </SheetHeader>
            <PaymentForm />
          </SheetContent>
        </Sheet>
      </div>

      {/* Payment Dialog - Desktop */}
      <div className="hidden md:block">
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 md:py-12">
            <p className="text-gray-500 text-sm md:text-base">No customers added yet.</p>
            <Button onClick={openAddDialog} className="mt-4 btn-touch">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Customer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Customers;
