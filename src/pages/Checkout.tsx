import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, PackageOpen, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { 
  PageHeader, 
  EmptyState 
} from '../components/shared';

export const Checkout: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const subtotal = getSubtotal();
  const iva = subtotal * 0.21; 
  const total = subtotal + iva;

  const handleGenerarCotizacion = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const { data: cotizacion, error: cotError } = await (supabase
        .from('cotizaciones') as any)
        .insert({
          usuario_id: session.user.id,
          creado_por: session.user.id,
          estado: 'pendiente'
        })
        .select()
        .single();

      if (cotError) throw cotError;

      const detalles = items.map((item) => ({
        cotizacion_id: cotizacion.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio,
        tipo_iva: item.producto.tipo_iva || 21.00
      }));

      const { error: detError } = await (supabase.from('detalle_cotizacion') as any).insert(detalles);
      if (detError) throw detError;

      toast.success(t('checkout.success'));
      clearCart();
      navigate('/catalogo'); 
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState 
        icon={PackageOpen} 
        title={t('checkout.empty_title')} 
        description={t('checkout.empty_subtitle')}
        actionLabel={t('checkout.back')}
        onAction={() => navigate('/catalogo')}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title={t('checkout.title')} 
        subtitle={t('checkout.subtitle')}
        icon={ShoppingCart}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Productos */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.producto.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="w-24 h-24 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('common.no_img')}</span>
              </div>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <h3 className="font-bold text-gray-900 line-clamp-1">{item.producto.nombre}</h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1 mb-3">
                  {item.producto.fabricantes?.nombre || 'General'}
                </p>
                <p className="font-black text-blue-600 text-lg">
                  {formatCurrency(item.producto.precio)} <span className="text-xs text-gray-400 font-medium">/ud</span>
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm h-10">
                  <button 
                    className="px-3 hover:bg-gray-50 text-gray-600 font-bold border-r border-gray-200 transition-colors h-full disabled:opacity-30"
                    onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                  >-</button>
                  <span className="w-12 text-center text-sm font-bold">{item.cantidad}</span>
                  <button 
                    className="px-3 hover:bg-gray-50 text-gray-600 font-bold border-l border-gray-200 transition-colors h-full disabled:opacity-30"
                    onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                    disabled={item.cantidad >= item.producto.stock}
                  >+</button>
                </div>
                
                <p className="font-bold text-gray-900 min-w-[80px] text-right text-lg">
                  {formatCurrency(item.producto.precio * item.cantidad)}
                </p>

                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 rounded-full" onClick={() => removeItem(item.producto.id)} title={t('common.delete')}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Panel de Totales */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl shadow-blue-900/5 h-fit sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" /> {t('checkout.summary')}
          </h3>
          
          <div className="space-y-4 text-sm text-gray-600 mb-8">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('checkout.base')}</span>
              <span className="font-bold text-gray-900 text-base">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">IVA (21%)</span>
              <span className="font-bold text-gray-900 text-base">{formatCurrency(iva)}</span>
            </div>
            <div className="border-t border-gray-100 pt-5 flex justify-between items-end mt-2">
              <span className="font-bold text-gray-900 uppercase tracking-widest text-xs">{t('checkout.total')}</span>
              <span className="text-3xl font-black text-blue-700 tracking-tighter">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button 
            className="w-full gap-2 font-bold shadow-lg hover:shadow-xl transition-all h-12 text-base" 
            size="lg"
            disabled={loading || items.length === 0}
            onClick={handleGenerarCotizacion}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>{t('checkout.send')} <ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
          <p className="text-[11px] text-gray-400 text-center mt-5 font-medium leading-relaxed">
            {t('checkout.disclaimer')}
          </p>
        </div>

      </div>
    </div>
  );
};
