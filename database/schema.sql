-- ==============================================================================
-- DISTRIBUTECH PRO - ESQUEMA PRINCIPAL B2B (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- LIMPIEZA PREVIA (Para poder ejecutar este script repetidas veces sin errores)
-- ==============================================================================
DROP TABLE IF EXISTS pedido_historial_estados CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS detalle_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS detalle_cotizacion CASCADE;
DROP TABLE IF EXISTS cotizaciones CASCADE;
DROP TABLE IF EXISTS contactos_comercial CASCADE;
DROP TABLE IF EXISTS producto_imagenes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS fabricantes CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS direcciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

DROP TYPE IF EXISTS rol_usuario CASCADE;
DROP TYPE IF EXISTS sector_categoria CASCADE;
DROP TYPE IF EXISTS estado_cotizacion CASCADE;
DROP TYPE IF EXISTS estado_pedido CASCADE;
DROP TYPE IF EXISTS metodo_pago CASCADE;

-- ==============================================================================
-- 2. ENUMS
-- ==============================================================================
CREATE TYPE rol_usuario AS ENUM ('cliente', 'comercial', 'admin');
CREATE TYPE sector_categoria AS ENUM ('ferreteria', 'fontaneria', 'riego', 'bano', 'industrial');
CREATE TYPE estado_cotizacion AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE estado_pedido AS ENUM ('pendiente', 'confirmado', 'enviado', 'completado', 'cancelado');
CREATE TYPE metodo_pago AS ENUM ('transferencia', 'tarjeta', 'contrarembolso');

-- 3. FUNCIONES CORE
-- Previene la recursión de RLS leyendo el rol directo desde el JWT de Supabase
CREATE OR REPLACE FUNCTION get_my_rol() RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'rol',
    'cliente'
  );
$$ LANGUAGE sql STABLE;

-- 4. TABLAS ESTRUCTURALES Y FISCALIDAD
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_fiscal VARCHAR(255) NOT NULL,
  cif VARCHAR(20) UNIQUE NOT NULL,
  direccion_fiscal TEXT NOT NULL,
  email_facturacion VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  rol rol_usuario DEFAULT 'cliente',
  telefono VARCHAR(20),
  descuento_global NUMERIC(5,2) DEFAULT 0 CHECK (descuento_global BETWEEN 0 AND 100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- (TRIGGER INSERCIÓN DESDE AUTH.USERS)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', 'B2B'),
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.rol_usuario, 'cliente'::public.rol_usuario)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE direcciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  alias VARCHAR(100),
  calle TEXT NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  provincia VARCHAR(100),
  pais VARCHAR(100) DEFAULT 'España',
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CATÁLOGO
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  categoria_padre_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  sector sector_categoria NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fabricantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT,
  fabricante_id UUID REFERENCES fabricantes(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  especificaciones_tecnicas JSONB,
  precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  tipo_iva NUMERIC(4,2) NOT NULL DEFAULT 21.00,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE producto_imagenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  es_principal BOOLEAN DEFAULT false,
  orden SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. JERARQUÍA COMERCIAL
CREATE TABLE contactos_comercial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  comercial_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, comercial_id)
);

-- 7. NÚCLEO DE VENTAS (Cotizaciones y Pedidos)
CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado estado_cotizacion DEFAULT 'pendiente',
  base_imponible NUMERIC(10, 2) DEFAULT 0,
  total_iva NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  validez_dias INT DEFAULT 30,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE detalle_cotizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  tipo_iva NUMERIC(4,2) NOT NULL DEFAULT 21.00,
  descuento_porcentaje NUMERIC(5,2) DEFAULT 0 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
  precio_con_descuento NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario * (1 - descuento_porcentaje / 100)) STORED
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado estado_pedido DEFAULT 'pendiente',
  base_imponible NUMERIC(10,2) DEFAULT 0,
  total_iva NUMERIC(10,2) DEFAULT 0,
  total_con_iva NUMERIC(10,2) DEFAULT 0,
  direccion_id UUID REFERENCES direcciones(id) ON DELETE SET NULL,
  direccion_snapshot JSONB,
  metodo_pago metodo_pago NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE detalle_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  tipo_iva NUMERIC(4,2) NOT NULL DEFAULT 21.00,
  descuento_porcentaje NUMERIC(5,2) DEFAULT 0 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
  precio_con_descuento NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario * (1 - descuento_porcentaje / 100)) STORED
);

-- 8. AUDITORÍA Y FACTURACIÓN
CREATE TABLE pedido_historial_estados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior estado_pedido,
  estado_nuevo estado_pedido NOT NULL,
  cambiado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE facturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  base_imponible NUMERIC(10,2) NOT NULL,
  total_iva NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  pagada BOOLEAN DEFAULT false,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TRIGGERS SÍNCRONOS (Logística, Estado, Recalculado)
