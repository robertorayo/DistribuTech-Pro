-- Actualización para evitar dividir pedidos si no hay stock disponible

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
  v_total_disponible INT := 0;
BEGIN
  SELECT * INTO v_cot FROM cotizaciones WHERE id = p_cotizacion_id AND usuario_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotización no encontrada o sin permiso'; END IF;

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
