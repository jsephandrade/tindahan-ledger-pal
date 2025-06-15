
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Customer, Sale, SaleItem, UtangTransaction } from '@/types';
import { 
  loadProducts, 
  loadCustomers, 
  saveSales, 
  loadSales, 
  saveProducts, 
  saveCustomers,
  saveUtangTransactions,
  loadUtangTransactions,
  generateId 
} from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Trash, DollarSign, User, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { fetchProducts, fetchCustomers, createUtang } from '@/utils/api';
import type { UtangPayload } from '@/utils/api';

const MobilePOS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'utang'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
  const loadApiData = async () => {
    try {
      // ─── Fetch & map products ───────────────────────────────────────────────
      const prods = await fetchProducts();
      console.log('API products →', prods);
      const mappedProds: Product[] = prods.map(p => ({
        id:            p.id,
        name:          p.name,
        sku:           p.sku,
        unitPrice:     Number(p.unitPrice),     // snake_case → camelCase + Number()
        stockQuantity: p.stockQuantity,         // snake_case → camelCase
        createdAt:     p.createdAt,
        updatedAt:     p.updatedAt,
      }));
      setProducts(mappedProds);

      // ─── Fetch & map customers ──────────────────────────────────────────────
      const custs = await fetchCustomers();
      console.log('API customers →', custs);
      const mappedCusts: Customer[] = custs.map(c => ({
        id:        c.id,
        name:      c.name,
        contact:   c.contact ?? '',              // Ensure contact is present, fallback to empty string if missing
        totalOwed: Number(c.totalOwed),         // snake_case → camelCase + Number()
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // …any other fields your Customer type needs
      }));
      setCustomers(mappedCusts);

    } catch (err) {
      console.error('Failed to load API data', err);
    }
  };

  loadApiData();
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

    const existingItem = cart.find(item => item.productId === String(product.id));
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stockQuantity} units available.`,
          variant: "destructive"
        });
        return;
      }
      updateQuantity(String(product.id), existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        productId: String(product.id),
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

    const product = products.find(p => String(p.id) === productId);
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

  // ─── Process sale & POST utang if needed ───────────────────────────────
  const processSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add items before checkout.', variant: 'destructive' });
      return;
    }
    if (paymentType === 'utang' && !selectedCustomer) {
      toast({ title: 'Select Customer', description: 'Choose a customer for credit sale.', variant: 'destructive' });
      return;
    }

    // 1) Build local Sale object
    const total    = calculateTotal();
    const customer = customers.find(c => String(c.id) === selectedCustomer);
    const sale: Sale = {
      id:           generateId(),
      items:        [...cart],
      subtotal:     total,
      total:        total,
      paymentType,
      customerId:   paymentType === 'utang' ? selectedCustomer : undefined,
      customerName: paymentType === 'utang' ? customer?.name : undefined,
      createdAt:    new Date().toISOString(),
      status:       'completed',
    };

    // 2) Update local stock & customer balances
    const updatedProducts = products.map(p => {
      const item = cart.find(i => i.productId === String(p.id));
      return item
        ? { ...p, stockQuantity: p.stockQuantity - item.quantity, updatedAt: new Date().toISOString() }
        : p;
    });
    const updatedCustomers = paymentType === 'utang' && customer
      ? customers.map(c =>
          String(c.id) === selectedCustomer
            ? { ...c, totalOwed: c.totalOwed + total, updatedAt: new Date().toISOString() }
            : c
        )
      : customers;

    // 3) Build utang payloads for API
    const utangPayloads: UtangPayload[] = paymentType === 'utang' && customer
      ? cart.map(item => ({
          customer:     Number(selectedCustomer),
          product:      Number(item.productId),
          sale:         Number(sale.id),
          quantity:     item.quantity,
          unit_price:   item.unitPrice,
          total_amount: item.total,
          amount_paid:  0,
          remaining:    item.total,
          status:       'unpaid',
        }))
      : [];

    // 4) Persist locally
    saveSales([...loadSales(), sale]);
    saveProducts(updatedProducts);
    saveCustomers(updatedCustomers);
    saveUtangTransactions([
      ...loadUtangTransactions(),
      ...utangPayloads.map(p => ({
        id:               generateId(),
        customerId:       String(p.customer),
        saleId:           p.sale.toString(),
        productId:        p.product.toString(),
        productName:      cart.find(i => i.productId === String(p.product))?.productName || '',
        quantity:         p.quantity,
        unitPrice:        p.unit_price,
        totalAmount:      p.total_amount,
        amountPaid:       p.amount_paid,
        remainingBalance: p.remaining,
        status:           p.status,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      }))
    ]);

    // 5) POST utang to server
    if (utangPayloads.length) {
      try {
        await Promise.all(utangPayloads.map(p => createUtang(p)));
        toast({ title: 'Credit transactions saved on server!' });
      } catch (err) {
        console.error(err);
        toast({
          title: 'Server error',
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
    }

    // 6) Clear UI state
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    setCart([]);
    setSelectedCustomer('');
    setPaymentType('cash');
    setIsCartOpen(false);

    toast({
      title: 'Sale Completed',
      description: `Processed ₱${total.toFixed(2)} successfully.`,
    });
  };

  return (
    <div className="mobile-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Point of Sale</h2>
          <p className="text-sm text-gray-600">Process sales quickly</p>
        </div>
        
        {/* Mobile Cart Button */}
        <div className="md:hidden">
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96">
              {/* Mobile Cart Content */}
              <div className="h-full flex flex-col">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-lg font-semibold">Shopping Cart ({cart.length} items)</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Cart is empty</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.productId} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.productName}</h4>
                            <p className="text-xs text-gray-600">₱{item.unitPrice.toFixed(2)} each</p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="font-semibold">
                            ₱{item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₱{calculateTotal().toFixed(2)}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Type</label>
                        <Select value={paymentType} onValueChange={(value: 'cash' | 'utang') => setPaymentType(value)}>
                          <SelectTrigger className="h-12">
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
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose customer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={String(customer.id)}>
                                  {customer.name} (₱{customer.totalOwed.toFixed(2)} owed)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button 
                        onClick={processSale} 
                        className="w-full h-12 text-base font-semibold" 
                        disabled={cart.length === 0}
                      >
                        Process Sale
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Search Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base"
          />
        </CardContent>
      </Card>

      {/* Mobile Product Grid */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => addToCart(product)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                  <p className="text-xl font-bold text-green-600">₱{product.unitPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <Badge variant={product.stockQuantity > 10 ? "secondary" : "destructive"} className="mb-2">
                    {product.stockQuantity} stock
                  </Badge>
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
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
                                <SelectItem key={customer.id} value={String(customer.id)}>
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

export default MobilePOS;