CREATE OR REPLACE FUNCTION sync_totales_cotizacion() RETURNS TRIGGER AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := COALESCE(NEW.cotizacion_id, OLD.cotizacion_id);
  UPDATE cotizaciones SET 
    base_imponible = (SELECT COALESCE(SUM(cantidad * precio_con_descuento), 0) FROM detalle_cotizacion WHERE cotizacion_id = v_id),
    total_iva = (SELECT COALESCE(SUM(cantidad * precio_con_descuento * (tipo_iva / 100)), 0) FROM detalle_cotizacion WHERE cotizacion_id = v_id),
    total = (SELECT COALESCE(SUM(cantidad * precio_con_descuento * (1 + (tipo_iva / 100))), 0) FROM detalle_cotizacion WHERE cotizacion_id = v_id),
    updated_at = now()
  WHERE id = v_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_totales_cotizacion AFTER INSERT OR UPDATE OR DELETE ON detalle_cotizacion FOR EACH ROW EXECUTE FUNCTION sync_totales_cotizacion();

CREATE OR REPLACE FUNCTION sync_totales_pedido() RETURNS TRIGGER AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := COALESCE(NEW.pedido_id, OLD.pedido_id);
  UPDATE pedidos SET 
    base_imponible = (SELECT COALESCE(SUM(cantidad * precio_con_descuento), 0) FROM detalle_pedido WHERE pedido_id = v_id),
    total_iva = (SELECT COALESCE(SUM(cantidad * precio_con_descuento * (tipo_iva / 100)), 0) FROM detalle_pedido WHERE pedido_id = v_id),
    total_con_iva = (SELECT COALESCE(SUM(cantidad * precio_con_descuento * (1 + (tipo_iva / 100))), 0) FROM detalle_pedido WHERE pedido_id = v_id),
    updated_at = now()
  WHERE id = v_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_totales_pedido AFTER INSERT OR UPDATE OR DELETE ON detalle_pedido FOR EACH ROW EXECUTE FUNCTION sync_totales_pedido();

CREATE OR REPLACE FUNCTION log_cambio_estado_pedido() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO pedido_historial_estados (pedido_id, estado_anterior, estado_nuevo, cambiado_por)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_estado_pedido BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION log_cambio_estado_pedido();

-- 10. ÍNDICES (OPT. RENDIMIENTO)
CREATE INDEX idx_productos_categoria    ON productos(categoria_id);
CREATE INDEX idx_productos_fabricante   ON productos(fabricante_id);
CREATE INDEX idx_productos_activo       ON productos(activo) WHERE activo = true;
CREATE INDEX idx_cotizaciones_usuario   ON cotizaciones(usuario_id);
CREATE INDEX idx_pedidos_usuario        ON pedidos(usuario_id);
CREATE INDEX idx_detalle_cot_cotizacion ON detalle_cotizacion(cotizacion_id);
CREATE INDEX idx_detalle_ped_pedido     ON detalle_pedido(pedido_id);
CREATE INDEX idx_contactos_comercial_id ON contactos_comercial(comercial_id);
CREATE INDEX idx_contactos_cliente_id   ON contactos_comercial(cliente_id);
CREATE INDEX idx_productos_fts          ON productos USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- ==============================================================================
-- RLS (ROW LEVEL SECURITY) Y POLÍTICAS
-- ==============================================================================

-- Encendemos RLS general
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_cotizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;

-- Evitamos recursión en usuarios
CREATE POLICY "usuario_view_self" ON usuarios FOR SELECT USING (id = auth.uid() OR get_my_rol() = 'admin');

-- Brecha Comercial Cerrada: Inserción condicionada y validada en Cotizaciones
CREATE POLICY "user_crear_cot" ON cotizaciones FOR INSERT WITH CHECK (
  usuario_id = auth.uid() OR get_my_rol() = 'admin' OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

-- Lecturas cruzadas
CREATE POLICY "user_leer_cot" ON cotizaciones FOR SELECT USING (
  usuario_id = auth.uid() OR get_my_rol() = 'admin' OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = cotizaciones.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

-- RLS Detalle dependiente del padre (JOIN virtual)
CREATE POLICY "rls_detalle_cot_select" ON detalle_cotizacion FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cotizaciones c WHERE c.id = cotizacion_id
    AND (c.usuario_id = auth.uid() OR get_my_rol() = 'admin' OR EXISTS (
      SELECT 1 FROM contactos_comercial cc WHERE cc.cliente_id = c.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
    ))
  )
);
