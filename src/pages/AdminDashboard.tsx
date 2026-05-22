import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../components/ui/chart';
import { Users, FileText, TrendingUp, Package, LayoutDashboard } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { LoadingScreen, PageHeader } from '../components/shared';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

type CotizacionRow = {
  estado: string;
  total: number | null;
  created_at: string;
};

type DailyPoint = {
  day: number;
  label: string;
  ingresos: number;
};

const dailyChartConfig = {
  ingresos: {
    label: 'Ingresos',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_DAY = new Date().getDate();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

function buildDailyRevenue(cots: CotizacionRow[], year: number, month: number): DailyPoint[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daily: Record<number, number> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    daily[d] = 0;
  }

  cots.forEach((c) => {
    if (c.estado !== 'aprobada' || !c.created_at) return;
    const date = new Date(c.created_at);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      daily[day] += c.total || 0;
    }
  });

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isFuture = year === CURRENT_YEAR && month === CURRENT_MONTH && day > CURRENT_DAY;
    return { 
      day, 
      label: String(day), 
      ingresos: isFuture ? (null as any) : daily[day] 
    };
  });
}

export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; ingresos: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(String(CURRENT_MONTH));
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [stats, setStats] = useState({
    usuarios: 0,
    clientes: 0,
    comerciales: 0,
    cotizacionesTotal: 0,
    ingresosAprobados: 0,
    productosActivos: 0,
  });

  const monthIndex = Number(selectedMonth);
  const yearNumber = Number(selectedYear);

  const handleYearChange = (year: string) => {
    const newYear = Number(year);
    setSelectedYear(year);
    if (newYear === CURRENT_YEAR && monthIndex > CURRENT_MONTH) {
      setSelectedMonth(String(CURRENT_MONTH));
    }
  };

  const dailyChartData = useMemo(
    () => buildDailyRevenue(cotizaciones, yearNumber, monthIndex),
    [cotizaciones, yearNumber, monthIndex]
  );

  const monthLabel = useMemo(() => {
    const name = i18n.language?.startsWith('en')
      ? new Date(yearNumber, monthIndex, 1).toLocaleString('en', { month: 'long' })
      : MONTH_NAMES_FULL[monthIndex];
    return `${name} ${yearNumber}`;
  }, [i18n.language, yearNumber, monthIndex]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [usersRes, cotRes, prodRes] = await Promise.all([
        supabase.from('usuarios').select('rol'),
        supabase.from('cotizaciones').select('estado, total, created_at'),
        supabase.from('productos').select('*', { count: 'exact', head: true }),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (cotRes.error) throw cotRes.error;
      if (prodRes.error) throw prodRes.error;

      const users = usersRes.data || [];
      const cots = (cotRes.data || []) as CotizacionRow[];
      setCotizaciones(cots);

      const monthlyData: Record<string, number> = {};
      const statusCounts: Record<string, number> = {
        pendiente: 0,
        aprobada: 0,
        rechazada: 0,
      };

      cots.forEach((c) => {
        if (statusCounts[c.estado] !== undefined) {
          statusCounts[c.estado]++;
        }

        if (c.estado === 'aprobada' && c.created_at) {
          const date = new Date(c.created_at);
          const monthYear = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
          }
          monthlyData[monthYear] += c.total || 0;
        }
      });

      const last6Months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const name = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        last6Months.push({
          name,
          ingresos: monthlyData[name] || 0,
        });
      }
      setChartData(last6Months);

      setStatusData([
        { name: t('quotes.status_approved', 'Aprobadas'), value: statusCounts.aprobada, color: '#22c55e' },
        { name: t('quotes.status_pending', 'Pendientes'), value: statusCounts.pendiente, color: '#eab308' },
        { name: t('quotes.status_rejected', 'Rechazadas'), value: statusCounts.rechazada, color: '#ef4444' },
      ]);

      setStats({
        usuarios: users.length,
        clientes: users.filter((u: any) => u.rol === 'cliente').length,
        comerciales: users.filter((u: any) => u.rol === 'comercial').length,
        cotizacionesTotal: cots.length,
        ingresosAprobados: cots.filter((c) => c.estado === 'aprobada').reduce((acc, curr) => acc + (curr.total || 0), 0),
        productosActivos: prodRes.count || 0,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Error: ' + message);
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
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50 z-0" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {t('admin.approved_revenue')}
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-gray-900 tracking-tighter">
              {formatCurrency(stats.ingresosAprobados)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {t('admin.operations_volume')}
            </CardTitle>
            <FileText className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{stats.cotizacionesTotal}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">{t('admin.quotes_issued')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {t('admin.client_base')}
            </CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{stats.clientes}</div>
            <p className="text-xs text-purple-600 font-medium mt-1">
              {t('admin.active_sales')}: {stats.comerciales}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {t('admin.active_catalog')}
            </CardTitle>
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
            <CardTitle className="text-gray-900 font-bold">{t('admin.revenue_evolution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickFormatter={(val) => `€${val}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Ingresos']}
                  />
                  <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">{t('admin.quotes_status')}</CardTitle>
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
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 bg-white">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-gray-900 font-bold">{t('admin.daily_revenue_title')}</CardTitle>
            <CardDescription>{t('admin.daily_revenue_subtitle')} — {monthLabel}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="admin-month-select">{t('admin.select_month')}</Label>
              <Select value={selectedMonth} onValueChange={(v) => v != null && setSelectedMonth(v)}>
                <SelectTrigger id="admin-month-select" className="min-w-[140px] w-full sm:w-auto bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  side="bottom" 
                  alignItemWithTrigger={false} 
                  className="bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg"
                >
                  {MONTH_NAMES_FULL.map((name, index) => (
                    <SelectItem 
                      key={index} 
                      value={String(index)}
                      disabled={yearNumber === CURRENT_YEAR && index > CURRENT_MONTH}
                    >
                      {i18n.language?.startsWith('en')
                        ? new Date(2000, index, 1).toLocaleString('en', { month: 'long' })
                        : name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="admin-year-select">{t('admin.select_year')}</Label>
              <Select value={selectedYear} onValueChange={(v) => v != null && handleYearChange(v)}>
                <SelectTrigger id="admin-year-select" className="min-w-[100px] w-full sm:w-auto bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  side="bottom" 
                  alignItemWithTrigger={false}
                  className="bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg"
                >
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={dailyChartConfig} className="aspect-auto h-80 w-full">
            <LineChart
              data={dailyChartData}
              margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(val) =>
                  val >= 1000 ? `€${(val / 1000).toFixed(0)}k` : `€${val}`
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const day = payload?.[0]?.payload?.day;
                      return day != null ? t('admin.chart_day', { day }) : '';
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="var(--color-ingresos)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-ingresos)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 text-center mt-12 shadow-inner">
        <h3 className="text-2xl font-black text-blue-900 mb-3 tracking-tight">{t('admin.mvp_ready')}</h3>
        <p className="text-blue-700/80 max-w-2xl mx-auto font-medium">{t('admin.mvp_description')}</p>
      </div>
    </div>
  );
};
