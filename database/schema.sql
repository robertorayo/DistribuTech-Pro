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
DROP TABLE IF EXISTS auditoria CASCADE;
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
-- Lee el rol real directamente desde la tabla de usuarios
CREATE OR REPLACE FUNCTION get_my_rol() RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol::TEXT 
    FROM public.usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RPC para registrar el "latido" de sesión o verificar en login
CREATE OR REPLACE FUNCTION registrar_actividad_sesion()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  v_current UUID;
  v_last_activity TIMESTAMPTZ;
  v_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_session_id := (current_setting('request.jwt.claims', true)::jsonb->>'session_id')::UUID;
  
  -- Leer estado actual
  SELECT email, current_session_id, last_session_activity 
  INTO v_email, v_current, v_last_activity
  FROM usuarios 
  WHERE id = v_user_id;

  -- Cuentas de la demo pública: varias personas pueden usarlas a la vez.
  IF v_email IN ('cliente@distributechpro.com', 'comercial1@distributechpro.com', 'admin@distributechpro.com') THEN
    RETURN TRUE;
  END IF;

  -- Permitir acceso si:
  -- 1. No hay sesión activa registrada.
  -- 2. Es la misma sesión.
  -- 3. La última actividad fue hace más de 5 minutos (sesión "zombie" / abandonada).
  IF v_current IS NULL OR v_current = v_session_id OR v_last_activity < (now() - interval '5 minutes') THEN
    UPDATE usuarios 
    SET current_session_id = v_session_id, 
        last_session_activity = now()
    WHERE id = v_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- RPC para limpiar la sesión activa al hacer logout
CREATE OR REPLACE FUNCTION cerrar_sesion_activa()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    v_session_id := (current_setting('request.jwt.claims', true)::jsonb->>'session_id')::UUID;
    -- Solo limpiar si la sesión activa es la nuestra
    UPDATE usuarios 
    SET current_session_id = NULL 
    WHERE id = v_user_id AND current_session_id = v_session_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_actividad_sesion() TO authenticated;
GRANT EXECUTE ON FUNCTION cerrar_sesion_activa() TO authenticated;

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
  current_session_id UUID,
  last_session_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- (TRIGGER INSERCIÓN DESDE AUTH.USERS)
-- El rol es siempre 'cliente': raw_user_meta_data lo envía el navegador y no es de fiar.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
  VALUES (
    NEW.id,
    NEW.email,
    left(COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'), 100),
    left(COALESCE(NEW.raw_user_meta_data->>'apellidos', 'B2B'), 100),
    'cliente'::public.rol_usuario
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
  notas_stock TEXT,
  tipo_incidencia VARCHAR(50),
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
-- Tablas sin políticas propias: con RLS activo y sin política, solo el propietario accede.
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabricantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos_comercial ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_historial_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- Evitamos recursión en usuarios
CREATE POLICY "usuario_view_staff" ON usuarios FOR SELECT USING (id = auth.uid() OR get_my_rol() IN ('admin', 'comercial'));

-- Cada usuario edita su perfil; el trigger impide que un no-admin cambie columnas sensibles.
CREATE POLICY "usuario_update_own_profile" ON usuarios FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION check_usuario_update() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Evitar que usuarios que no sean admin cambien columnas sensibles
  IF (SELECT rol FROM public.usuarios WHERE id = auth.uid()) != 'admin' THEN
    NEW.rol = OLD.rol;
    NEW.activo = OLD.activo;
    NEW.descuento_global = OLD.descuento_global;
    NEW.empresa_id = OLD.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_check_usuario_update BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION check_usuario_update();

-- ==============================================================================
-- POLÍTICAS PARA COTIZACIONES
-- ==============================================================================

CREATE POLICY "user_crear_cot" ON cotizaciones FOR INSERT WITH CHECK (
  usuario_id = auth.uid() OR get_my_rol() = 'admin' OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

CREATE POLICY "user_leer_cot" ON cotizaciones FOR SELECT USING (
  usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial') OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = cotizaciones.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

CREATE POLICY "admin_update_cot" ON cotizaciones FOR UPDATE USING (
  get_my_rol() IN ('admin', 'comercial') OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = cotizaciones.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

-- ==============================================================================
-- POLÍTICAS PARA DETALLE_COTIZACION
-- ==============================================================================

CREATE POLICY "rls_detalle_cot_select" ON detalle_cotizacion FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cotizaciones c WHERE c.id = cotizacion_id
    AND (c.usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial') OR EXISTS (
      SELECT 1 FROM contactos_comercial cc WHERE cc.cliente_id = c.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
    ))
  )
);

CREATE POLICY "user_crear_detalle_cot" ON detalle_cotizacion FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM cotizaciones c WHERE c.id = cotizacion_id
    AND (c.usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial'))
  )
);

-- ==============================================================================
-- POLÍTICAS PARA PEDIDOS
-- ==============================================================================

CREATE POLICY "user_leer_pedidos" ON pedidos FOR SELECT USING (
  usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial') OR EXISTS (
    SELECT 1 FROM contactos_comercial cc 
    WHERE cc.cliente_id = pedidos.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
  )
);

