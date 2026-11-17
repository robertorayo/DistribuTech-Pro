-- ==============================================================================
-- DISTRIBUTECH PRO - Endurecimiento de seguridad para la demo pública
-- ==============================================================================
-- ESTADO: APLICADA en producción el 18-11-2026 (sin BEGIN/COMMIT, como migración de Supabase).
-- Su contenido está integrado en database/schema.sql.
--
-- Se basa en el estado real de producción, consultado el 17-11-2026 en solo lectura:
--   * RLS activado en las 14 tablas (schema.sql no lo refleja en 9 de ellas).
--   * Trigger trg_check_usuario_update: un no-admin no puede cambiarse el rol (bien).
--   * handle_new_user toma el rol de raw_user_meta_data   -> escalada a admin al registrarse.
--   * Todas las funciones SECURITY DEFINER tienen EXECUTE para anon y no fijan search_path.
--   * aprobar_cotizacion usa "get_my_rol() NOT IN (...)", que con anon (NULL) no lanza el error.
--   * Un cliente puede cambiar cualquier columna de su cotización y fijar el precio del detalle.
--   * Las cuentas demo pueden borrar catálogo y cambiar su correo o contraseña en Auth.
--
-- Comprobaciones previas recomendadas (no modifican nada):
--   SELECT email, rol FROM usuarios WHERE rol <> 'cliente';                 -- ¿admins inesperados?
--   SELECT count(*) FROM productos WHERE tipo_iva NOT BETWEEN 0 AND 30;     -- debe ser 0
--   SELECT count(*) FROM detalle_cotizacion WHERE cantidad > 100000 OR tipo_iva NOT BETWEEN 0 AND 30;
--   SELECT count(*) FROM cotizaciones WHERE validez_dias NOT BETWEEN 1 AND 365;
--
-- Todo va en una transacción: si algo falla, no se aplica nada.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Registro: el rol siempre es 'cliente'. Solo un admin lo cambia después.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. Funciones SECURITY DEFINER: search_path fijo y sin ejecución anónima.
--    get_my_rol() se deja ejecutable por anon porque las políticas de lectura
--    pública (categorías, productos) la evalúan; para anon devuelve NULL.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. El cliente no decide precios ni estados.
--    current_user = 'authenticated' solo cuando la escritura llega directa desde la
--    API; dentro de las funciones SECURITY DEFINER (dividir, mantener, aprobar)
--    current_user es el propietario y estas reglas no estorban.
-- ------------------------------------------------------------------------------
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

-- 3d. Pedidos: la app nunca los crea desde el navegador (los crean las funciones de
--     aprobación). Se retira el permiso de inserción directa a los clientes.
DROP POLICY IF EXISTS user_crear_pedidos ON pedidos;
CREATE POLICY admin_crear_pedidos ON pedidos FOR INSERT TO authenticated
  WITH CHECK (public.get_my_rol() = 'admin');

DROP POLICY IF EXISTS user_crear_detalle_ped ON detalle_pedido;
CREATE POLICY admin_crear_detalle_ped ON detalle_pedido FOR INSERT TO authenticated
  WITH CHECK (public.get_my_rol() = 'admin');

-- 3e. Dividir y esperar stock: solo sobre una cotización propia, pendiente y con la
--     incidencia de stock abierta. Antes un cliente podía dividir cualquier cotización
--     pendiente (saltándose al comercial) o repetirlo sobre una ya dividida.
--     Cuerpos copiados de producción (pg_get_functiondef, 17-11-2026); solo cambian
--     la condición de búsqueda, el FOR UPDATE y search_path.
CREATE OR REPLACE FUNCTION public.dividir_cotizacion(p_cotizacion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_cot RECORD;
  v_detalle RECORD;
  v_cot_stock_id UUID;
  v_cot_sin_stock_id UUID;
  v_cantidad_disponible INT;
  v_cantidad_faltante INT;
  v_total_disponible INT := 0;
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.mantener_cotizacion_pendiente(p_cotizacion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- ------------------------------------------------------------------------------
-- 4. Cuentas demo: no pueden borrar catálogo ni cambiar su correo o contraseña.
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. Validación en servidor que faltaba.
-- ------------------------------------------------------------------------------
ALTER TABLE productos ADD CONSTRAINT productos_tipo_iva_valido CHECK (tipo_iva BETWEEN 0 AND 30);
ALTER TABLE detalle_cotizacion
  ADD CONSTRAINT detalle_cot_tipo_iva_valido CHECK (tipo_iva BETWEEN 0 AND 30),
  ADD CONSTRAINT detalle_cot_cantidad_maxima CHECK (cantidad <= 100000);
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_validez_valida CHECK (validez_dias BETWEEN 1 AND 365);

-- ------------------------------------------------------------------------------
-- 6. Limpieza: políticas duplicadas (mismas condiciones con dos nombres).
--    Comprobado en producción: cada una tiene su gemela con idéntica condición
--    (categorias_select_policy, categorias_admin_all, productos_select_policy, etc.),
--    así que la lectura pública del catálogo se mantiene.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins pueden gestionar categorías" ON categorias;
DROP POLICY IF EXISTS "Cualquiera puede ver categorías" ON categorias;
DROP POLICY IF EXISTS "Admins pueden gestionar fabricantes" ON fabricantes;
DROP POLICY IF EXISTS "Cualquiera puede ver fabricantes" ON fabricantes;
DROP POLICY IF EXISTS "Admins pueden gestionar productos" ON productos;
DROP POLICY IF EXISTS "Cualquiera puede ver productos activos" ON productos;

COMMIT;

-- Hecho: database/schema.sql vuelve a ser la fuente de verdad
