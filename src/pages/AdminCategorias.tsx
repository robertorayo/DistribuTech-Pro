import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types';
import { Button } from '../components/ui/button';
import { Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  LoadingScreen, 
  PageHeader, 
  DataTable, 
  RowActions, 
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
  SearchInput,
  ConfirmModal,
  Pagination
} from '../components/shared';

type Categoria = Database['public']['Tables']['categorias']['Row'];
type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];

const SECTORES = ['ferreteria', 'fontaneria', 'riego', 'bano', 'industrial'] as const;

export const AdminCategorias: React.FC = () => {
  const { rol } = useAuth();
  const { t } = useTranslation();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sector, setSector] = useState<CategoriaInsert['sector']>('ferreteria');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSector]);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setCategorias(data || []);
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
    setSector('ferreteria');
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setSector(cat.sector);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    const tNombre = nombre.trim();
    const tDescripcion = descripcion.trim();
    
    if (!tNombre) {
      toast.error(t('crud.field_required', { field: t('crud.name') }));
      return;
    }
    if (tNombre.length < 2) {
      toast.error('El nombre de la categoría debe tener al menos 2 caracteres.');
      return;
    }
    if (!sector) {
      toast.error('Debes seleccionar un sector válido.');
      return;
    }
    
    try {
      setSaving(true);
      const payload = { nombre: tNombre, descripcion: tDescripcion || null, sector };
      
      if (editando) {
        const { error } = await (supabase.from('categorias') as any).update(payload).eq('id', editando.id);
        if (error) throw error;
        toast.success(t('categories.update_success'));
      } else {
        const { error } = await (supabase.from('categorias') as any).insert(payload);
        if (error) throw error;
        toast.success(t('categories.create_success'));
      }
      setModalOpen(false);
      cargarCategorias();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) {
        if (error.message.includes('violates foreign key')) {
          toast.error(t('crud.delete_has_products'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('crud.deleted_success'));
        cargarCategorias();
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterSector('all');
  };

  const categoriasFiltradas = categorias.filter(cat => {
    const matchSearch = cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (cat.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = filterSector === 'all' || cat.sector === filterSector;
    return matchSearch && matchSector;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(categoriasFiltradas.length / itemsPerPage);
  const categoriasPaginadas = categoriasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <LoadingScreen />;

  const isFilterActive = searchTerm !== '' || filterSector !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={t('crud.categories')} 
        subtitle={t('crud.categories_desc')}
        icon={Tag}
        actionLabel={rol === 'admin' ? t('crud.new_category') : undefined}
        actionIcon={rol === 'admin' ? Plus : undefined}
        onAction={rol === 'admin' ? abrirCrear : undefined}
      />

      <FilterBar onClear={limpiarFiltros} showClear={isFilterActive}>
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder={t('catalog.search_placeholder')}
          className="w-full sm:max-w-xs"
        />
        <select 
          value={filterSector} 
          onChange={(e) => setFilterSector(e.target.value)}
          className={`${selectClasses} py-2 text-xs w-full sm:w-48`}
        >
          <option value="all">{t('crud.all_sectors')}</option>
          {SECTORES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </FilterBar>

      <DataTable columns={[
        t('crud.name'), 
        t('crud.description'), 
        t('crud.sector'), 
        ...(rol === 'admin' ? [t('common.actions')] : [])
      ]}
      footer={`${categoriasFiltradas.length} / ${categorias.length} ${t('crud.categories').toLowerCase()}`}
      >
        {categoriasFiltradas.length === 0 ? (
          <tr>
            <td colSpan={rol === 'admin' ? 4 : 3}>
              <EmptyState icon={Tag} title={t('crud.no_categories')} />
            </td>
          </tr>
        ) : (
          categoriasPaginadas.map((cat) => (
            <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-bold text-gray-900">{cat.nombre}</td>
              <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{cat.descripcion || '—'}</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  {cat.sector}
                </span>
              </td>
              {rol === 'admin' && (
                <td className="px-6 py-4">
                  <RowActions 
                    onEdit={() => abrirEditar(cat)}
                    onDelete={() => setConfirmDelete(cat.id)}
                  />
                </td>
              )}
            </tr>
          ))
        )}
      </DataTable>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {modalOpen && (
        <ModalOverlay onClose={() => setModalOpen(false)}>
          <ModalHeader>
            <h3 className="text-xl font-bold text-gray-900">
              {editando ? t('crud.edit_category') : t('crud.new_category')}
            </h3>
          </ModalHeader>
          <ModalBody>
            <FormField label={t('crud.name')} required>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClasses}
                placeholder={t('crud.name_placeholder')}
              />
            </FormField>
            <FormField label={t('crud.description')}>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className={textareaClasses}
                placeholder={t('crud.description_placeholder')}
              />
            </FormField>
            <FormField label={t('crud.sector')} required>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as CategoriaInsert['sector'])}
                className={selectClasses}
              >
                {SECTORES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </FormField>
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
        title={`${t('common.delete')} ${t('crud.category')}`}
        description="¿Estás seguro de que deseas eliminar esta categoría? Si tiene productos asociados, la acción podría fallar o dejar productos sin categoría."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={saving}
      />
    </div>
  );
};