-- Los pedidos los crean las funciones de aprobación; desde la API, solo el admin.
CREATE POLICY "admin_crear_pedidos" ON pedidos FOR INSERT TO authenticated
WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY "admin_update_pedidos" ON pedidos FOR UPDATE USING (
  get_my_rol() IN ('admin', 'comercial')
);

-- ==============================================================================
-- POLÍTICAS PARA DETALLE_PEDIDO
-- ==============================================================================

CREATE POLICY "user_leer_detalle_ped" ON detalle_pedido FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pedidos p WHERE p.id = pedido_id
    AND (p.usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial') OR EXISTS (
      SELECT 1 FROM contactos_comercial cc WHERE cc.cliente_id = p.usuario_id AND cc.comercial_id = auth.uid() AND cc.activo = true
    ))
  )
);

CREATE POLICY "admin_crear_detalle_ped" ON detalle_pedido FOR INSERT TO authenticated
WITH CHECK (get_my_rol() = 'admin');

-- ==============================================================================
-- POLÍTICAS PARA CATÁLOGO (PRODUCTOS, CATEGORÍAS, FABRICANTES)
-- ==============================================================================

-- 2. Políticas para PRODUCTOS
CREATE POLICY "productos_select_policy" ON productos FOR SELECT 
USING (activo = true OR get_my_rol() = 'admin');

CREATE POLICY "productos_admin_all" ON productos FOR ALL 
TO authenticated 
USING (get_my_rol() = 'admin')
WITH CHECK (get_my_rol() = 'admin');

-- 3. Políticas para CATEGORÍAS
CREATE POLICY "categorias_select_policy" ON categorias FOR SELECT 
USING (true);

CREATE POLICY "categorias_admin_all" ON categorias FOR ALL 
TO authenticated 
USING (get_my_rol() = 'admin')
WITH CHECK (get_my_rol() = 'admin');

-- 4. Políticas para FABRICANTES
CREATE POLICY "fabricantes_select_policy" ON fabricantes FOR SELECT 
USING (true);

CREATE POLICY "fabricantes_admin_all" ON fabricantes FOR ALL 
TO authenticated 
USING (get_my_rol() = 'admin')
WITH CHECK (get_my_rol() = 'admin');

-- ==============================================================================
-- POLÍTICA: cliente puede actualizar sus propias cotizaciones (para incidencias)
-- ==============================================================================
CREATE POLICY "cliente_update_own_cot" ON cotizaciones FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==============================================================================
-- FUNCIONES RPC: SISTEMA DE GESTIÓN DE STOCK
-- ==============================================================================

