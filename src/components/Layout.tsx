import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { 
  Menu, Package, LogOut, Globe, User as UserIcon, LayoutDashboard, FileText, ShoppingCart, ClipboardList, Building2, Sun, Moon
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SidebarProps {
  onClose?: () => void;
  rol: string | null;
  user: any;
  location: any;
  menuItems: any[];
}

const SidebarContent: React.FC<SidebarProps> = ({ onClose, rol, user, location, menuItems }) => {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold text-primary tracking-tight">DistribuTech</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-semibold">{rol}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname.startsWith(item.path)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {item.icon}
                {item.name}
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-foreground">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            {user?.user_metadata?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 truncate">
            <p className="font-medium text-foreground truncate">{user?.user_metadata?.nombre} {user?.user_metadata?.apellidos}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Layout: React.FC = () => {
  const { user, rol, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    if (!rol || !user?.id) return;

    // Función para actualizar contador de incidencias del cliente
    const fetchIncidents = async () => {
      if (rol !== 'cliente') return;
      const { count, error } = await supabase
        .from('cotizaciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .eq('tipo_incidencia', 'pendiente_decision_cliente');
      
      if (!error && count !== null) {
        setIncidentCount(count);
      }
    };

    fetchIncidents();
    
    // Suscripción a cambios en tiempo real
    const filter = rol === 'cliente' ? `usuario_id=eq.${user.id}` : undefined;
    
    const subscription = supabase
      .channel('cotizaciones_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cotizaciones', filter }, (payload: any) => {
        const { new: newRow, old: oldRow } = payload;
        
        // Si el cliente tiene incidencias, actualizar el contador
        if (rol === 'cliente') {
          fetchIncidents();
        }

        // Notificación de aprobación automática por stock
        if (newRow.tipo_incidencia === 'auto_aprobado' && oldRow.tipo_incidencia !== 'auto_aprobado') {
          if (rol === 'cliente') {
            toast.success(t('app.auto_approved_toast_client', { id: newRow.id.split('-')[0] }), { duration: 6000 });
          } else {
            toast.info(t('app.auto_approved_toast_staff', { id: newRow.id.split('-')[0] }), { duration: 6000 });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [rol, user, t]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguageLabel = i18n.language?.startsWith('en') ? 'English' : 'Español';

  const menuItems = [
    { name: t('app.catalog'), path: '/catalogo', icon: <Package className="w-5 h-5" />, roles: ['cliente', 'comercial', 'admin'] },
    { name: t('app.my_orders'), path: '/mis-pedidos', icon: <ClipboardList className="w-5 h-5" />, roles: ['cliente'], badge: incidentCount },
    { name: t('app.about_us', 'Sobre Nosotros'), path: '/sobre-nosotros', icon: <Building2 className="w-5 h-5" />, roles: ['cliente'] },
    { name: t('app.admin_dashboard'), path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
    { name: t('app.admin_products'), path: '/admin/productos', icon: <Package className="w-5 h-5" />, roles: ['admin', 'comercial'] },
    { name: t('app.admin_categories'), path: '/admin/categorias', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'comercial'] },
    { name: t('app.admin_manufacturers'), path: '/admin/fabricantes', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'comercial'] },
    { name: t('app.comercial_management'), path: '/comercial', icon: <FileText className="w-5 h-5" />, roles: ['comercial', 'admin'] },
  ].filter(m => rol && m.roles.includes(rol));

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar Escritorio */}
      <aside className="hidden md:block w-72 shrink-0 h-full border-r border-border">
        <SidebarContent rol={rol} user={user} location={location} menuItems={menuItems} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Barra Superior Navbar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
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
            <Link to="/checkout" className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors mr-1 sm:mr-3">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* Toggle Tema Oscuro/Claro */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground h-8 w-8 p-0" 
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Selector de Idiomas */}
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button variant="ghost" size="sm" className="gap-2 text-foreground h-8 px-3">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline-block">{currentLanguageLabel}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="center" className="min-w-[7.5rem] bg-popover border border-border rounded-md shadow-md">
                <DropdownMenuItem className="justify-center" onClick={() => changeLanguage('es')}>
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem className="justify-center" onClick={() => changeLanguage('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menú de Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <Button variant="outline" size="sm" className="gap-2 rounded-full h-8 px-4 border-border text-foreground">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="hidden sm:inline-block">Cuenta</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="center" className="min-w-[var(--anchor-width)] bg-popover border border-border rounded-md shadow-md">
                <DropdownMenuItem
                  className="justify-center gap-2 text-foreground hover:bg-muted cursor-pointer font-medium border-b border-border pb-2 mb-1"
                  onClick={() => navigate('/perfil')}
                >
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  {t('app.my_profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="justify-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  {t('app.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Zona Central */}
        <main className="flex-1 overflow-auto p-3 sm:p-8 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

