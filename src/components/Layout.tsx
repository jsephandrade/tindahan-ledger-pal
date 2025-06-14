
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  Menu,
  CreditCard
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/utang', icon: CreditCard, label: 'Utang' },
    { path: '/reports', icon: FileText, label: 'Reports' }
  ];

  const NavContent = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors touch-target ${
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t safe-area-pb z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">
                {item.label === 'Dashboard' ? 'Home' : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-lg font-semibold">Tindahan Ledger</h1>
          {navItems.length > 5 && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-target">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="py-4">
                  <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </header>
      )}

      <div className="md:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 min-h-screen bg-card border-r">
          <div className="p-6">
            <h1 className="text-xl font-bold text-primary mb-8">Tindahan Ledger</h1>
            <NavContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${isMobile ? 'pb-20' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Layout;
