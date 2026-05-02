import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, FileText, TrendingUp, Package, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { LoadingScreen, PageHeader } from '../components/shared';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usuarios: 0,
    clientes: 0,
    comerciales: 0,
    cotizacionesTotal: 0,
    ingresosAprobados: 0,
    productosActivos: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [usersRes, cotRes, prodRes] = await Promise.all([
        supabase.from('usuarios').select('rol'),
        supabase.from('cotizaciones').select('estado, total'),
        supabase.from('productos').select('*', { count: 'exact', head: true })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (cotRes.error) throw cotRes.error;
      if (prodRes.error) throw prodRes.error;

      const users = usersRes.data || [];
      const cots = cotRes.data || [];

      setStats({
        usuarios: users.length,
        clientes: users.filter(u => u.rol === 'cliente').length,
        comerciales: users.filter(u => u.rol === 'comercial').length,
        cotizacionesTotal: cots.length,
        ingresosAprobados: cots.filter(c => c.estado === 'aprobada').reduce((acc, curr) => acc + (curr.total || 0), 0),
        productosActivos: prodRes.count || 0
      });
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title={t('admin.title')} 
        subtitle={t('admin.subtitle')}
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50 z-0"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('admin.approved_revenue')}</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-gray-900 tracking-tighter">{formatCurrency(stats.ingresosAprobados)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('admin.operations_volume')}</CardTitle>
            <FileText className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{stats.cotizacionesTotal}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">{t('admin.quotes_issued')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('admin.client_base')}</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{stats.clientes}</div>
            <p className="text-xs text-purple-600 font-medium mt-1">{t('admin.active_sales')}: {stats.comerciales}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('admin.active_catalog')}</CardTitle>
            <Package className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{stats.productosActivos}</div>
            <p className="text-xs text-orange-600 font-medium mt-1">{t('admin.product_refs')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 text-center mt-12 shadow-inner">
        <h3 className="text-2xl font-black text-blue-900 mb-3 tracking-tight">{t('admin.mvp_ready')}</h3>
        <p className="text-blue-700/80 max-w-2xl mx-auto font-medium">
          {t('admin.mvp_description')}
        </p>
      </div>
    </div>
  );
};