-- Aprueba una cotización comprobando stock atómicamente.
-- Si hay stock: descuenta y aprueba. Si no: marca incidencia para el cliente.
CREATE OR REPLACE FUNCTION public.aprobar_cotizacion(p_cotizacion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_detalle RECORD;
  v_todos_ok BOOLEAN := true;
  v_disponible JSONB := '[]'::JSONB;
  v_faltante JSONB := '[]'::JSONB;
  v_estado TEXT;
  v_tipo_incidencia VARCHAR;
BEGIN
  IF COALESCE(get_my_rol(), '') NOT IN ('admin', 'comercial') THEN
    RAISE EXCEPTION 'Sin permisos para aprobar cotizaciones';
  END IF;

  SELECT estado::TEXT, tipo_incidencia INTO v_estado, v_tipo_incidencia
  FROM cotizaciones WHERE id = p_cotizacion_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  IF v_estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Solo se puede aprobar una cotización pendiente (estado actual: %)', v_estado;
  END IF;

  -- Comprobar si la cotización ya está en espera de stock
  IF v_tipo_incidencia IN ('esperando_stock', 'esperando_stock_completo', 'pendiente_decision_cliente') THEN
    RETURN jsonb_build_object('resultado', 'ya_en_espera', 'tiene_incidencia', true);
  END IF;

  FOR v_detalle IN
    SELECT dc.id, dc.producto_id, dc.cantidad, p.nombre, p.stock
    FROM detalle_cotizacion dc
    JOIN productos p ON p.id = dc.producto_id
    WHERE dc.cotizacion_id = p_cotizacion_id
    FOR UPDATE OF p
  LOOP
    IF v_detalle.stock >= v_detalle.cantidad THEN
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.cantidad, 'cantidad_faltante', 0
      );
    ELSE
      v_todos_ok := false;
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
      v_faltante := v_faltante || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
    END IF;
  END LOOP;

  IF v_todos_ok THEN
    FOR v_detalle IN
      SELECT dc.producto_id, dc.cantidad FROM detalle_cotizacion dc WHERE dc.cotizacion_id = p_cotizacion_id
    LOOP
      UPDATE productos SET stock = stock - v_detalle.cantidad WHERE id = v_detalle.producto_id;
    END LOOP;
    UPDATE cotizaciones SET estado = 'aprobada', notas_stock = NULL, tipo_incidencia = NULL, updated_at = now()
    WHERE id = p_cotizacion_id;
    RETURN jsonb_build_object('resultado', 'aprobada', 'tiene_incidencia', false);
  ELSE
    UPDATE cotizaciones
    SET tipo_incidencia = 'pendiente_decision_cliente',
        notas_stock = jsonb_build_object('disponible', v_disponible, 'faltante', v_faltante)::TEXT,
        updated_at = now()
    WHERE id = p_cotizacion_id;
    RETURN jsonb_build_object('resultado', 'pendiente_decision_cliente', 'tiene_incidencia', true,
      'disponible', v_disponible, 'faltante', v_faltante);
  END IF;
END;
$function$;

