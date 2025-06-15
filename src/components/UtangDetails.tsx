import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MobileForm, MobileFormField, MobileFormActions } from '@/components/ui/mobile-form';
import { MobileInput } from '@/components/ui/mobile-input';
import { MobileButton } from '@/components/ui/mobile-button';
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
import { useIsMobile } from '@/hooks/use-mobile';

const UtangDetails = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [utangTransactions, setUtangTransactions] = useState<UtangTransaction[]>([]);
  const [utangPayments, setUtangPayments] = useState<UtangPayment[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<UtangTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

    // Calculate change if overpayment
    const change = amount > selectedTransaction.remainingBalance ? amount - selectedTransaction.remainingBalance : 0;
    const actualPayment = Math.min(amount, selectedTransaction.remainingBalance);

    // Create payment record
    const payment: UtangPayment = {
      id: generateId(),
      customerId: selectedTransaction.customerId,
      amount: actualPayment,
      description: change > 0 
        ? `Payment for ${selectedTransaction.productName} (Change: ₱${change.toFixed(2)})`
        : `Payment for ${selectedTransaction.productName}`,
      createdAt: new Date().toISOString()
    };

    // Update transaction
    const updatedTransaction = {
      ...selectedTransaction,
      amountPaid: selectedTransaction.amountPaid + actualPayment,
      remainingBalance: selectedTransaction.remainingBalance - actualPayment,
      status: (selectedTransaction.remainingBalance - actualPayment <= 0) ? 'fully_paid' as const : 'partially_paid' as const,
      updatedAt: new Date().toISOString()
    };

    // Update customer total owed
    const customer = customers.find(c => String(c.id) === String(selectedTransaction.customerId));
    if (customer) {
      const updatedCustomers = customers.map(c =>
        String(c.id) === String(selectedTransaction.customerId)
          ? { ...c, totalOwed: c.totalOwed - actualPayment, updatedAt: new Date().toISOString() }
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
      description: change > 0 
        ? `Payment of ₱${actualPayment.toFixed(2)} recorded for ${updatedTransaction.productName}. Change: ₱${change.toFixed(2)}`
        : `Payment of ₱${actualPayment.toFixed(2)} recorded for ${updatedTransaction.productName}.`
    });
  };

  const openPaymentDialog = (transaction: UtangTransaction) => {
    setSelectedTransaction(transaction);
    setPaymentAmount('');
    setIsPaymentDialogOpen(true);
  };

  const PaymentForm = () => {
    const amount = parseFloat(paymentAmount) || 0;
    const change = selectedTransaction && amount > selectedTransaction.remainingBalance ? amount - selectedTransaction.remainingBalance : 0;

    return (
      selectedTransaction && (
        <MobileForm onSubmit={handleTransactionPayment}>
          <div className="bg-muted/50 p-4 rounded-lg mobile-item-spacing">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Product:</span>
                <span>{selectedTransaction.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Quantity:</span>
                <span>{selectedTransaction.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>₱{selectedTransaction.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Paid:</span>
                <span className="text-green-600">₱{selectedTransaction.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Balance:</span>
                <span className="text-red-600">₱{selectedTransaction.remainingBalance.toFixed(2)}</span>
              </div>
            </div>
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
              required
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
              <DollarSign className="h-4 w-4 mr-2" />
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
        <div className="text-center space-y-2">
          <h2 className="mobile-title">Utang Details</h2>
          <p className="mobile-subtitle">Track customer credit and payments</p>
        </div>

        {/* Customers with Utang */}
        <div className="mobile-grid-1-3">
          {customers.filter(customer => customer.totalOwed > 0).map((customer) => {
            const utangSummary = getCustomerUtangSummary(String(customer.id));
            return (
              <Card key={customer.id} className="mobile-card">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 truncate">
                        <User className="h-4 w-4 flex-shrink-0" />
                        {customer.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate mt-1">{customer.contact}</p>
                    </div>
                    <Badge variant="destructive" className="mobile-badge">
                      ₱{customer.totalOwed.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="mobile-item-spacing">
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

                  <Sheet>
                    <SheetTrigger asChild>
                      <MobileButton variant="outline" fullWidth>
                        <Receipt className="h-4 w-4 mr-2" />
                        View Details
                      </MobileButton>
                    </SheetTrigger>
                    <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : "w-[400px] sm:w-[540px]"}>
                      <SheetHeader className="mb-6">
                        <SheetTitle>{customer.name} - Utang Details</SheetTitle>
                      </SheetHeader>
                      <div className="mobile-item-spacing">
                        {utangSummary.transactions.map((transaction) => (
                          <Card key={transaction.id} className="mobile-card">
                            <CardContent className="p-4">
                              <div className="mobile-item-spacing">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">{transaction.productName}</h4>
                                  <Badge variant={
                                    transaction.status === 'fully_paid' ? 'secondary' :
                                    transaction.status === 'partially_paid' ? 'outline' : 'destructive'
                                  } className="mobile-badge">
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
                                  <MobileButton
                                    size="sm"
                                    fullWidth
                                    onClick={() => openPaymentDialog(transaction)}
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Make Payment
                                  </MobileButton>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Dialog */}
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm />
            </DialogContent>
          </Dialog>
        )}

        {/* Empty State */}
        {customers.filter(customer => customer.totalOwed > 0).length === 0 && (
          <Card className="mobile-card">
            <CardContent className="text-center py-12">
              <p className="mobile-subtitle">No customers with outstanding utang.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UtangDetails;
