import type { ProductoConDetalles } from '@/pages/Catalogo';

/** Crea un producto de prueba con valores por defecto razonables. */
export const crearProducto = (datos: Partial<ProductoConDetalles> = {}): ProductoConDetalles => ({
  id: 'prod-1',
  categoria_id: null,
  fabricante_id: null,
  nombre: 'Taladro percutor',
  descripcion: null,
  especificaciones_tecnicas: null,
  precio: 100,
  tipo_iva: 21,
  stock: 10,
  activo: true,
  created_at: null,
  updated_at: null,
  ...datos,
});
