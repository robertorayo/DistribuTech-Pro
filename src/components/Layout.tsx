import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { 
  Menu, Package, LogOut, Globe, User as UserIcon, LayoutDashboard, FileText, ShoppingCart
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface SidebarProps {
  onClose?: () => void;
  rol: string | null;
  user: any;
  location: any;
  menuItems: any[];
}

const SidebarContent: React.FC<SidebarProps> = ({ onClose, rol, user, location, menuItems }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight">DistribuTech</h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-semibold">{rol}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname.startsWith(item.path)
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
            {user?.user_metadata?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 truncate">
            <p className="font-medium text-gray-900 truncate">{user?.user_metadata?.nombre} {user?.user_metadata?.apellidos}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Layout: React.FC = () => {
  const { user, rol, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const menuItems = [
    { name: t('app.catalog'), path: '/catalogo', icon: <Package className="w-5 h-5" />, roles: ['cliente', 'comercial', 'admin'] },
    { name: t('app.admin_dashboard'), path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
    { name: t('app.admin_products'), path: '/admin/productos', icon: <Package className="w-5 h-5" />, roles: ['admin'] },
    { name: t('app.admin_categories'), path: '/admin/categorias', icon: <FileText className="w-5 h-5" />, roles: ['admin'] },
    { name: t('app.admin_manufacturers'), path: '/admin/fabricantes', icon: <FileText className="w-5 h-5" />, roles: ['admin'] },
    { name: t('app.comercial_management'), path: '/comercial', icon: <FileText className="w-5 h-5" />, roles: ['comercial', 'admin'] },
  ].filter(m => rol && m.roles.includes(rol));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Escritorio */}
      <aside className="hidden md:block w-72 shrink-0 h-full">
        <SidebarContent rol={rol} user={user} location={location} menuItems={menuItems} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Barra Superior Navbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            {/* Botón Menú Móvil */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger 
                render={
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">{t('app.nav_menu')}</SheetTitle>
                <SidebarContent 
                  rol={rol} 
                  user={user} 
                  location={location} 
                  menuItems={menuItems} 
                  onClose={() => setIsMobileMenuOpen(false)} 
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Botón Carrito */}
            <Link to="/checkout" className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors mr-1 sm:mr-3">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* Selector de Idiomas */}
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-600 h-8 px-3">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline-block">{i18n.language.toUpperCase()}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('es')}>Español</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menú de Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button variant="outline" size="sm" className="gap-2 rounded-full h-8 px-4 border-gray-200 text-gray-700">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="hidden sm:inline-block">Cuenta</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('app.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Zona Central */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

