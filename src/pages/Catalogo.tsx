import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Producto, Categoria, Fabricante } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShoppingCart, PackageOpen, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ProductoDetalle } from '../components/ProductoDetalle';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { useCartStore } from '../store/cartStore';
import { 
  LoadingScreen, 
  PageHeader, 
  SearchInput, 
  EmptyState,
  selectClasses,
  FilterBar
} from '../components/shared';

export type ProductoConDetalles = Producto & {
  categorias?: Categoria | null;
  fabricantes?: Fabricante | null;
};

export const Catalogo: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [productos, setProductos] = useState<ProductoConDetalles[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConDetalles | null>(null);
  
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, fabRes] = await Promise.all([
        supabase.from('productos').select('*, categorias(id, nombre), fabricantes(id, nombre)').eq('activo', true),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('fabricantes').select('*').order('nombre'),
      ]);
      
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      if (fabRes.error) throw fabRes.error;
      
      setProductos(prodRes.data as unknown as ProductoConDetalles[]);
      setCategorias(catRes.data || []);
      setFabricantes(fabRes.data || []);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros y ordenación
  const productosFiltrados = useMemo(() => {
    let result = productos.filter((prod) => {
      const matchSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (prod.descripcion && prod.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || prod.categoria_id === selectedCategory;
      const matchManufacturer = selectedManufacturer === 'all' || prod.fabricante_id === selectedManufacturer;
      return matchSearch && matchCategory && matchManufacturer;
    });

    // Ordenación
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        result.sort((a, b) => b.precio - a.precio);
        break;
      case 'stock-asc':
        result.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        result.sort((a, b) => b.stock - a.stock);
        break;
      default:
        // Por defecto, se mantiene el orden de la BD o por nombre
        result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result;
  }, [productos, searchTerm, selectedCategory, selectedManufacturer, sortBy]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedManufacturer('all');
    setSortBy('default');
  };

  if (loading) return <LoadingScreen />;

  const isFilterActive = searchTerm !== '' || selectedCategory !== 'all' || selectedManufacturer !== 'all' || sortBy !== 'default';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title={t('catalog.title')} 
        subtitle={t('catalog.subtitle')}
        icon={Package}
      >
        <FilterBar onClear={limpiarFiltros} showClear={isFilterActive}>
          <SearchInput 
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder={t('catalog.search_placeholder')}
            className="w-full sm:max-w-xs"
          />
          
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${selectClasses} w-full sm:w-48 py-2`}
          >
            <option value="all">{t('catalog.all_categories')}</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>

          <select 
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className={`${selectClasses} w-full sm:w-48 py-2`}
          >
            <option value="all">{t('crud.all_manufacturers')}</option>
            {fabricantes.map(fab => (
              <option key={fab.id} value={fab.id}>{fab.nombre}</option>
            ))}
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`${selectClasses} w-full sm:w-48 py-2`}
          >
            <option value="default">{t('catalog.sort_by')}</option>
            <option value="price-asc">{t('catalog.price_low_high')}</option>
            <option value="price-desc">{t('catalog.price_high_low')}</option>
            <option value="stock-asc">{t('catalog.stock_low_high')}</option>
            <option value="stock-desc">{t('catalog.stock_high_low')}</option>
          </select>
        </FilterBar>
      </PageHeader>

      {productosFiltrados.length === 0 ? (
        <EmptyState 
          icon={PackageOpen} 
          title={t('catalog.no_results')} 
          description={t('catalog.no_results_desc')}
          actionLabel={(searchTerm !== '' || selectedCategory !== 'all') ? t('catalog.reset_search') : undefined}
          onAction={limpiarFiltros}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <Card key={prod.id} className="flex flex-col h-full hover:shadow-lg hover:border-blue-200 transition-all duration-300 group overflow-hidden border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                    {prod.categorias?.nombre || 'General'}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">{prod.fabricantes?.nombre || 'Marca Blanca'}</span>
                </div>
                <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors cursor-pointer" onClick={() => setProductoSeleccionado(prod)}>
                  {prod.nombre}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-1">
                  {prod.descripcion}
                </p>
                <div className="mt-auto">
                  <p className="text-3xl font-black text-gray-900 tracking-tight">
                    {formatCurrency(prod.precio)}
                    <span className="text-sm font-medium text-gray-400 tracking-normal ml-1">/ud</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${prod.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-xs font-medium text-gray-600">
                      {prod.stock > 0 ? t('catalog.units_in_stock', { count: prod.stock }) : t('catalog.out_of_stock_temp')}
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex gap-2">
                <Button 
                  className="flex-1 font-semibold shadow-sm" 
                  disabled={prod.stock === 0}
                  onClick={() => setProductoSeleccionado(prod)}
                  variant="outline"
                >
                  {t('catalog.details')}
                </Button>
                <Button 
                  className="font-semibold shadow-sm px-3" 
                  disabled={prod.stock === 0}
                  onClick={() => {
                    useCartStore.getState().addItem(prod, 1);
                    toast.success(`1x ${prod.nombre} ${t('catalog.added_to_cart')}`);
                  }}
                  title="Añadir 1 al Carrito"
                >
                  <ShoppingCart className="w-5 h-5" /> 
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalle de Producto */}
      <ProductoDetalle 
        producto={productoSeleccionado}
        isOpen={!!productoSeleccionado}
        onClose={() => setProductoSeleccionado(null)}
      />
    </div>
  );
};

