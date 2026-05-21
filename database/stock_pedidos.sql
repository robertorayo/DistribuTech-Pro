-- ==============================================================================
-- SCRIPT DE ACTUALIZACIÓN: SISTEMA DE GESTIÓN DE STOCK Y PEDIDOS
-- Ejecutar en: Supabase > SQL Editor
-- ==============================================================================

-- 1. Nuevas columnas en cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS notas_stock TEXT;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS tipo_incidencia VARCHAR(50);

-- 2. Nueva política RLS: el cliente puede leer sus propias cotizaciones con incidencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cotizaciones' AND policyname = 'cliente_update_own_cot'
  ) THEN
    CREATE POLICY "cliente_update_own_cot" ON cotizaciones FOR UPDATE 
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());
  END IF;
END
$$;

-- 3. FUNCIÓN PRINCIPAL: aprobar_cotizacion
--    Comprueba stock atómicamente. Si hay suficiente, aprueba y descuenta.
--    Si no, notifica al cliente marcando tipo_incidencia.
CREATE OR REPLACE FUNCTION aprobar_cotizacion(p_cotizacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_detalle RECORD;
  v_todos_ok BOOLEAN := true;
  v_disponible JSONB := '[]'::JSONB;
  v_faltante JSONB := '[]'::JSONB;
BEGIN
  -- Solo admin o comercial pueden aprobar
  IF get_my_rol() NOT IN ('admin', 'comercial') THEN
    RAISE EXCEPTION 'Sin permisos para aprobar cotizaciones';
  END IF;

  -- Revisar stock de cada línea (con bloqueo para evitar condiciones de carrera)
  FOR v_detalle IN
    SELECT dc.id, dc.producto_id, dc.cantidad, p.nombre, p.stock
    FROM detalle_cotizacion dc
    JOIN productos p ON p.id = dc.producto_id
    WHERE dc.cotizacion_id = p_cotizacion_id
    FOR UPDATE OF p
  LOOP
    IF v_detalle.stock >= v_detalle.cantidad THEN
      -- Stock OK
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id,
        'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad,
        'cantidad_disponible', v_detalle.cantidad,
        'cantidad_faltante', 0
      );
    ELSE
      -- Stock insuficiente
      v_todos_ok := false;
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id,
        'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad,
        'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
      v_faltante := v_faltante || jsonb_build_object(
        'producto_id', v_detalle.producto_id,
        'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad,
        'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
    END IF;
  END LOOP;

  IF v_todos_ok THEN
    -- Hay stock suficiente: descontar y aprobar
    FOR v_detalle IN
      SELECT dc.producto_id, dc.cantidad
      FROM detalle_cotizacion dc
      WHERE dc.cotizacion_id = p_cotizacion_id
    LOOP
      UPDATE productos SET stock = stock - v_detalle.cantidad WHERE id = v_detalle.producto_id;
    END LOOP;

    UPDATE cotizaciones
    SET estado = 'aprobada', notas_stock = NULL, tipo_incidencia = NULL, updated_at = now()
    WHERE id = p_cotizacion_id;

    RETURN jsonb_build_object('resultado', 'aprobada', 'tiene_incidencia', false);
  ELSE
    -- Stock insuficiente: notificar al cliente para que decida
    UPDATE cotizaciones
    SET tipo_incidencia = 'pendiente_decision_cliente',
        notas_stock = jsonb_build_object('disponible', v_disponible, 'faltante', v_faltante)::TEXT,
        updated_at = now()
    WHERE id = p_cotizacion_id;

    RETURN jsonb_build_object(
      'resultado', 'pendiente_decision_cliente',
      'tiene_incidencia', true,
      'disponible', v_disponible,
      'faltante', v_faltante
    );
  END IF;
END;
$$;

-- 4. FUNCIÓN: dividir_cotizacion
--    El cliente decide dividir en: Pedido A (con stock) + Pedido B (sin stock/en espera)
CREATE OR REPLACE FUNCTION dividir_cotizacion(p_cotizacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cot RECORD;
  v_detalle RECORD;
  v_cot_stock_id UUID;
  v_cot_sin_stock_id UUID;
  v_cantidad_disponible INT;
  v_cantidad_faltante INT;
  v_tiene_con_stock BOOLEAN := false;
  v_tiene_sin_stock BOOLEAN := false;
BEGIN
  -- Verificar que la cotización pertenece al usuario
  SELECT * INTO v_cot FROM cotizaciones
  WHERE id = p_cotizacion_id AND usuario_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada o sin permiso';
  END IF;

  -- Crear cotización A: artículos con stock disponible
  INSERT INTO cotizaciones (usuario_id, creado_por, estado, notas_stock, tipo_incidencia)
  VALUES (v_cot.usuario_id, v_cot.usuario_id, 'pendiente',
    'Pedido dividido automáticamente — artículos CON stock (listos para servir)', NULL)
  RETURNING id INTO v_cot_stock_id;

  -- Crear cotización B: artículos sin stock (en espera)
  INSERT INTO cotizaciones (usuario_id, creado_por, estado, notas_stock, tipo_incidencia)
  VALUES (v_cot.usuario_id, v_cot.usuario_id, 'pendiente',
    'Pedido dividido automáticamente — artículos EN ESPERA de reposición de stock', 'esperando_stock')
  RETURNING id INTO v_cot_sin_stock_id;

  -- Distribuir líneas entre los dos nuevos pedidos
  FOR v_detalle IN
    SELECT dc.producto_id, dc.cantidad, dc.precio_unitario, dc.tipo_iva, dc.descuento_porcentaje, p.stock, p.nombre
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
      -- Descontar stock
      UPDATE productos SET stock = stock - v_cantidad_disponible WHERE id = v_detalle.producto_id;
      v_tiene_con_stock := true;
    END IF;

    IF v_cantidad_faltante > 0 THEN
      INSERT INTO detalle_cotizacion (cotizacion_id, producto_id, cantidad, precio_unitario, tipo_iva, descuento_porcentaje)
      VALUES (v_cot_sin_stock_id, v_detalle.producto_id, v_cantidad_faltante, v_detalle.precio_unitario, v_detalle.tipo_iva, v_detalle.descuento_porcentaje);
      v_tiene_sin_stock := true;
    END IF;
  END LOOP;

  -- Aprobar automáticamente el pedido A (ya se descontó el stock)
  UPDATE cotizaciones SET estado = 'aprobada', updated_at = now() WHERE id = v_cot_stock_id;

  -- Marcar cotización original como procesada
  UPDATE cotizaciones
  SET estado = 'rechazada',
      notas_stock = 'Cotización original dividida en dos nuevos pedidos por incidencia de stock.',
      tipo_incidencia = NULL,
      updated_at = now()
  WHERE id = p_cotizacion_id;

  RETURN jsonb_build_object(
    'resultado', 'dividida',
    'cotizacion_con_stock', v_cot_stock_id,
    'cotizacion_sin_stock', v_cot_sin_stock_id
  );
END;
$$;

-- 5. FUNCIÓN: mantener_cotizacion_pendiente
--    El cliente elige esperar hasta que haya stock completo
CREATE OR REPLACE FUNCTION mantener_cotizacion_pendiente(p_cotizacion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cotizaciones
  SET tipo_incidencia = 'esperando_stock_completo',
      notas_stock = 'El cliente ha optado por esperar hasta que haya stock suficiente para servir el pedido completo.',
      updated_at = now()
  WHERE id = p_cotizacion_id AND usuario_id = auth.uid();
END;
$$;

-- 6. Permisos de ejecución para usuarios autenticados
GRANT EXECUTE ON FUNCTION aprobar_cotizacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dividir_cotizacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mantener_cotizacion_pendiente(UUID) TO authenticated;