-- Divide la cotización en: Pedido A (stock disponible, aprobado) + Pedido B (sin stock, en espera).
CREATE OR REPLACE FUNCTION dividir_cotizacion(p_cotizacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cot RECORD;
  v_detalle RECORD;
  v_cot_stock_id UUID;
  v_cot_sin_stock_id UUID;
  v_cantidad_disponible INT;
  v_cantidad_faltante INT;
  v_total_disponible INT := 0;
BEGIN
  -- Solo una cotización propia, pendiente y con la incidencia de stock abierta.
  SELECT * INTO v_cot FROM cotizaciones
  WHERE id = p_cotizacion_id
    AND usuario_id = auth.uid()
    AND estado = 'pendiente'
    AND tipo_incidencia = 'pendiente_decision_cliente'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotización no encontrada, sin permiso o sin incidencia de stock'; END IF;

  -- Comprobar si hay al menos un artículo con stock disponible
  FOR v_detalle IN
    SELECT dc.cantidad, p.stock
    FROM detalle_cotizacion dc
    JOIN productos p ON p.id = dc.producto_id
    WHERE dc.cotizacion_id = p_cotizacion_id
  LOOP
    v_total_disponible := v_total_disponible + LEAST(v_detalle.stock, v_detalle.cantidad);
  END LOOP;

  IF v_total_disponible = 0 THEN
    RAISE EXCEPTION 'No hay stock disponible para ninguno de los artículos. No se puede dividir el pedido.';
  END IF;

  INSERT INTO cotizaciones (usuario_id, creado_por, estado, notas_stock, tipo_incidencia)
  VALUES (v_cot.usuario_id, v_cot.usuario_id, 'pendiente',
    'Pedido dividido automáticamente — artículos CON stock (listos para servir)', NULL)
  RETURNING id INTO v_cot_stock_id;

  INSERT INTO cotizaciones (usuario_id, creado_por, estado, notas_stock, tipo_incidencia)
  VALUES (v_cot.usuario_id, v_cot.usuario_id, 'pendiente',
    'Pedido dividido automáticamente — artículos EN ESPERA de reposición de stock', 'esperando_stock')
  RETURNING id INTO v_cot_sin_stock_id;

  FOR v_detalle IN
    SELECT dc.producto_id, dc.cantidad, dc.precio_unitario, dc.tipo_iva, dc.descuento_porcentaje, p.stock
    FROM detalle_cotizacion dc
    JOIN productos p ON p.id = dc.producto_id
    WHERE dc.cotizacion_id = p_cotizacion_id
    FOR UPDATE OF p
  LOOP
    v_cantidad_disponible := LEAST(v_detalle.stock, v_detalle.cantidad);
    v_cantidad_faltante   := v_detalle.cantidad - v_cantidad_disponible;
    IF v_cantidad_disponible > 0 THEN
      INSERT INTO detalle_cotizacion (cotizacion_id, producto_id, cantidad, precio_unitario, tipo_iva, descuento_porcentaje)
      VALUES (v_cot_stock_id, v_detalle.producto_id, v_cantidad_disponible, v_detalle.precio_unitario, v_detalle.tipo_iva, v_detalle.descuento_porcentaje);
      UPDATE productos SET stock = stock - v_cantidad_disponible WHERE id = v_detalle.producto_id;
    END IF;
    IF v_cantidad_faltante > 0 THEN
      INSERT INTO detalle_cotizacion (cotizacion_id, producto_id, cantidad, precio_unitario, tipo_iva, descuento_porcentaje)
      VALUES (v_cot_sin_stock_id, v_detalle.producto_id, v_cantidad_faltante, v_detalle.precio_unitario, v_detalle.tipo_iva, v_detalle.descuento_porcentaje);
    END IF;
  END LOOP;

  UPDATE cotizaciones SET estado = 'aprobada', updated_at = now() WHERE id = v_cot_stock_id;
  UPDATE cotizaciones SET estado = 'rechazada',
    notas_stock = 'Cotización original dividida en dos nuevos pedidos por incidencia de stock.',
    tipo_incidencia = NULL, updated_at = now()
  WHERE id = p_cotizacion_id;

  RETURN jsonb_build_object('resultado', 'dividida',
    'cotizacion_con_stock', v_cot_stock_id, 'cotizacion_sin_stock', v_cot_sin_stock_id);
END;
$$;

-- El cliente opta por esperar hasta que haya stock completo para su pedido.
CREATE OR REPLACE FUNCTION mantener_cotizacion_pendiente(p_cotizacion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cotizaciones
  SET tipo_incidencia = 'esperando_stock_completo',
      notas_stock = 'El cliente ha optado por esperar hasta que haya stock suficiente para servir el pedido completo.',
      updated_at = now()
  WHERE id = p_cotizacion_id
    AND usuario_id = auth.uid()
    AND estado = 'pendiente'
    AND tipo_incidencia = 'pendiente_decision_cliente';
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotización no encontrada, sin permiso o sin incidencia de stock'; END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION aprobar_cotizacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dividir_cotizacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mantener_cotizacion_pendiente(UUID) TO authenticated;

-- ==============================================================================
-- TRIGGER PARA APROBACIÓN AUTOMÁTICA DE PEDIDOS EN ESPERA DE STOCK
-- ==============================================================================
CREATE OR REPLACE FUNCTION procesar_pedidos_en_espera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cot RECORD;
  v_detalle RECORD;
  v_puede_aprobar BOOLEAN;
BEGIN
  FOR v_cot IN 
    SELECT c.id, c.usuario_id
    FROM cotizaciones c
    WHERE c.tipo_incidencia IN ('esperando_stock', 'esperando_stock_completo')
      AND c.estado = 'pendiente'
      AND EXISTS (
        SELECT 1 FROM detalle_cotizacion dc 
        WHERE dc.cotizacion_id = c.id AND dc.producto_id = NEW.id
      )
    ORDER BY c.created_at ASC
  LOOP
    v_puede_aprobar := true;
    
    FOR v_detalle IN 
      SELECT dc.cantidad, p.stock
      FROM detalle_cotizacion dc
      JOIN productos p ON p.id = dc.producto_id
      WHERE dc.cotizacion_id = v_cot.id
      FOR UPDATE OF p
    LOOP
      IF v_detalle.stock < v_detalle.cantidad THEN
        v_puede_aprobar := false;
        EXIT;
      END IF;
    END LOOP;

    IF v_puede_aprobar THEN
      FOR v_detalle IN 
        SELECT dc.producto_id, dc.cantidad
        FROM detalle_cotizacion dc
        WHERE dc.cotizacion_id = v_cot.id
      LOOP
        UPDATE productos SET stock = stock - v_detalle.cantidad WHERE id = v_detalle.producto_id;
      END LOOP;

      UPDATE cotizaciones 
      SET estado = 'aprobada', 
          tipo_incidencia = 'auto_aprobado',
          notas_stock = 'El pedido ha sido procesado y aprobado automáticamente tras la recepción de nuevo stock.',
          updated_at = now()
      WHERE id = v_cot.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_productos_stock_update ON productos;
CREATE TRIGGER tr_productos_stock_update
AFTER UPDATE OF stock ON productos
FOR EACH ROW
WHEN (NEW.stock > OLD.stock)
EXECUTE FUNCTION procesar_pedidos_en_espera();

-- ==============================================================================
-- ENDURECIMIENTO DE SEGURIDAD (aplicado en producción el 18-11-2026,
-- ver database/migrations/2026-11-17_seguridad_demo.sql)
-- ==============================================================================
-- search_path fijo en las funciones SECURITY DEFINER y sin ejecución anónima de las RPC.
ALTER FUNCTION public.get_my_rol() SET search_path = public;
ALTER FUNCTION public.aprobar_cotizacion(UUID) SET search_path = public;
ALTER FUNCTION public.dividir_cotizacion(UUID) SET search_path = public;
ALTER FUNCTION public.mantener_cotizacion_pendiente(UUID) SET search_path = public;
ALTER FUNCTION public.registrar_actividad_sesion() SET search_path = public;
ALTER FUNCTION public.cerrar_sesion_activa() SET search_path = public;
ALTER FUNCTION public.procesar_pedidos_en_espera() SET search_path = public;
ALTER FUNCTION public.check_usuario_update() SET search_path = public;
ALTER FUNCTION public.log_cambio_estado_pedido() SET search_path = public;
ALTER FUNCTION public.sync_totales_cotizacion() SET search_path = public;
ALTER FUNCTION public.sync_totales_pedido() SET search_path = public;

REVOKE EXECUTE ON FUNCTION
  public.aprobar_cotizacion(UUID),
  public.dividir_cotizacion(UUID),
  public.mantener_cotizacion_pendiente(UUID),
  public.registrar_actividad_sesion(),
  public.cerrar_sesion_activa(),
  public.procesar_pedidos_en_espera()
FROM PUBLIC, anon;

-- Es la función de un trigger: nadie tiene que llamarla por RPC.
REVOKE EXECUTE ON FUNCTION public.procesar_pedidos_en_espera() FROM authenticated;

-- aprobar_cotizacion compara "get_my_rol() NOT IN (...)": con NULL no lanza error. Al quitar
-- el EXECUTE a anon ya no hay forma de llegar con rol NULL (todo usuario de Auth tiene fila
-- en usuarios por handle_new_user). El COALESCE se añadió después (2026-11-18_aprobar_cotizacion.sql).
GRANT EXECUTE ON FUNCTION
  public.aprobar_cotizacion(UUID),
  public.dividir_cotizacion(UUID),
  public.mantener_cotizacion_pendiente(UUID),
  public.registrar_actividad_sesion(),
  public.cerrar_sesion_activa()
TO authenticated;

-- El cliente no decide precios ni estados (escrituras directas desde la API).
CREATE OR REPLACE FUNCTION public.es_escritura_directa_de_cliente() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT current_user = 'authenticated'
     AND COALESCE(public.get_my_rol(), '') NOT IN ('admin', 'comercial');
$$;

-- 3a. Cotización nueva de un cliente: siempre pendiente y sin incidencias.
CREATE OR REPLACE FUNCTION public.proteger_insert_cotizacion() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.es_escritura_directa_de_cliente() THEN
    NEW.estado := 'pendiente';
    NEW.tipo_incidencia := NULL;
    NEW.notas_stock := NULL;
    NEW.creado_por := auth.uid();
    -- Los totales los calcula sync_totales_cotizacion a partir de las líneas.
    NEW.base_imponible := 0;
    NEW.total_iva := 0;
    NEW.total := 0;
    NEW.validez_dias := 30;
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_proteger_insert_cotizacion ON cotizaciones;
CREATE TRIGGER trg_proteger_insert_cotizacion BEFORE INSERT ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.proteger_insert_cotizacion();

-- 3b. Cambios de un cliente en su cotización: solo cancelarla (estado 'rechazada').
CREATE OR REPLACE FUNCTION public.proteger_update_cotizacion() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.es_escritura_directa_de_cliente() THEN
    -- Solo cancelar, y solo mientras está pendiente (una aprobada ya descontó stock).
    IF NEW.estado IS DISTINCT FROM OLD.estado
       AND (NEW.estado <> 'rechazada' OR OLD.estado <> 'pendiente') THEN
      RAISE EXCEPTION 'Un cliente solo puede cancelar una cotización pendiente';
    END IF;
    -- Todo lo demás se queda como estaba, salvo limpiar la incidencia al cancelar.
    NEW.id := OLD.id;
    NEW.updated_at := now();
    NEW.usuario_id := OLD.usuario_id;
    NEW.creado_por := OLD.creado_por;
    NEW.base_imponible := OLD.base_imponible;
    NEW.total_iva := OLD.total_iva;
    NEW.total := OLD.total;
    NEW.validez_dias := OLD.validez_dias;
    NEW.notas_stock := OLD.notas_stock;
    NEW.created_at := OLD.created_at;
    NEW.tipo_incidencia := CASE WHEN NEW.estado = 'rechazada' THEN NULL ELSE OLD.tipo_incidencia END;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_proteger_update_cotizacion ON cotizaciones;
CREATE TRIGGER trg_proteger_update_cotizacion BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.proteger_update_cotizacion();

-- 3c. Líneas de cotización de un cliente: precio e IVA salen del catálogo, sin descuento,
--     y solo en cotizaciones propias que sigan pendientes.
CREATE OR REPLACE FUNCTION public.proteger_insert_detalle_cotizacion() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_precio NUMERIC;
  v_iva NUMERIC;
BEGIN
  IF public.es_escritura_directa_de_cliente() THEN
    IF NOT EXISTS (
      SELECT 1 FROM cotizaciones c
      WHERE c.id = NEW.cotizacion_id AND c.usuario_id = auth.uid() AND c.estado = 'pendiente'
    ) THEN
      RAISE EXCEPTION 'Solo se pueden añadir líneas a una cotización propia pendiente';
    END IF;
    SELECT precio, tipo_iva INTO v_precio, v_iva
      FROM productos WHERE id = NEW.producto_id AND activo = true;
    IF v_precio IS NULL THEN
      RAISE EXCEPTION 'Producto no disponible';
    END IF;
    NEW.precio_unitario := v_precio;
    NEW.tipo_iva := v_iva;
    NEW.descuento_porcentaje := 0;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_proteger_insert_detalle_cotizacion ON detalle_cotizacion;
CREATE TRIGGER trg_proteger_insert_detalle_cotizacion BEFORE INSERT ON detalle_cotizacion
  FOR EACH ROW EXECUTE FUNCTION public.proteger_insert_detalle_cotizacion();

-- Cuentas de la demo pública: sin borrados de catálogo ni cambios de credenciales.
CREATE OR REPLACE FUNCTION public.es_email_demo(p_email TEXT) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(COALESCE(p_email, '')) IN (
    'cliente@distributechpro.com',
    'comercial1@distributechpro.com',
    'admin@distributechpro.com'
  );
$$;

-- El correo sale del token de Auth, no de public.usuarios (que el propio usuario edita).
CREATE OR REPLACE FUNCTION public.es_cuenta_demo() RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT public.es_email_demo(auth.jwt() ->> 'email');
$$;

GRANT EXECUTE ON FUNCTION
  public.es_email_demo(TEXT),
  public.es_cuenta_demo(),
  public.es_escritura_directa_de_cliente()
TO authenticated, service_role;

-- Políticas RESTRICTIVE: se suman (AND) a las existentes; el admin demo sigue creando y editando.
DROP POLICY IF EXISTS demo_sin_borrar ON productos;
CREATE POLICY demo_sin_borrar ON productos AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.es_cuenta_demo());
DROP POLICY IF EXISTS demo_sin_borrar ON categorias;
CREATE POLICY demo_sin_borrar ON categorias AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.es_cuenta_demo());
DROP POLICY IF EXISTS demo_sin_borrar ON fabricantes;
CREATE POLICY demo_sin_borrar ON fabricantes AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.es_cuenta_demo());

