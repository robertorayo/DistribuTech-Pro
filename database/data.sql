-- ==============================================================================
-- DISTRIBUTECH PRO - DATOS INICIALES (SEMILLA)
-- ==============================================================================
-- NOTA: Los 'usuarios' no pueden inicializarse puramente en SQL debido a que 
-- dependen de la creación criptográfica en el sistema de 'auth.users' de Supabase.

-- 0. Limpiar datos anteriores para evitar conflictos de IDs duplicados
TRUNCATE TABLE public.productos, public.fabricantes, public.categorias CASCADE;

-- 1. Insertar Categorías (Con UUIDs fijos predecibles para el seeding)
INSERT INTO categorias (id, nombre, descripcion, sector) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Bombas de agua', 'Bombas sumergibles y de superficie', 'fontaneria'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tuberías PVC', 'Tubería rígida, saneamiento y presión', 'fontaneria'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Atornilladores a Batería', 'Herramienta portátil profesional', 'ferreteria'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Válvulas y Riego', 'Sistemas de automatización agrícola', 'riego');

-- 2. Insertar Fabricantes
INSERT INTO fabricantes (id, nombre, contacto, telefono, email, direccion) VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10', 'Bosch Professional', 'Ventas España', '+34 91 123 4567', 'distribucion@bosch.es', 'Madrid, España'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Roca Sanitarios', 'Centro B2B', '+34 93 987 6543', 'profesionales@roca.es', 'Barcelona, España'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Hunter Irrigation', 'Soporte Técnico', '+34 96 555 1234', 'b2b@hunter.com', 'Valencia, España');

-- 3. Insertar Productos 
INSERT INTO productos (nombre, categoria_id, fabricante_id, descripcion, especificaciones_tecnicas, precio, tipo_iva, stock) 
VALUES
(
  'Taladro Atornillador Bosch 18V', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', -- Ferretería
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10', -- Bosch
  'Taladro profesional de alta potencia con batería litio.',
  '{"voltaje": "18V", "bateria_incluida": true, "rpm_max": "1900 rpm", "peso": "1.2 kg"}',
  195.50, 
  21.00, 
  45
),
(
  'Bomba Sumergible 1000W Águas Sucias', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', -- Fontanería
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', -- Roca (Asumido)
  'Bomba para extracción de aguas con sólidos hasta 35mm.',
  '{"potencia": "1000W", "caudal_max": "18000 l/h", "altura_max": "10m", "inmersion_max": "7m"}',
  135.00, 
  21.00, 
  12
),
(
  'Tubo Saneamiento PVC 110mm x 3m SN4', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fontanería
  NULL, -- Sin fabricante asignado
  'Tubo de saneamiento liso teja con junta elástica.',
  '{"diametro": "110mm", "longitud": "3m", "rigidez": "SN4", "espesor": "3.2mm"}',
  14.25, 
  21.00, 
  350
),
(
  'Programador Riego Hunter X-Core 4 Estaciones', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', -- Riego
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', -- Hunter
  'Programador residencial e institucional básico interior/exterior.',
  '{"estaciones": 4, "tipo": "fijo", "armario": "exterior", "programas_independientes": 3}',
  112.75, 
  21.00, 
  25
);
