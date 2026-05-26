import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types';
import { Button } from '../components/ui/button';
import { Plus, Factory } from 'lucide-react';
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
  EmptyState,
  FilterBar,
  SearchInput,
  ConfirmModal,
  Pagination
} from '../components/shared';

type Fabricante = Database['public']['Tables']['fabricantes']['Row'];

export const AdminFabricantes: React.FC = () => {
  const { rol } = useAuth();
  const { t } = useTranslation();
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Fabricante | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    cargarFabricantes();
  }, []);

  const cargarFabricantes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fabricantes')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setFabricantes(data || []);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setContacto('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setModalOpen(true);
  };

  const abrirEditar = (fab: Fabricante) => {
    setEditando(fab);
    setNombre(fab.nombre);
    setContacto(fab.contacto || '');
    setTelefono(fab.telefono || '');
    setEmail(fab.email || '');
    setDireccion(fab.direccion || '');
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    const tNombre = nombre.trim();
    const tContacto = contacto.trim();
    const tTelefono = telefono.trim();
    const tEmail = email.trim();
    const tDireccion = direccion.trim();

    if (!tNombre) {
      toast.error(t('crud.field_required', { field: t('crud.name') }));
      return;
    }
    if (tNombre.length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (tContacto && /\d/.test(tContacto)) {
      toast.error('El nombre de contacto no puede contener números.');
      return;
    }
    if (tTelefono && !/^\d{9}$/.test(tTelefono)) {
      toast.error('El formato del número de teléfono es inválido. Debe contener exactamente 9 números (ej: 600000000).');
      return;
    }
    if (tEmail && !/^\S+@\S+\.\S+$/.test(tEmail)) {
      toast.error('El formato del correo electrónico es inválido.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nombre: tNombre,
        contacto: tContacto || null,
        telefono: tTelefono || null,
        email: tEmail || null,
        direccion: tDireccion || null,
      };

      if (editando) {
        const { error } = await (supabase.from('fabricantes') as any).update(payload).eq('id', editando.id);
        if (error) throw error;
        toast.success(t('manufacturers.update_success'));
      } else {
        const { error } = await (supabase.from('fabricantes') as any).insert(payload);
        if (error) throw error;
        toast.success(t('manufacturers.create_success'));
      }
      setModalOpen(false);
      cargarFabricantes();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      const { error } = await supabase.from('fabricantes').delete().eq('id', id);
      if (error) {
        if (error.message.includes('violates foreign key')) {
          toast.error(t('crud.delete_has_products'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('crud.deleted_success'));
        cargarFabricantes();
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
  };

  const fabricantesFiltrados = fabricantes.filter(fab => {
    const search = searchTerm.toLowerCase();
    return fab.nombre.toLowerCase().includes(search) || 
           (fab.contacto || '').toLowerCase().includes(search) ||
           (fab.email || '').toLowerCase().includes(search) ||
           (fab.telefono || '').toLowerCase().includes(search);
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(fabricantesFiltrados.length / itemsPerPage);
  const fabricantesPaginados = fabricantesFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={t('crud.manufacturers')} 
        subtitle={t('crud.manufacturers_desc')}
        icon={Factory}
        iconColor="text-purple-600"
        actionLabel={rol === 'admin' ? t('crud.new_manufacturer') : undefined}
        actionIcon={rol === 'admin' ? Plus : undefined}
        onAction={rol === 'admin' ? abrirCrear : undefined}
      />

      <FilterBar onClear={limpiarFiltros} showClear={searchTerm !== ''}>
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder={t('catalog.search_placeholder')}
          className="w-full sm:max-w-md"
        />
      </FilterBar>

      <DataTable columns={[
        t('crud.name'), 
        t('crud.contact'), 
        t('crud.phone'), 
        t('crud.email'), 
        ...(rol === 'admin' ? [t('common.actions')] : [])
      ]}
      footer={`${fabricantesFiltrados.length} / ${fabricantes.length} ${t('crud.manufacturers').toLowerCase()}`}
      >
        {fabricantesFiltrados.length === 0 ? (
          <tr>
            <td colSpan={rol === 'admin' ? 5 : 4}>
              <EmptyState icon={Factory} title={t('crud.no_manufacturers')} />
            </td>
          </tr>
        ) : (
          fabricantesPaginados.map((fab) => (
            <tr key={fab.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-bold text-gray-900">{fab.nombre}</td>
              <td className="px-6 py-4 text-gray-600">{fab.contacto || '—'}</td>
              <td className="px-6 py-4 text-gray-600">{fab.telefono || '—'}</td>
              <td className="px-6 py-4 text-gray-600">{fab.email || '—'}</td>
              {rol === 'admin' && (
                <td className="px-6 py-4">
                  <RowActions 
                    onEdit={() => abrirEditar(fab)}
                    onDelete={() => setConfirmDelete(fab.id)}
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
              {editando ? t('crud.edit_manufacturer') : t('crud.new_manufacturer')}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('crud.contact')}>
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  className={inputClasses}
                />
              </FormField>
              <FormField label={t('crud.phone')}>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={inputClasses}
                />
              </FormField>
            </div>
            <FormField label={t('crud.email')}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
            </FormField>
            <FormField label={t('crud.address')}>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={inputClasses}
              />
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
        title={`${t('common.delete')} ${t('crud.manufacturer')}`}
        description="¿Estás seguro de que deseas eliminar este fabricante? Esta acción puede afectar a los productos asociados."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={saving}
      />
    </div>
  );
};