-- Fila de public.usuarios de una cuenta demo: desde la API nadie (ni el admin demo)
-- le cambia correo, rol, estado o descuento. Desde el SQL Editor sí se puede.
CREATE OR REPLACE FUNCTION public.proteger_usuario_demo() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.es_email_demo(OLD.email) AND current_user = 'authenticated' THEN
    NEW.email := OLD.email;
    NEW.rol := OLD.rol;
    NEW.activo := OLD.activo;
    NEW.descuento_global := OLD.descuento_global;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_proteger_usuario_demo ON usuarios;
CREATE TRIGGER trg_proteger_usuario_demo BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION public.proteger_usuario_demo();

-- Auth: GoTrue se conecta como supabase_auth_admin (no pasa por PostgREST, así que no hay
-- claims del JWT). Para las cuentas demo:
--   * cambiar el correo lanza un error;
--   * la contraseña se conserva en silencio (un error podría romper el login si GoTrue
--     reescribe el hash al iniciar sesión).
-- Ojo: también afecta al panel Authentication de Supabase (usa GoTrue). Para cambiar la
-- contraseña de una cuenta demo, usar el SQL Editor:
--   UPDATE auth.users SET encrypted_password = crypt('nueva', gen_salt('bf')) WHERE email = '...';
CREATE OR REPLACE FUNCTION public.bloquear_credenciales_demo() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF session_user = 'supabase_auth_admin' AND public.es_email_demo(OLD.email) THEN
    IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_change IS DISTINCT FROM OLD.email_change THEN
      RAISE EXCEPTION 'Las cuentas de demostración no pueden cambiar su correo';
    END IF;
    NEW.encrypted_password := OLD.encrypted_password;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bloquear_credenciales_demo ON auth.users;
