import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, FileText, TrendingUp, Package, LayoutDashboard } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { LoadingScreen, PageHeader } from '../components/shared';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
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
        supabase.from('cotizaciones').select('estado, total, created_at'),
        supabase.from('productos').select('*', { count: 'exact', head: true })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (cotRes.error) throw cotRes.error;
      if (prodRes.error) throw prodRes.error;

      const users = usersRes.data || [];
      const cots = cotRes.data || [];

      // Procesar ingresos mensuales
      const monthlyData: Record<string, number> = {};
      const statusCounts: Record<string, number> = {
        'pendiente': 0,
        'aprobada': 0,
        'rechazada': 0
      };

      cots.forEach(c => {
        if (statusCounts[c.estado] !== undefined) {
          statusCounts[c.estado]++;
        }

        if (c.estado === 'aprobada' && c.created_at) {
          const date = new Date(c.created_at);
          const monthYear = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
          }
          monthlyData[monthYear] += (c.total || 0);
        }
      });

      // Formatear para gráficas (últimos 6 meses)
      const last6Months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const name = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        last6Months.push({
          name,
          ingresos: monthlyData[name] || 0
        });
      }
      setChartData(last6Months);

      setStatusData([
        { name: t('quotes.status_approved', 'Aprobadas'), value: statusCounts['aprobada'], color: '#22c55e' },
        { name: t('quotes.status_pending', 'Pendientes'), value: statusCounts['pendiente'], color: '#eab308' },
        { name: t('quotes.status_rejected', 'Rechazadas'), value: statusCounts['rechazada'], color: '#ef4444' }
      ]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">Evolución de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `€${val}`} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                  />
                  <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">Estado de Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
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

