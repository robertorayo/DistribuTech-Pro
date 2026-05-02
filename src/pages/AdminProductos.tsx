import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types';
import { Button } from '../components/ui/button';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '../lib/formatters';
import { 
  LoadingScreen, 
  PageHeader, 
  SearchInput, 
  DataTable, 
  RowActions, 
  StatusBadge, 
  ModalOverlay, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  FormField, 
  inputClasses, 
  selectClasses, 
  textareaClasses,
  EmptyState,
  FilterBar,
  ConfirmModal
} from '../components/shared';

type Producto = Database['public']['Tables']['productos']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Fabricante = Database['public']['Tables']['fabricantes']['Row'];

type ProductoConRelaciones = Producto & {
  categorias: { nombre: string } | null;
  fabricantes: { nombre: string } | null;
};

export const AdminProductos: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [productos, setProductos] = useState<ProductoConRelaciones[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ProductoConRelaciones | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterFabricante, setFilterFabricante] = useState('all');
  const [filterStock, setFilterStock] = useState('all'); // all, in, out
  const [filterActivo, setFilterActivo] = useState('all'); // all, active, inactive
  const [sortByPrice, setSortByPrice] = useState('none'); // none, asc, desc

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [tipoIva, setTipoIva] = useState('21');
  const [categoriaId, setCategoriaId] = useState('');
  const [fabricanteId, setFabricanteId] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, fabRes] = await Promise.all([
        supabase.from('productos').select('*, categorias(nombre), fabricantes(nombre)').order('nombre'),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('fabricantes').select('*').order('nombre'),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      if (fabRes.error) throw fabRes.error;
      setProductos((prodRes.data as ProductoConRelaciones[]) || []);
      setCategorias(catRes.data || []);
      setFabricantes(fabRes.data || []);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStock('0');
    setTipoIva('21');
    setCategoriaId('');
    setFabricanteId('');
    setActivo(true);
    setModalOpen(true);
  };

  const abrirEditar = (prod: ProductoConRelaciones) => {
    setEditando(prod);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion || '');
    setPrecio(String(prod.precio));
    setStock(String(prod.stock));
    setTipoIva(String(prod.tipo_iva));
    setCategoriaId(prod.categoria_id || '');
    setFabricanteId(prod.fabricante_id || '');
    setActivo(prod.activo ?? true);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error(t('crud.field_required', { field: t('crud.name') }));
      return;
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      toast.error(t('crud.invalid_price'));
      return;
    }
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error(t('crud.invalid_stock'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio: precioNum,
        stock: stockNum,
        tipo_iva: parseFloat(tipoIva),
        categoria_id: categoriaId || null,
        fabricante_id: fabricanteId || null,
        activo,
        updated_at: new Date().toISOString(),
      };

      if (editando) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editando.id);
        if (error) throw error;
        toast.success(t('crud.updated_success'));
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) throw error;
        toast.success(t('crud.created_success'));
      }
      setModalOpen(false);
      cargarTodo();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) {
        if (error.message.includes('violates foreign key')) {
          toast.error(t('crud.delete_has_orders'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('crud.deleted_success'));
        cargarTodo();
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterCategoria('all');
    setFilterFabricante('all');
    setFilterStock('all');
    setFilterActivo('all');
    setSortByPrice('none');
  };

  const productosFiltrados = productos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.categorias?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.fabricantes?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategoria = filterCategoria === 'all' || p.categoria_id === filterCategoria;
    const matchFabricante = filterFabricante === 'all' || p.fabricante_id === filterFabricante;
    
    const matchStock = filterStock === 'all' || 
                       (filterStock === 'in' ? p.stock > 0 : p.stock === 0);
                       
    const matchActivo = filterActivo === 'all' || 
                        (filterActivo === 'active' ? p.activo : !p.activo);

    return matchSearch && matchCategoria && matchFabricante && matchStock && matchActivo;
  }).sort((a, b) => {
    if (sortByPrice === 'asc') return a.precio - b.precio;
    if (sortByPrice === 'desc') return b.precio - a.precio;
    return 0;
  });

  if (loading) return <LoadingScreen />;

  const isFilterActive = searchTerm !== '' || filterCategoria !== 'all' || filterFabricante !== 'all' || filterStock !== 'all' || filterActivo !== 'all' || sortByPrice !== 'none';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={t('crud.products')} 
        subtitle={t('crud.products_desc')}
        icon={Package}
        iconColor="text-orange-600"
        actionLabel={t('crud.new_product')}
        actionIcon={Plus}
        onAction={abrirCrear}
      />

      <FilterBar onClear={limpiarFiltros} showClear={isFilterActive}>
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder={t('catalog.search_placeholder')}
          className="w-full sm:max-w-xs"
        />
        
        <select 
          value={filterCategoria} 
          onChange={(e) => setFilterCategoria(e.target.value)}
          className={`${selectClasses} py-2 text-xs`}
        >
          <option value="all">{t('catalog.all_categories')}</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>

        <select 
          value={filterFabricante} 
          onChange={(e) => setFilterFabricante(e.target.value)}
          className={`${selectClasses} py-2 text-xs`}
        >
          <option value="all">{t('crud.all_manufacturers')}</option>
          {fabricantes.map(fab => (
            <option key={fab.id} value={fab.id}>{fab.nombre}</option>
          ))}
        </select>

        <select 
          value={filterStock} 
          onChange={(e) => setFilterStock(e.target.value)}
          className={`${selectClasses} py-2 text-xs`}
        >
          <option value="all">{t('crud.all_stock')}</option>
          <option value="in">{t('crud.in_stock')}</option>
          <option value="out">{t('crud.out_of_stock')}</option>
        </select>

        <select 
          value={filterActivo} 
          onChange={(e) => setFilterActivo(e.target.value)}
          className={`${selectClasses} py-2 text-xs`}
        >
          <option value="all">{t('crud.all_status')}</option>
          <option value="active">{t('crud.active')}</option>
          <option value="inactive">{t('crud.inactive')}</option>
        </select>

        <select 
          value={sortByPrice} 
          onChange={(e) => setSortByPrice(e.target.value)}
          className={`${selectClasses} py-2 text-xs`}
        >
          <option value="none">{t('crud.sort_price')}</option>
          <option value="asc">{t('crud.price_asc')}</option>
          <option value="desc">{t('crud.price_desc')}</option>
        </select>
      </FilterBar>

      <DataTable 
        columns={[
          t('crud.name'), 
          t('crud.category'), 
          t('crud.manufacturer'), 
          t('crud.price'), 
          t('crud.stock'), 
          t('common.status'), 
          t('common.actions')
        ]}
        footer={`${productosFiltrados.length} / ${productos.length} ${t('crud.products').toLowerCase()}`}
      >
        {productosFiltrados.length === 0 ? (
          <tr>
            <td colSpan={7}>
              <EmptyState icon={Package} title={t('crud.no_products')} />
            </td>
          </tr>
        ) : (
          productosFiltrados.map((prod) => (
            <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <p className="font-bold text-gray-900">{prod.nombre}</p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{prod.descripcion || '—'}</p>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {prod.categorias?.nombre || '—'}
                </span>
              </td>
              <td className="px-5 py-4 text-gray-600 text-sm">{prod.fabricantes?.nombre || '—'}</td>
              <td className="px-5 py-4 text-right font-bold text-gray-900">{formatCurrency(prod.precio)}</td>
              <td className="px-5 py-4 text-center">
                <span className={`font-bold ${prod.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {prod.stock}
                </span>
              </td>
              <td className="px-5 py-4 text-center">
                <StatusBadge status={prod.activo ? t('crud.active') : t('crud.inactive')} />
              </td>
              <td className="px-5 py-4">
                <RowActions 
                  onEdit={() => abrirEditar(prod)}
                  onDelete={() => setConfirmDelete(prod.id)}
                />
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {modalOpen && (
        <ModalOverlay onClose={() => setModalOpen(false)} maxWidth="max-w-2xl">
          <ModalHeader>
            <h3 className="text-xl font-bold text-gray-900">
              {editando ? t('crud.edit_product') : t('crud.new_product')}
            </h3>
          </ModalHeader>
          <ModalBody>
            <FormField label={t('crud.name')} required>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClasses}
              />
            </FormField>
            <FormField label={t('crud.description')}>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className={textareaClasses}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label={`${t('crud.price')} (€)`} required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className={inputClasses}
                />
              </FormField>
              <FormField label={t('crud.stock')} required>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputClasses}
                />
              </FormField>
              <FormField label={`${t('crud.vat')} (%)`}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tipoIva}
                  onChange={(e) => setTipoIva(e.target.value)}
                  className={inputClasses}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('crud.category')}>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">— {t('crud.no_category')} —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('crud.manufacturer')}>
                <select
                  value={fabricanteId}
                  onChange={(e) => setFabricanteId(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">— {t('crud.no_manufacturer')} —</option>
                  {fabricantes.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">{t('crud.product_active')}</label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('crud.cancel')}</Button>
            <Button onClick={handleGuardar} disabled={saving} className="font-bold">
              {saving ? t('crud.saving') : t('crud.save')}
            </Button>
          </ModalFooter>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleEliminar(confirmDelete)}
        title={`${t('common.delete')} ${t('common.product')}`}
        description="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer y el producto desaparecerá del catálogo."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={saving}
      />
    </div>
  );
};