CREATE TRIGGER trg_bloquear_credenciales_demo BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_credenciales_demo();

-- Validación en servidor.
ALTER TABLE productos ADD CONSTRAINT productos_tipo_iva_valido CHECK (tipo_iva BETWEEN 0 AND 30);
ALTER TABLE detalle_cotizacion
  ADD CONSTRAINT detalle_cot_tipo_iva_valido CHECK (tipo_iva BETWEEN 0 AND 30),
  ADD CONSTRAINT detalle_cot_cantidad_maxima CHECK (cantidad <= 100000);
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_validez_valida CHECK (validez_dias BETWEEN 1 AND 365);

-- ==============================================================================
-- REGISTRO DE AUDITORÍA (database/migrations/2026-11-18_auditoria.sql)
-- Quién cambió qué en productos, categorías, fabricantes, usuarios y cotizaciones,
-- con el valor anterior y el nuevo. Solo lo lee el admin; nadie lo edita desde la API.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.auditoria (
  id BIGSERIAL PRIMARY KEY,
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  fila_id UUID,
  usuario_id UUID,               -- NULL si el cambio no viene de un usuario (SQL Editor, cron)
  anterior JSONB,
  nuevo JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fila ON public.auditoria (tabla, fila_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria (created_at DESC);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auditoria_leer_admin ON public.auditoria;
CREATE POLICY auditoria_leer_admin ON public.auditoria FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'admin');
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.auditoria FROM anon, authenticated;

-- Columnas que cambian solas en cada visita o recalculo: no generan entrada por sí solas.
CREATE OR REPLACE FUNCTION public.registrar_auditoria() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ignoradas TEXT[] := ARRAY['updated_at', 'last_session_activity', 'current_session_id'];
  v_anterior JSONB := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_nuevo JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
BEGIN
  IF TG_OP = 'UPDATE' AND (v_anterior - v_ignoradas) = (v_nuevo - v_ignoradas) THEN
    RETURN NULL;
  END IF;
  INSERT INTO auditoria (tabla, operacion, fila_id, usuario_id, anterior, nuevo)
  VALUES (TG_TABLE_NAME, TG_OP,
          COALESCE(v_nuevo ->> 'id', v_anterior ->> 'id')::UUID,
          auth.uid(), v_anterior, v_nuevo);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria ON public.productos;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.categorias;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.fabricantes;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.fabricantes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.usuarios;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.cotizaciones;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- Historial de estados de pedidos: lectura para el admin.
DROP POLICY IF EXISTS historial_leer_admin ON public.pedido_historial_estados;
CREATE POLICY historial_leer_admin ON public.pedido_historial_estados FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'admin');

-- Funciones de trigger: solo las ejecuta PostgreSQL al dispararse el trigger.
REVOKE EXECUTE ON FUNCTION
  public.registrar_auditoria(),
  public.handle_new_user(),
  public.sync_totales_cotizacion(),
  public.sync_totales_pedido(),
  public.log_cambio_estado_pedido(),
  public.check_usuario_update(),
  public.bloquear_credenciales_demo(),
  public.proteger_insert_cotizacion(),
  public.proteger_update_cotizacion(),
  public.proteger_insert_detalle_cotizacion(),
  public.proteger_usuario_demo(),
  public.procesar_pedidos_en_espera()
FROM PUBLIC, anon, authenticated;
