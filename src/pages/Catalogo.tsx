import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  FilterBar,
  Pagination
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

  // Estados para los filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState(1);

  const cargarTodo = useCallback(async () => {
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
      toast.error(`${t('common.error')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

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

  const itemsPerPage = 12;
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);

  const productosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return productosFiltrados.slice(start, start + itemsPerPage);
  }, [productosFiltrados, currentPage]);

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosPaginados.map((prod) => (
              <Card key={prod.id} className="flex flex-col h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300 group overflow-hidden border-border bg-card rounded-2xl shadow-sm">
                {/* Header card with category and brand */}
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                      {prod.categorias?.nombre || 'General'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">{prod.fabricantes?.nombre || 'Marca Blanca'}</span>
                  </div>
                  <CardTitle
                    className="text-base font-extrabold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setProductoSeleccionado(prod)}
                  >
                    {prod.nombre}
                  </CardTitle>
                </CardHeader>

                {/* Card Content with structured description */}
                <CardContent className="flex-1 flex flex-col px-5 pb-4">
                  {/* Subtle card-like box for description */}
                  <div className="bg-slate-50/40 p-3.5 rounded-xl border border-slate-100 text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal line-clamp-3 mb-4 flex-1">
                    {prod.descripcion || 'Sin descripción disponible para este producto profesional.'}
                  </div>

                  {/* Visual Divider and Pricing info */}
                  <div className="mt-auto border-t border-border/50 pt-3 flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                      <p className="text-2xl font-black text-foreground tracking-tight">
                        {formatCurrency(prod.precio)}
                        <span className="text-[10px] font-bold text-muted-foreground/70 tracking-normal ml-0.5">/ud</span>
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Sin IVA</p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="relative flex h-2.5 w-2.5">
                        {prod.stock > 0 ? (
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
                      <p className="text-xs font-semibold text-muted-foreground">
                        {prod.stock > 0 ? t('catalog.units_in_stock', { count: prod.stock }) : t('catalog.out_of_stock_temp')}
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Action footer */}
                <CardFooter className="pt-4 pb-5 px-5 flex gap-2">
                  <Button
                    className="flex-1 font-bold shadow-sm hover:bg-muted hover:border-foreground/40 transition-all duration-150"
                    onClick={() => setProductoSeleccionado(prod)}
                    variant="outline"
                  >
                    {t('catalog.details')}
                  </Button>
                  <Button
                    className="font-bold shadow-sm px-3 hover:scale-105 transition-transform"
                    disabled={prod.stock === 0}
                    onClick={() => {
                      useCartStore.getState().addItem(prod, 1);
                      toast.success(`1x ${prod.nombre} ${t('catalog.added_to_cart')}`);
                    }}
                    title="Añadir 1 al Carrito"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Catalog Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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

