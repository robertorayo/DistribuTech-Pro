import React, { useState, useEffect } from 'react';
import { ProductoConDetalles } from '../pages/Catalogo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ShoppingCart, Check, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from 'react-i18next';

interface ProductoDetalleProps {
  producto: ProductoConDetalles | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductoDetalle: React.FC<ProductoDetalleProps> = ({ producto, isOpen, onClose }) => {
  const [cantidad, setCantidad] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { t, i18n } = useTranslation();

  // Reiniciar cantidad cuando se abre un nuevo producto
  useEffect(() => {
    if (isOpen) setCantidad(1);
  }, [isOpen]);

  if (!producto) return null;

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(valor);
  };

  // El campo jsonb viene como objeto en Supabase
  const especificaciones = producto.especificaciones_tecnicas as Record<string, any>;

  const handleAddToCart = () => {
    addItem(producto, cantidad);
    toast.success(`${cantidad}x ${producto.nombre} ${t('catalog.added_to_cart')}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden gap-0 bg-card shadow-2xl rounded-2xl border-0 max-h-[95dvh] flex flex-col">
        
        {/* Cabecera Oculta para Accesibilidad (Requerido por Radix UI) */}
        <DialogTitle className="sr-only">Detalles de {producto.nombre}</DialogTitle>
        <DialogDescription className="sr-only">{producto.descripcion}</DialogDescription>

        {/* Encabezado visual: Banner gris suave y título */}
        <div className="bg-muted/10/80 p-4 sm:p-6 border-b border-border/50 flex flex-row items-start gap-4 relative shrink-0">
           <div className="w-16 h-16 sm:w-24 sm:h-24 bg-card rounded-xl border border-border flex items-center justify-center shadow-sm shrink-0">
             <span className="text-gray-300 font-semibold text-[10px] text-center px-1">{t('common.no_img')}</span>
           </div>
           
           <div className="flex-1 space-y-1.5 min-w-0">
             <div className="flex items-center flex-wrap gap-2">
               <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-primary/10/50 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                 {producto.categorias?.nombre || 'General'}
               </span>
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                 {producto.fabricantes?.nombre || 'Marca Blanca'}
               </span>
             </div>
             
             <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-tight line-clamp-2">
               {producto.nombre}
             </h2>
             
             <div className="flex items-end gap-2">
               <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
                 {formatearMoneda(producto.precio)}
               </span>
               <span className="text-xs font-medium text-muted-foreground mb-0.5">/ud (Sin IVA)</span>
             </div>
           </div>
        </div>

        {/* Cuerpo Inferior: Descripción, Specs y Controles — con scroll */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 bg-card">
            
            {/* Columna Izquierda: Información — en mobile va ABAJO del panel de compra */}
            <div className="md:col-span-2 space-y-5 order-2 md:order-1">
              <section>
                <h4 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary/80" /> {t('product.description')}
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {producto.descripcion || t('product.no_description')}
                </p>
              </section>

              {especificaciones && Object.keys(especificaciones).length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary/80" /> {t('product.specifications')}
                  </h4>
                  <div className="bg-muted/10/50 rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(especificaciones).map(([key, value]) => (
                          <tr key={key} className="hover:bg-muted/10 transition-colors">
                            <th className="px-3 sm:px-5 py-2.5 font-semibold text-foreground w-2/5 sm:w-1/3 bg-muted/30/50 capitalize text-xs">
                              {key.replace(/_/g, ' ')}
                            </th>
                            <td className="px-3 sm:px-5 py-2.5 text-muted-foreground font-medium text-xs sm:text-sm">
                              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Columna Derecha: Controles de Compra — en mobile va ARRIBA */}
            <div className="bg-muted/10/80 p-4 sm:p-5 rounded-2xl border border-border/50 h-fit space-y-4 shadow-sm order-1 md:order-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">{t('product.availability')}</p>
                <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border/50 shadow-sm w-fit">
                  <span className="relative flex h-2.5 w-2.5">
                    {producto.stock > 0 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </>
                    )}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${producto.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {producto.stock > 0 ? t('product.stock_units', { count: producto.stock }) : t('product.out_of_stock')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/60">
                <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest block">{t('product.quantity')}</label>
                <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden shadow-sm">
                  <button 
                    className="px-4 py-2.5 bg-muted/10 hover:bg-muted/30 text-muted-foreground font-bold border-r border-border transition-colors disabled:opacity-30 disabled:hover:bg-muted/10"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    disabled={cantidad <= 1}
                  >-</button>
                  <input 
                    type="number" 
                    value={cantidad} 
                    onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                    className="w-full text-center py-2.5 text-base font-bold text-foreground focus:outline-none"
                    min="1"
                    max={producto.stock}
                  />
                  <button 
                    className="px-4 py-2.5 bg-muted/10 hover:bg-muted/30 text-muted-foreground font-bold border-l border-border transition-colors disabled:opacity-30 disabled:hover:bg-muted/10"
                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                    disabled={cantidad >= producto.stock || producto.stock === 0}
                  >+</button>
                </div>
              </div>

              <Button 
                className="w-full gap-2 font-bold shadow-md hover:shadow-lg transition-all" 
                size="lg"
                disabled={producto.stock === 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" /> 
                {producto.stock > 0 ? t('product.add_to_cart') : t('product.no_stock')}
              </Button>

              {producto.stock > 0 && (
                <p className="text-[11px] font-medium text-muted-foreground text-center flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" /> {t('product.shipping_info')}
                </p>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
