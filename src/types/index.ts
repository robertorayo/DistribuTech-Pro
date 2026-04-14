/**
 * DistribuTech Pro - Tipos Base Generales
 * Aquí generaremos y volcaremos luego los tipos extraídos de Supabase.
 */

export interface UserProfile {
  id_usuario: string; // auth.users id
  email: string;
  nombre: string;
  apellidos: string;
  tipo_usuario: 'cliente' | 'comercial' | 'admin';
  telefono?: string;
  direccion?: string;
  fecha_registro: string;
  activo: boolean;
}

// Iremos añadiendo el resto de tipos (Producto, Categoria, Cotizacion...) a medida que arranquemos.
