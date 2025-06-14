
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Customer, UtangTransaction, UtangPayment } from '@/types';
import { 
  loadCustomers, 
  loadUtangTransactions, 
  loadUtangPayments,
  saveUtangTransactions,
  saveUtangPayments,
  saveCustomers,
  generateId 
} from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Receipt, User, CreditCard } from 'lucide-react';

const UtangDetails = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [utangTransactions, setUtangTransactions] = useState<UtangTransaction[]>([]);
  const [utangPayments, setUtangPayments] = useState<UtangPayment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<UtangTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCustomers(loadCustomers());
    setUtangTransactions(loadUtangTransactions());
    setUtangPayments(loadUtangPayments());
  }, []);

  const getCustomerUtangSummary = (customerId: string) => {
    const customerTransactions = utangTransactions.filter(t => t.customerId === customerId);
    const totalUtang = customerTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPaid = customerTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
    const remainingBalance = totalUtang - totalPaid;
    
    return {
      totalUtang,
      totalPaid,
      remainingBalance,
      transactions: customerTransactions
    };
  };

  const handleTransactionPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransaction || !paymentAmount) {
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

    if (amount > selectedTransaction.remainingBalance) {
      toast({
        title: "Payment Too Large",
        description: "Payment amount cannot exceed the remaining balance.",
        variant: "destructive"
      });
      return;
    }

    // Create payment record
    const payment: UtangPayment = {
      id: generateId(),
      customerId: selectedTransaction.customerId,
      amount,
      description: `Payment for ${selectedTransaction.productName}`,
      createdAt: new Date().toISOString()
    };

    // Update transaction
    const updatedTransaction = {
      ...selectedTransaction,
      amountPaid: selectedTransaction.amountPaid + amount,
      remainingBalance: selectedTransaction.remainingBalance - amount,
      status: (selectedTransaction.remainingBalance - amount <= 0) ? 'fully_paid' as const : 'partially_paid' as const,
      updatedAt: new Date().toISOString()
    };

    // Update customer total owed
    const customer = customers.find(c => c.id === selectedTransaction.customerId);
    if (customer) {
      const updatedCustomers = customers.map(c =>
        c.id === selectedTransaction.customerId
          ? { ...c, totalOwed: c.totalOwed - amount, updatedAt: new Date().toISOString() }
          : c
      );
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    }

    // Save updates
    const updatedTransactions = utangTransactions.map(t =>
      t.id === selectedTransaction.id ? updatedTransaction : t
    );
    const allPayments = [...utangPayments, payment];

    saveUtangTransactions(updatedTransactions);
    saveUtangPayments(allPayments);

    setUtangTransactions(updatedTransactions);
    setUtangPayments(allPayments);
    setPaymentAmount('');
    setIsPaymentDialogOpen(false);
    setSelectedTransaction(null);

    toast({
      title: "Payment Recorded",
      description: `Payment of ₱${amount.toFixed(2)} recorded for ${updatedTransaction.productName}.`
    });
  };

  const openPaymentDialog = (transaction: UtangTransaction) => {
    setSelectedTransaction(transaction);
    setPaymentAmount('');
    setIsPaymentDialogOpen(true);
  };

  const PaymentForm = () => (
    selectedTransaction && (
      <form onSubmit={handleTransactionPayment} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <p><strong>Product:</strong> {selectedTransaction.productName}</p>
          <p><strong>Quantity:</strong> {selectedTransaction.quantity}</p>
          <p><strong>Total Amount:</strong> ₱{selectedTransaction.totalAmount.toFixed(2)}</p>
          <p><strong>Amount Paid:</strong> ₱{selectedTransaction.amountPaid.toFixed(2)}</p>
          <p><strong>Remaining Balance:</strong> ₱{selectedTransaction.remainingBalance.toFixed(2)}</p>
        </div>
        
        <div>
          <label htmlFor="paymentAmount" className="block text-sm font-medium mb-2">
            Payment Amount (₱)
          </label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            min="0"
            max={selectedTransaction.remainingBalance}
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
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Utang Details</h2>
        <p className="text-sm md:text-base text-gray-600">Detailed credit tracking per customer and product</p>
      </div>

      {/* Customers with Utang */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {customers.filter(customer => customer.totalOwed > 0).map((customer) => {
          const utangSummary = getCustomerUtangSummary(customer.id);
          return (
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
                  <Badge variant="destructive" className="text-xs">
                    ₱{customer.totalOwed.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Utang:</span>
                    <span className="font-medium">₱{utangSummary.totalUtang.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-medium text-green-600">₱{utangSummary.totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Balance:</span>
                    <span className="text-red-600">₱{utangSummary.remainingBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Mobile View Details Button */}
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full touch-target">
                        <Receipt className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh]">
                      <SheetHeader className="mb-6">
                        <SheetTitle>{customer.name} - Utang Details</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4">
                        {utangSummary.transactions.map((transaction) => (
                          <Card key={transaction.id}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">{transaction.productName}</h4>
                                  <Badge variant={
                                    transaction.status === 'fully_paid' ? 'secondary' :
                                    transaction.status === 'partially_paid' ? 'outline' : 'destructive'
                                  }>
                                    {transaction.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Quantity:</span>
                                    <span>{transaction.quantity}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total:</span>
                                    <span>₱{transaction.totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Paid:</span>
                                    <span className="text-green-600">₱{transaction.amountPaid.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                    <span>Balance:</span>
                                    <span className="text-red-600">₱{transaction.remainingBalance.toFixed(2)}</span>
                                  </div>
                                </div>
                                {transaction.remainingBalance > 0 && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => openPaymentDialog(transaction)}
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Make Payment
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop View Details Button */}
                <div className="hidden md:block">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Receipt className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{customer.name} - Utang Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Paid</TableHead>
                              <TableHead>Balance</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {utangSummary.transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="font-medium">{transaction.productName}</TableCell>
                                <TableCell>{transaction.quantity}</TableCell>
                                <TableCell>₱{transaction.totalAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-green-600">₱{transaction.amountPaid.toFixed(2)}</TableCell>
                                <TableCell className="text-red-600">₱{transaction.remainingBalance.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    transaction.status === 'fully_paid' ? 'secondary' :
                                    transaction.status === 'partially_paid' ? 'outline' : 'destructive'
                                  }>
                                    {transaction.status.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {transaction.remainingBalance > 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => openPaymentDialog(transaction)}
                                    >
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      Pay
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Dialogs */}
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
      {customers.filter(customer => customer.totalOwed > 0).length === 0 && (
        <Card>
          <CardContent className="text-center py-8 md:py-12">
            <p className="text-gray-500 text-sm md:text-base">No customers with outstanding utang.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UtangDetails;
