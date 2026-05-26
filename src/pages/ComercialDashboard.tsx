import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Clock, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency, useFormatDate } from '../lib/formatters';
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
  FilterBar,
  SearchInput,
  selectClasses,
  Pagination
} from '../components/shared';

export const ComercialDashboard: React.FC = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<any | null>(null);
  const [detallesCotizacion, setDetallesCotizacion] = useState<any[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Estados de filtrado y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);

  const cargarDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsRes, cotRes] = await Promise.all([
        supabase.from('usuarios').select('*').eq('rol', 'cliente'),
        supabase.from('cotizaciones').select('*, cliente:usuarios!usuario_id(*)').order('created_at', { ascending: false })
      ]);
      if (clientsRes.error) throw clientsRes.error;
      if (cotRes.error) throw cotRes.error;
      setClientes(clientsRes.data || []);
      setCotizaciones(cotRes.data || []);
    } catch (error: any) {
      toast.error(`${t('common.error')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (session?.user?.id) {
      cargarDashboard();
    }
  }, [session, cargarDashboard]);

  const abrirRevision = async (cot: any) => {
    setCotizacionSeleccionada(cot);
    setCargandoDetalles(true);
    try {
      const { data, error } = await supabase
        .from('detalle_cotizacion')
        .select('*, productos(*, fabricantes(nombre))')
        .eq('cotizacion_id', cot.id);
      if (error) throw error;
      setDetallesCotizacion(data || []);
    } catch (error: any) {
      toast.error(`${t('common.error')} ${error.message}`);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!cotizacionSeleccionada) return;

    // Aprobación: usar la RPC para control de stock
    if (nuevoEstado === 'aprobada') {
      try {
        const { data, error } = await (supabase.rpc as any)('aprobar_cotizacion', {
          p_cotizacion_id: cotizacionSeleccionada.id,
        });
        if (error) throw error;

        if (data.resultado === 'aprobada') {
          toast.success(t('comercial.approved_ok'));
        } else if (data.resultado === 'pendiente_decision_cliente') {
          toast.warning(t('comercial.stock_insufficient'), {
            description: t('comercial.client_notified'),
            duration: 6000,
          });
        }
        setCotizacionSeleccionada(null);
        cargarDashboard();
      } catch (error: any) {
        toast.error(`${t('common.error')} ${error.message}`);
      }
      return;
    }

    // Rechazo: update directo
    try {
      const { error } = await (supabase
        .from('cotizaciones') as any)
        .update({ estado: nuevoEstado })
        .eq('id', cotizacionSeleccionada.id);
      if (error) throw error;
      toast.success(t('comercial.status_updated', { status: nuevoEstado }));
      setCotizacionSeleccionada(null);
      cargarDashboard();
    } catch (error: any) {
      toast.error(`${t('common.error')} ${error.message}`);
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterEstado('all');
    setSortBy('date-desc');
  };

  const cotizacionesFiltradas = useMemo(() => {
    let result = cotizaciones.filter(cot => {
      const nombreCompleto = `${cot.cliente?.nombre} ${cot.cliente?.apellidos}`.toLowerCase();
      const matchSearch = nombreCompleto.includes(searchTerm.toLowerCase()) ||
        cot.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cot.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = filterEstado === 'all' || cot.estado === filterEstado;
      return matchSearch && matchEstado;
    });

    // Ordenación
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'total-asc':
        result.sort((a, b) => (a.total || 0) - (b.total || 0));
        break;
      case 'total-desc':
        result.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
    }

    return result;
  }, [cotizaciones, searchTerm, filterEstado, sortBy]);

  const itemsPerPage = 15;
  const totalPages = Math.ceil(cotizacionesFiltradas.length / itemsPerPage);
  const paginaEfectiva = currentPage > totalPages ? 1 : currentPage;
  const cotizacionesPaginadas = useMemo(() => {
    const start = (paginaEfectiva - 1) * itemsPerPage;
    return cotizacionesFiltradas.slice(start, start + itemsPerPage);
  }, [cotizacionesFiltradas, paginaEfectiva]);

  if (loading) return <LoadingScreen />;

  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
  const isFilterActive = searchTerm !== '' || filterEstado !== 'all' || sortBy !== 'date-desc';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={t('comercial.title')}
        subtitle={t('comercial.subtitle')}
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('comercial.clients')}</CardTitle>
            <Users className="w-5 h-5 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">{clientes.length}</div>
            <p className="text-xs text-green-600 font-medium mt-1">{t('comercial.active_platform')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('comercial.pending_quotes')}</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">{pendientes.length}</div>
            <p className="text-xs text-orange-600 font-medium mt-1">{t('comercial.quotes_to_review')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-primary/5/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">{t('comercial.pipeline')}</CardTitle>
            <FileText className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary tracking-tighter">
              {formatCurrency(pendientes.reduce((acc, curr) => acc + (curr.total || 0), 0))}
            </div>
            <p className="text-xs text-primary font-medium mt-1">{t('comercial.potential_revenue')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">{t('comercial.table_title')}</h2>
          <FilterBar onClear={limpiarFiltros} showClear={isFilterActive}>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('catalog.search_placeholder')}
              className="w-full sm:max-w-xs"
            />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className={`${selectClasses} py-2 text-xs w-full sm:w-40`}
            >
              <option value="all">{t('crud.all_status')}</option>
              <option value="pendiente">{t('common.status_pending')}</option>
              <option value="aprobada">{t('common.status_approved')}</option>
              <option value="rechazada">{t('common.status_rejected')}</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${selectClasses} py-2 text-xs w-full sm:w-48`}
            >
              <option value="date-desc">{t('catalog.sort_by')}</option>
              <option value="date-desc">{t('comercial.sort_recent')}</option>
              <option value="date-asc">{t('comercial.sort_oldest')}</option>
              <option value="total-desc">{t('comercial.sort_price_desc')}</option>
              <option value="total-asc">{t('comercial.sort_price_asc')}</option>
            </select>
          </FilterBar>
        </div>

        <DataTable columns={[
          t('common.id'),
          t('common.client'),
          t('common.date'),
          t('common.status'),
          t('common.total'),
          t('common.actions')
        ]}>
          {cotizacionesFiltradas.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState icon={Clock} title={t('comercial.no_quotes')} />
              </td>
            </tr>
          ) : (
            cotizacionesPaginadas.map(cot => (
              <tr key={cot.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs text-muted-foreground/70">#{cot.id.split('-')[0]}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <p className="font-bold text-foreground">{cot.cliente?.nombre} {cot.cliente?.apellidos}</p>
                  <p className="text-xs text-muted-foreground">{cot.cliente?.email}</p>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-muted-foreground text-xs sm:text-sm">{formatDate(cot.created_at)}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <StatusBadge status={cot.estado} />
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                  <span className="font-black text-foreground text-base sm:text-lg">{formatCurrency(cot.total || 0)}</span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                  <Button variant="outline" size="sm" className="font-semibold" onClick={() => abrirRevision(cot)}>
                    {t('comercial.review')}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>

        <Pagination
          currentPage={paginaEfectiva}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {cotizacionSeleccionada && (
        <ModalOverlay onClose={() => setCotizacionSeleccionada(null)} maxWidth="max-w-4xl">
          <ModalHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">{t('comercial.quote_review')}</h3>
                <p className="text-xs text-muted-foreground/70 mt-1">ID: #{cotizacionSeleccionada.id.split('-')[0]}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCotizacionSeleccionada(null)} className="text-muted-foreground/70">&times;</Button>
            </div>
          </ModalHeader>
          <ModalBody className="bg-muted/10/30">
            {cargandoDetalles ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card p-4 sm:p-6 rounded-xl border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">{t('common.client')}</p>
                    <p className="font-bold text-foreground text-lg">{cotizacionSeleccionada.cliente?.nombre} {cotizacionSeleccionada.cliente?.apellidos}</p>
                    <p className="text-sm text-muted-foreground">{cotizacionSeleccionada.cliente?.email}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">{t('common.total')}</p>
                    <p className="font-black text-primary text-2xl sm:text-3xl">{formatCurrency(cotizacionSeleccionada.total || 0)}</p>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/10 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase">{t('common.product')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-center">{t('common.quantity')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-right">{t('common.unit_price')}</th>
                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-right">{t('common.subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detallesCotizacion.map(d => (
                        <tr key={d.id} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-medium text-foreground">{d.productos?.nombre}</td>
                          <td className="px-4 py-3 text-center font-bold">{d.cantidad}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(d.precio_unitario)}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatCurrency(d.precio_unitario * d.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setCotizacionSeleccionada(null)}>{t('common.close')}</Button>
            {cotizacionSeleccionada.estado === 'pendiente' && !['esperando_stock', 'esperando_stock_completo', 'pendiente_decision_cliente'].includes(cotizacionSeleccionada.tipo_incidencia) && (
              <>
                <Button variant="destructive" onClick={() => cambiarEstado('rechazada')}>{t('comercial.reject')}</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => cambiarEstado('aprobada')}>{t('comercial.approve')}</Button>
              </>
            )}
            {['esperando_stock', 'esperando_stock_completo', 'pendiente_decision_cliente'].includes(cotizacionSeleccionada.tipo_incidencia) && (
              <span className="text-amber-600 font-medium text-sm px-4">
                {t('comercial.waiting_client_or_stock')}
              </span>
            )}
          </ModalFooter>
        </ModalOverlay>
      )}
    </div>
  );
};

