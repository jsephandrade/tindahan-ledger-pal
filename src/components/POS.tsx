import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Customer, Sale, SaleItem } from '@/types';
import { loadProducts, loadCustomers, saveSales, loadSales, saveProducts, saveCustomers } from '@/utils/storage';
import { generateId } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Trash, DollarSign, User } from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'utang'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setProducts(loadProducts());
    setCustomers(loadCustomers());
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stockQuantity} units available.`,
          variant: "destructive"
        });
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stockQuantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stockQuantity} units available.`,
        variant: "destructive"
      });
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: item.unitPrice * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const processSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing sale.",
        variant: "destructive"
      });
      return;
    }

    if (paymentType === 'utang' && !selectedCustomer) {
      toast({
        title: "Select Customer",
        description: "Please select a customer for utang transactions.",
        variant: "destructive"
      });
      return;
    }

    // Create sale record
    const total = calculateTotal();
    const customer = customers.find(c => c.id === selectedCustomer);
    
    const sale: Sale = {
      id: generateId(),
      items: [...cart],
      subtotal: total,
      total: total,
      paymentType,
      customerId: paymentType === 'utang' ? selectedCustomer : undefined,
      customerName: paymentType === 'utang' ? customer?.name : undefined,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    // Update product stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.productId === product.id);
      if (cartItem) {
        return {
          ...product,
          stockQuantity: product.stockQuantity - cartItem.quantity,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    // Update customer utang if applicable
    let updatedCustomers = customers;
    if (paymentType === 'utang' && customer) {
      updatedCustomers = customers.map(c =>
        c.id === selectedCustomer
          ? { ...c, totalOwed: c.totalOwed + total, updatedAt: new Date().toISOString() }
          : c
      );
    }

    // Save everything
    const allSales = loadSales();
    saveSales([...allSales, sale]);
    saveProducts(updatedProducts);
    saveCustomers(updatedCustomers);

    // Update state
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    setCart([]);
    setSelectedCustomer('');
    setPaymentType('cash');

    toast({
      title: "Sale Completed",
      description: `Sale of ₱${total.toFixed(2)} processed successfully.`
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Point of Sale</h2>
        <p className="text-gray-600">Process sales and manage transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Selection
            </CardTitle>
            <div className="relative">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {product.sku} • ₱{product.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={product.stockQuantity > 10 ? "secondary" : "destructive"}>
                      {product.stockQuantity} in stock
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.productName}</div>
                          <div className="text-xs text-gray-600">₱{item.unitPrice.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-16 text-right font-medium">
                          ₱{item.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Section */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₱{calculateTotal().toFixed(2)}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Type</label>
                        <Select value={paymentType} onValueChange={(value: 'cash' | 'utang') => setPaymentType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Cash Payment
                              </div>
                            </SelectItem>
                            <SelectItem value="utang">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Utang (Credit)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentType === 'utang' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Select Customer</label>
                          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose customer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} (₱{customer.totalOwed.toFixed(2)} owed)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button 
                        onClick={processSale} 
                        className="w-full" 
                        size="lg"
                        disabled={cart.length === 0}
                      >
                        Process Sale
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;
