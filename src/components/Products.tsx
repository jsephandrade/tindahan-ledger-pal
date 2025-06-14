
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Product } from '@/types';
import { loadProducts, saveProducts, generateId } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products & Inventory</h2>
          <p className="text-gray-600">Manage your store's product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sku">SKU/Code</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Enter SKU or product code"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Update Product' : 'Add Product'}
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600">{product.sku}</p>
                </div>
                <Badge 
                  variant={product.stockQuantity > 10 ? "secondary" : 
                    product.stockQuantity > 0 ? "outline" : "destructive"}
                >
                  {product.stockQuantity} in stock
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  ₱{product.unitPrice.toFixed(2)}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No products found matching your search.' : 'No products added yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Products;
