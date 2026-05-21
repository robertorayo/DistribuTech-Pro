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
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden gap-0 bg-white shadow-2xl rounded-2xl border-0">
        
        {/* Cabecera Oculta para Accesibilidad (Requerido por Radix UI) */}
        <DialogTitle className="sr-only">Detalles de {producto.nombre}</DialogTitle>
        <DialogDescription className="sr-only">{producto.descripcion}</DialogDescription>

        {/* Encabezado visual: Banner gris suave y título */}
        <div className="bg-gray-50/80 p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
           {/* Hueco para futura imagen real */}
           <div className="w-32 h-32 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
             <span className="text-gray-300 font-semibold text-sm">{t('common.no_img')}</span>
           </div>
           
           <div className="flex-1 space-y-3 text-center sm:text-left">
             <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
               <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100/50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                 {producto.categorias?.nombre || 'General'}
               </span>
               <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                 {producto.fabricantes?.nombre || 'Marca Blanca'}
               </span>
             </div>
             
             <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
               {producto.nombre}
             </h2>
             
             <div className="flex items-end justify-center sm:justify-start gap-2 pt-1">
               <span className="text-4xl font-black text-gray-900 tracking-tighter">
                 {formatearMoneda(producto.precio)}
               </span>
               <span className="text-sm font-medium text-gray-500 mb-1.5">/ud (Sin IVA)</span>
             </div>
           </div>
        </div>

        {/* Cuerpo Inferior: Descripción, Specs y Controles */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 bg-white">
          
          {/* Columna Izquierda: Información */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> {t('product.description')}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {producto.descripcion || t('product.no_description')}
              </p>
            </section>

            {especificaciones && Object.keys(especificaciones).length > 0 && (
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" /> {t('product.specifications')}
                </h4>
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(especificaciones).map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <th className="px-5 py-3 font-semibold text-gray-900 w-1/3 bg-gray-100/50 capitalize text-xs">
                            {key.replace(/_/g, ' ')}
                          </th>
                          <td className="px-5 py-3 text-gray-600 font-medium">
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

          {/* Columna Derecha: Controles de Compra */}
          <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 h-fit space-y-6 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('product.availability')}</p>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm w-fit">
                <div className={`w-2.5 h-2.5 rounded-full ${producto.stock > 0 ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                <span className={`text-xs font-bold uppercase tracking-wider ${producto.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {producto.stock > 0 ? t('product.stock_units', { count: producto.stock }) : t('product.out_of_stock')}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200/60">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t('product.quantity')}</label>
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <button 
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-r border-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-gray-50"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >-</button>
                <input 
                  type="number" 
                  value={cantidad} 
                  onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                  className="w-full text-center py-2.5 text-base font-bold text-gray-900 focus:outline-none"
                  min="1"
                  max={producto.stock}
                />
                <button 
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-l border-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-gray-50"
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
              <p className="text-[11px] font-medium text-gray-500 text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-500" /> {t('product.shipping_info')}
              </p>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};
