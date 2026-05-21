export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          categoria_padre_id: string | null
          sector: 'ferreteria' | 'fontaneria' | 'riego' | 'bano' | 'industrial'
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          categoria_padre_id?: string | null
          sector: 'ferreteria' | 'fontaneria' | 'riego' | 'bano' | 'industrial'
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          categoria_padre_id?: string | null
          sector?: 'ferreteria' | 'fontaneria' | 'riego' | 'bano' | 'industrial'
          created_at?: string | null
        }
      }
      contactos_comercial: {
        Row: {
          id: string
          cliente_id: string
          comercial_id: string
          notas: string | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          comercial_id: string
          notas?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          comercial_id?: string
          notas?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
      }
      cotizaciones: {
        Row: {
          id: string
          usuario_id: string
          creado_por: string | null
          estado: 'pendiente' | 'aprobada' | 'rechazada' | null
          base_imponible: number | null
          total_iva: number | null
          total: number
          validez_dias: number | null
          notas: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          creado_por?: string | null
          estado?: 'pendiente' | 'aprobada' | 'rechazada' | null
          base_imponible?: number | null
          total_iva?: number | null
          total?: number
          validez_dias?: number | null
          notas?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          creado_por?: string | null
          estado?: 'pendiente' | 'aprobada' | 'rechazada' | null
          base_imponible?: number | null
          total_iva?: number | null
          total?: number
          validez_dias?: number | null
          notas?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      detalle_cotizacion: {
        Row: {
          id: string
          cotizacion_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          tipo_iva: number
          descuento_porcentaje: number | null
          precio_con_descuento: number | null
        }
        Insert: {
          id?: string
          cotizacion_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          tipo_iva?: number
          descuento_porcentaje?: number | null
        }
        Update: {
          id?: string
          cotizacion_id?: string
          producto_id?: string
          cantidad?: number
          precio_unitario?: number
          tipo_iva?: number
          descuento_porcentaje?: number | null
        }
      }
      direcciones: {
        Row: {
          id: string
          usuario_id: string
          alias: string | null
          calle: string
          ciudad: string
          codigo_postal: string
          provincia: string | null
          pais: string | null
          es_principal: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          alias?: string | null
          calle: string
          ciudad: string
          codigo_postal: string
          provincia?: string | null
          pais?: string | null
          es_principal?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          alias?: string | null
          calle?: string
          ciudad?: string
          codigo_postal?: string
          provincia?: string | null
          pais?: string | null
          es_principal?: boolean | null
          created_at?: string | null
        }
      }
      empresas: {
        Row: {
          id: string
          nombre_fiscal: string
          cif: string
          direccion_fiscal: string
          email_facturacion: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre_fiscal: string
          cif: string
          direccion_fiscal: string
          email_facturacion?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre_fiscal?: string
          cif?: string
          direccion_fiscal?: string
          email_facturacion?: string | null
          created_at?: string | null
        }
      }
      fabricantes: {
        Row: {
          id: string
          nombre: string
          contacto: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string | null
        }
      }
      productos: {
        Row: {
          id: string
          categoria_id: string | null
          fabricante_id: string | null
          nombre: string
          descripcion: string | null
          especificaciones_tecnicas: Json | null
          precio: number
          tipo_iva: number
          stock: number
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          categoria_id?: string | null
          fabricante_id?: string | null
          nombre: string
          descripcion?: string | null
          especificaciones_tecnicas?: Json | null
          precio: number
          tipo_iva?: number
          stock?: number
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          categoria_id?: string | null
          fabricante_id?: string | null
          nombre?: string
          descripcion?: string | null
          especificaciones_tecnicas?: Json | null
          precio?: number
          tipo_iva?: number
          stock?: number
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string | null
          email: string
          nombre: string
          apellidos: string
          rol: 'cliente' | 'comercial' | 'admin' | null
          telefono: string | null
          descuento_global: number | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          empresa_id?: string | null
          email: string
          nombre: string
          apellidos: string
          rol?: 'cliente' | 'comercial' | 'admin' | null
          telefono?: string | null
          descuento_global?: number | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string | null
          email?: string
          nombre?: string
          apellidos?: string
          rol?: 'cliente' | 'comercial' | 'admin' | null
          telefono?: string | null
          descuento_global?: number | null
          activo?: boolean | null
          created_at?: string | null
        }
      }
    }
    Functions: {
      aprobar_cotizacion: {
        Args: { p_cotizacion_id: string }
        Returns: { resultado: string }
      }
      dividir_cotizacion: {
        Args: { p_cotizacion_id: string }
        Returns: Json
      }
      mantener_cotizacion_pendiente: {
        Args: { p_cotizacion_id: string }
        Returns: void
      }
    }
    Enums: {
      rol_usuario: 'cliente' | 'comercial' | 'admin'
    }
  }
}

export type Producto = Database['public']['Tables']['productos']['Row']
export type Categoria = Database['public']['Tables']['categorias']['Row']
export type Fabricante = Database['public']['Tables']['fabricantes']['Row']
export type Cotizacion = Database['public']['Tables']['cotizaciones']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type DetalleCotizacion = Database['public']['Tables']['detalle_cotizacion']['Row']
