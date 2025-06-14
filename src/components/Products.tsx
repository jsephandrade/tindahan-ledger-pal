
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MobileForm, MobileFormField, MobileFormActions } from '@/components/ui/mobile-form';
import { MobileInput } from '@/components/ui/mobile-input';
import { MobileButton } from '@/components/ui/mobile-button';
import { Product } from '@/types';
import { loadProducts, saveProducts, generateId } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Edit, Trash, Search } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unitPrice: '',
    stockQuantity: ''
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.unitPrice || !formData.stockQuantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice);
    const stockQuantity = parseInt(formData.stockQuantity);

    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid unit price.",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid stock quantity.",
        variant: "destructive"
      });
      return;
    }

    let updatedProducts;
    
    if (editingProduct) {
      // Update existing product
      updatedProducts = products.map(product =>
        product.id === editingProduct.id
          ? {
              ...product,
              name: formData.name,
              sku: formData.sku,
              unitPrice,
              stockQuantity,
              updatedAt: new Date().toISOString()
            }
          : product
      );
      toast({
        title: "Product Updated",
        description: `${formData.name} has been updated successfully.`
      });
    } else {
      // Check for duplicate SKU
      if (products.some(p => p.sku === formData.sku)) {
        toast({
          title: "Duplicate SKU",
          description: "A product with this SKU already exists.",
          variant: "destructive"
        });
        return;
      }

      // Create new product
      const newProduct: Product = {
        id: generateId(),
        name: formData.name,
        sku: formData.sku,
        unitPrice,
        stockQuantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      updatedProducts = [...products, newProduct];
      toast({
        title: "Product Added",
        description: `${formData.name} has been added successfully.`
      });
    }

    saveProducts(updatedProducts);
    setProducts(updatedProducts);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      unitPrice: product.unitPrice.toString(),
      stockQuantity: product.stockQuantity.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      const updatedProducts = products.filter(p => p.id !== product.id);
      saveProducts(updatedProducts);
      setProducts(updatedProducts);
      
      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted.`
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', unitPrice: '', stockQuantity: '' });
    setEditingProduct(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const ProductForm = () => (
    <MobileForm onSubmit={handleSubmit}>
      <MobileFormField
        label="Product Name"
        required
      >
        <MobileInput
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter product name"
          required
        />
      </MobileFormField>
      
      <MobileFormField
        label="SKU/Code"
        required
      >
        <MobileInput
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="Enter SKU or product code"
          required
        />
      </MobileFormField>
      
      <MobileFormField
        label="Unit Price (₱)"
        required
      >
        <MobileInput
          type="number"
          step="0.01"
          min="0"
          value={formData.unitPrice}
          onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
          placeholder="0.00"
          required
        />
      </MobileFormField>
      
      <MobileFormField
        label="Stock Quantity"
        required
      >
        <MobileInput
          type="number"
          min="0"
          value={formData.stockQuantity}
          onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
          placeholder="0"
          required
        />
      </MobileFormField>
      
      <MobileFormActions>
        <MobileButton type="submit" fullWidth>
          {editingProduct ? 'Update Product' : 'Add Product'}
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

  return (
    <div className="mobile-container">
      <div className="mobile-section-spacing">
        {/* Header */}
        <div className="space-y-3">
          <div>
            <h2 className="mobile-title">Products & Inventory</h2>
            <p className="mobile-subtitle">Manage your store's product catalog</p>
          </div>

          {/* Add Button */}
          {isMobile ? (
            <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <SheetTrigger asChild>
                <MobileButton onClick={openAddDialog} fullWidth>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </MobileButton>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] mobile-sheet-content">
                <SheetHeader className="mb-6">
                  <SheetTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </SheetTitle>
                </SheetHeader>
                <ProductForm />
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <MobileButton onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </MobileButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <ProductForm />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card className="mobile-card">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <MobileInput
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="mobile-grid-1-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="mobile-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="mobile-title truncate">{product.name}</CardTitle>
                    <p className="mobile-subtitle truncate">{product.sku}</p>
                  </div>
                  <Badge 
                    variant={product.stockQuantity > 10 ? "secondary" : 
                      product.stockQuantity > 0 ? "outline" : "destructive"}
                    className="mobile-badge"
                  >
                    {product.stockQuantity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="mobile-item-spacing">
                <div className="text-xl font-bold text-green-600">
                  ₱{product.unitPrice.toFixed(2)}
                </div>
                
                <div className="mobile-button-group">
                  <MobileButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    fullWidth
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash className="h-3 w-3" />
                  </MobileButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="mobile-card">
            <CardContent className="text-center py-12">
              <p className="mobile-subtitle mb-4">
                {searchTerm ? 'No products found matching your search.' : 'No products added yet.'}
              </p>
              {!searchTerm && (
                <MobileButton onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </MobileButton>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Products;
