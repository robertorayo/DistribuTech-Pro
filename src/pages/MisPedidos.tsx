import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency, useFormatDate } from '../lib/formatters';
import { toast } from 'sonner';
import { ClipboardList, AlertTriangle, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  LoadingScreen,
  PageHeader,
  DataTable,
  StatusBadge,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalFooter,
  EmptyState,
} from '../components/shared';

interface ItemDisponible {
  producto_id: string;
  nombre: string;
  cantidad_pedida: number;
  cantidad_disponible: number;
  cantidad_faltante: number;
}

interface NotasStock {
  disponible: ItemDisponible[];
  faltante: ItemDisponible[];
}

export const MisPedidos: React.FC = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const [loading, setLoading] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<any | null>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [accionLoading, setAccionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) cargarPedidos();
  }, [session]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('usuario_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCotizaciones(data || []);
    } catch (err: any) {
      toast.error('Error al cargar pedidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = async (cot: any) => {
    setCotizacionSeleccionada(cot);
    setCargandoDetalles(true);
    try {
      const { data, error } = await supabase
        .from('detalle_cotizacion')
        .select('*, productos(nombre, precio)')
        .eq('cotizacion_id', cot.id);
      if (error) throw error;
      setDetalles(data || []);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const cerrarModal = () => {
    setCotizacionSeleccionada(null);
    setDetalles([]);
  };

  // Acción: Dividir en 2 pedidos
  const handleDividir = async () => {
    if (!cotizacionSeleccionada) return;
    setAccionLoading('dividir');
    try {
      const { data, error } = await supabase.rpc('dividir_cotizacion', {
        p_cotizacion_id: cotizacionSeleccionada.id,
      });
      if (error) throw error;
      toast.success(t('mispedidos.split_success'));
      cerrarModal();
      cargarPedidos();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setAccionLoading(null);
    }
  };

  // Acción: Cancelar pedido
  const handleCancelar = async () => {
    if (!cotizacionSeleccionada) return;
    setAccionLoading('cancelar');
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: 'rechazada', tipo_incidencia: null, updated_at: new Date().toISOString() })
        .eq('id', cotizacionSeleccionada.id)
        .eq('usuario_id', session!.user.id);
      if (error) throw error;
      toast.success(t('mispedidos.cancel_success'));
      cerrarModal();
      cargarPedidos();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setAccionLoading(null);
    }
  };

  // Acción: Esperar stock completo
  const handleMantener = async () => {
    if (!cotizacionSeleccionada) return;
    setAccionLoading('mantener');
    try {
      const { error } = await supabase.rpc('mantener_cotizacion_pendiente', {
        p_cotizacion_id: cotizacionSeleccionada.id,
      });
      if (error) throw error;
      toast.success(t('mispedidos.wait_success'));
      cerrarModal();
      cargarPedidos();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setAccionLoading(null);
    }
  };

  const getIncidenciaBadge = (cot: any) => {
    if (cot.tipo_incidencia === 'pendiente_decision_cliente') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> {t('mispedidos.action_required')}
        </span>
      );
    }
    if (cot.tipo_incidencia === 'esperando_stock_completo') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
          <Hourglass className="w-3 h-3" /> {t('mispedidos.waiting_stock')}
        </span>
      );
    }
    if (cot.tipo_incidencia === 'esperando_stock') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
          <Hourglass className="w-3 h-3" /> {t('mispedidos.backorder')}
        </span>
      );
    }
    return null;
  };

  // Parsear notas de stock
  const notasStock = useMemo((): NotasStock | null => {
    if (!cotizacionSeleccionada?.notas_stock) return null;
    if (cotizacionSeleccionada.tipo_incidencia !== 'pendiente_decision_cliente') return null;
    try {
      return JSON.parse(cotizacionSeleccionada.notas_stock) as NotasStock;
    } catch {
      return null;
    }
  }, [cotizacionSeleccionada]);

  const esDecisionPendiente = cotizacionSeleccionada?.tipo_incidencia === 'pendiente_decision_cliente';

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={t('mispedidos.title')}
        subtitle={t('mispedidos.subtitle')}
        icon={ClipboardList}
      />

      <DataTable columns={[t('common.id'), t('common.date'), t('common.status'), t('mispedidos.incident'), t('common.total'), t('common.actions')]}>
        {cotizaciones.length === 0 ? (
          <tr>
            <td colSpan={6}>
              <EmptyState icon={ClipboardList} title={t('mispedidos.no_orders')} />
            </td>
          </tr>
        ) : (
          cotizaciones.map((cot) => (
            <tr key={cot.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs text-gray-400">#{cot.id.split('-')[0]}</td>
              <td className="px-6 py-4 text-gray-600">{formatDate(cot.created_at)}</td>
              <td className="px-6 py-4">
                <StatusBadge status={cot.estado} />
              </td>
              <td className="px-6 py-4">{getIncidenciaBadge(cot) || <span className="text-gray-300 text-xs">—</span>}</td>
              <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(cot.total || 0)}</td>
              <td className="px-6 py-4 text-center">
                <Button variant="outline" size="sm" onClick={() => abrirDetalle(cot)}>
                  {t('mispedidos.view')}
                </Button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Modal de Detalle */}
      {cotizacionSeleccionada && (
        <ModalOverlay onClose={cerrarModal} maxWidth="max-w-3xl">
          <ModalHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{t('mispedidos.detail_title')}</h3>
                <p className="text-xs text-gray-400 mt-1">ID: {cotizacionSeleccionada.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={cerrarModal} className="text-gray-400">&times;</Button>
            </div>
          </ModalHeader>

          <ModalBody>
            {cargandoDetalles ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">

                {/* Alerta de incidencia — Pendiente decisión */}
                {esDecisionPendiente && notasStock && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      {t('mispedidos.stock_alert_title')}
                    </div>
                    <p className="text-sm text-amber-700">{t('mispedidos.stock_alert_desc')}</p>

                    {/* Tabla de disponibilidad */}
                    <div className="overflow-hidden rounded-lg border border-amber-200">
                      <table className="w-full text-xs">
                        <thead className="bg-amber-100 text-amber-800">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold uppercase">{t('common.product')}</th>
                            <th className="px-3 py-2 text-center font-bold uppercase">{t('mispedidos.ordered')}</th>
                            <th className="px-3 py-2 text-center font-bold uppercase text-green-700">{t('mispedidos.available')}</th>
                            <th className="px-3 py-2 text-center font-bold uppercase text-red-700">{t('mispedidos.missing')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-amber-100">
                          {notasStock.disponible.map((item) => (
                            <tr key={item.producto_id}>
                              <td className="px-3 py-2 font-medium text-gray-800">{item.nombre}</td>
                              <td className="px-3 py-2 text-center">{item.cantidad_pedida}</td>
                              <td className="px-3 py-2 text-center font-bold text-green-600">{item.cantidad_disponible}</td>
                              <td className="px-3 py-2 text-center font-bold text-red-500">{item.cantidad_faltante}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-amber-600 font-medium">{t('mispedidos.choose_option')}</p>
                  </div>
                )}

                {/* Alerta informativa — Esperando stock completo */}
                {cotizacionSeleccionada.tipo_incidencia === 'esperando_stock_completo' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                    <Hourglass className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-sm">{t('mispedidos.waiting_full_stock_msg')}</p>
                  </div>
                )}

                {/* Nota informativa general */}
                {cotizacionSeleccionada.notas_stock && !esDecisionPendiente && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800 mb-1">{t('mispedidos.notes')}</p>
                    <p>{cotizacionSeleccionada.notas_stock.startsWith('{') ? t('mispedidos.processed') : cotizacionSeleccionada.notas_stock}</p>
                  </div>
                )}

                {/* Detalle de productos */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase">{t('common.product')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-center">{t('common.quantity')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-right">{t('common.unit_price')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-right">{t('common.subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detalles.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{d.productos?.nombre}</td>
                          <td className="px-4 py-3 text-center font-bold">{d.cantidad}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(d.precio_unitario)}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatCurrency(d.precio_unitario * d.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('common.total')}</span>
                  <span className="text-2xl font-black text-blue-700">{formatCurrency(cotizacionSeleccionada.total || 0)}</span>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {esDecisionPendiente ? (
              <>
                <Button variant="outline" onClick={cerrarModal} disabled={!!accionLoading}>
                  {t('common.close')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelar}
                  disabled={!!accionLoading}
                >
                  {accionLoading === 'cancelar' ? '...' : t('mispedidos.cancel_order')}
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={handleMantener}
                  disabled={!!accionLoading}
                >
                  {accionLoading === 'mantener' ? '...' : t('mispedidos.wait_full_stock')}
                </Button>
                {notasStock?.disponible.some(item => item.cantidad_disponible > 0) && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleDividir}
                    disabled={!!accionLoading}
                  >
                    {accionLoading === 'dividir' ? '...' : t('mispedidos.split_order')}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" onClick={cerrarModal}>{t('common.close')}</Button>
            )}
          </ModalFooter>
        </ModalOverlay>
      )}
    </div>
  );
};
