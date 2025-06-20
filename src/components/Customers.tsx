import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MobileForm, MobileFormField, MobileFormActions } from '@/components/ui/mobile-form';
import { MobileInput } from '@/components/ui/mobile-input';
import { MobileButton } from '@/components/ui/mobile-button';
import { Customer, UtangPayment, Sale } from '@/types';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer
} from '@/utils/api';
import {
  loadUtangPayments,
  saveUtangPayments,
  loadSales,
  generateId
} from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
      });
    setUtangPayments(loadUtangPayments());
    setSales(loadSales());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (editingCustomer.id) {
        await apiUpdateCustomer(Number(editingCustomer.id), {
          name: formData.name,
          contact: formData.contact
        });
        toast({ title: 'Customer Updated', description: `${formData.name} updated.` });
      }
      updatedCustomers = await fetchCustomers();
    } else {
      await createCustomer({ name: formData.name, contact: formData.contact });
      updatedCustomers = await fetchCustomers();
      toast({ title: 'Customer Added', description: `${formData.name} added.` });
    }
    setCustomers(updatedCustomers);
    resetForm();
    setIsDialogOpen(false);
  };

  const handlePayment = async (e: React.FormEvent) => {
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

    // Calculate change if overpayment
    const change = amount > selectedCustomer.totalOwed ? amount - selectedCustomer.totalOwed : 0;
    const actualPayment = Math.min(amount, selectedCustomer.totalOwed);

    // Create payment record
    const payment: UtangPayment = {
      id: generateId(),
      customerId: String(selectedCustomer.id),
      amount: actualPayment,
      description: change > 0 
        ? `Payment for utang balance (Change: ₱${change.toFixed(2)})`
        : `Payment for utang balance`,
      createdAt: new Date().toISOString()
    };

    // Update customer balance
    const updatedCustomers = customers.map(customer =>
      customer.id === selectedCustomer.id
        ? {
            ...customer,
            totalOwed: customer.totalOwed - actualPayment,
            updatedAt: new Date().toISOString()
          }
        : customer
    );

    const allPayments = [...utangPayments, payment];
    saveUtangPayments(allPayments);

    if (selectedCustomer.id) {
      await apiUpdateCustomer(Number(selectedCustomer.id), {
        totalOwed: selectedCustomer.totalOwed - actualPayment
      });
    }

    setUtangPayments(allPayments);
    setCustomers(updatedCustomers);
    setPaymentAmount('');
    setIsPaymentDialogOpen(false);
    setSelectedCustomer(null);

    toast({
      title: "Payment Recorded",
      description: change > 0 
        ? `Payment of ₱${actualPayment.toFixed(2)} recorded. Change: ₱${change.toFixed(2)}`
        : `Payment of ₱${actualPayment.toFixed(2)} has been recorded.`
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

  const handleDelete = async (customer: Customer) => {
    if (customer.totalOwed > 0) {
      toast({
        title: "Cannot Delete Customer",
        description: "Cannot delete customer with outstanding balance.",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      if (customer.id) {
        await apiDeleteCustomer(Number(customer.id));
        const updatedCustomers = await fetchCustomers();
        setCustomers(updatedCustomers);
        toast({ title: 'Customer Deleted', description: `${customer.name} deleted.` });
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contact: '' });
    setEditingCustomer(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openPaymentDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setIsPaymentDialogOpen(true);
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
    <MobileForm onSubmit={handleSubmit}>
      <MobileFormField
        label="Customer Name"
        required
      >
        <MobileInput
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter customer name"
        />
      </MobileFormField>
      
      <MobileFormField
        label="Contact Number"
        required
      >
        <MobileInput
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          placeholder="Enter contact number"
        />
      </MobileFormField>
      
      <MobileFormActions>
        <MobileButton type="submit" fullWidth>
          {editingCustomer ? 'Update Customer' : 'Add Customer'}
        </MobileButton>
        <MobileButton 
          type="button" 
          variant="outline"
          fullWidth
          onClick={() => setIsDialogOpen(false)}
        >
          Cancel
        </MobileButton>
      </MobileFormActions>
    </MobileForm>
  );

  const PaymentForm = () => {
    const amount = parseFloat(paymentAmount) || 0;
    const change = selectedCustomer && amount > selectedCustomer.totalOwed ? amount - selectedCustomer.totalOwed : 0;

    return (
      selectedCustomer && (
        <MobileForm onSubmit={handlePayment}>
          <div className="bg-gray-50 p-4 rounded-lg mobile-item-spacing">
            <p className="text-sm"><strong>Customer:</strong> {selectedCustomer.name}</p>
            <p className="text-sm"><strong>Outstanding Balance:</strong> ₱{selectedCustomer.totalOwed.toFixed(2)}</p>
          </div>
          
          <MobileFormField
            label="Payment Amount (₱)"
            required
          >
            <MobileInput
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
            />
          </MobileFormField>

          {change > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Change to give:</strong> ₱{change.toFixed(2)}
              </p>
            </div>
          )}
          
          <MobileFormActions>
            <MobileButton type="submit" fullWidth>
              Record Payment
            </MobileButton>
            <MobileButton 
              type="button" 
              variant="outline"
              fullWidth
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </MobileButton>
          </MobileFormActions>
        </MobileForm>
      )
    );
  };

  return (
    <div className="mobile-container">
      <div className="mobile-section-spacing">
        {/* Header */}
        <div className="space-y-3">
          <div>
            <h2 className="mobile-title">Customer Management</h2>
            <p className="mobile-subtitle">Manage customers and their utang (credit) accounts</p>
          </div>

          {/* Add Button */}
          {isMobile ? (
            <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <SheetTrigger asChild>
                <MobileButton onClick={openAddDialog} fullWidth>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </MobileButton>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] mobile-sheet-content">
                <SheetHeader className="mb-6">
                  <SheetTitle>
                    {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </SheetTitle>
                </SheetHeader>
                <CustomerForm />
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <MobileButton onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </MobileButton>
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
          )}
        </div>

        {/* Customers Grid */}
        <div className="mobile-grid-1-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="mobile-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="mobile-title flex items-center gap-2 truncate">
                      <User className="h-4 w-4 flex-shrink-0" />
                      {customer.name}
                    </CardTitle>
                    <p className="mobile-subtitle truncate">{customer.contact}</p>
                  </div>
                  <Badge 
                    variant={customer.totalOwed > 0 ? "destructive" : "secondary"}
                    className="mobile-badge"
                  >
                    ₱{Number(customer.totalOwed).toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="mobile-item-spacing">
                {customer.totalOwed > 0 && (
                  <MobileButton
                    size="sm"
                    fullWidth
                    onClick={() => openPaymentDialog(customer)}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Record Payment
                  </MobileButton>
                )}
                
                <div className="mobile-button-group">
                  <MobileButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(customer)}
                    fullWidth
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(customer)}
                    disabled={customer.totalOwed > 0}
                  >
                    <Trash className="h-3 w-3" />
                  </MobileButton>
                </div>

                {/* Transaction History Preview */}
                {getCustomerTransactions(String(customer.id)).length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-1 mb-2">
                      <History className="h-3 w-3 text-gray-500" />
                      <p className="text-xs text-gray-500">Recent Activity:</p>
                    </div>
                    <div className="space-y-1">
                      {getCustomerTransactions(String(customer.id)).slice(0, 2).map((transaction) => (
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
        {isMobile ? (
          <Sheet open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <SheetContent side="bottom" className="h-[80vh] mobile-sheet-content">
              <SheetHeader className="mb-6">
                <SheetTitle>Record Payment</SheetTitle>
              </SheetHeader>
              <PaymentForm />
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm />
            </DialogContent>
          </Dialog>
        )}

        {/* Empty State */}
        {customers.length === 0 && (
          <Card className="mobile-card">
            <CardContent className="text-center py-12">
              <p className="mobile-subtitle mb-4">No customers added yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Customers;
