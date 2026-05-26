-- ==============================================================================
-- DISTRIBUTECH PRO - DATOS INICIALES AMPLIADOS (SEMILLA v2)
-- ==============================================================================
-- NOTA: Los 'usuarios' no pueden inicializarse puramente en SQL porque dependen
-- del sistema auth.users de Supabase. Ejecuta este script desde el SQL Editor
-- del proyecto en Supabase Dashboard (o via CLI: supabase db reset --seed).
-- ==============================================================================

-- 0. Limpiar datos anteriores para evitar conflictos de IDs duplicados
TRUNCATE TABLE public.productos, public.fabricantes, public.categorias CASCADE;

-- ==============================================================================
-- 1. CATEGORÍAS (10 categorías)
-- ==============================================================================
INSERT INTO categorias (id, nombre, descripcion, sector) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Bombas de Agua',            'Bombas sumergibles, de superficie y presurizadoras',          'fontaneria'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tuberías y Accesorios PVC',  'Tubería rígida, saneamiento, presión y accesorios de unión',  'fontaneria'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Herramienta Eléctrica',      'Taladros, amoladoras, sierras y herramienta portátil',       'ferreteria'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Sistemas de Riego',          'Programadores, aspersores, goteros y filtros de riego',       'riego'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Valvulería Industrial',      'Válvulas de compuerta, mariposa, esfera y retención',         'industrial'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Griferías y Sanitarios',     'Grifería monomando, termoestática y accesorios de baño',      'bano'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Calefacción y ACS',          'Radiadores, calderas, termos eléctricos y suelo radiante',    'fontaneria'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Herramienta Manual',         'Llaves, destornilladores, alicates y equipos de medición',   'ferreteria'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Protección y Seguridad',     'EPIs, cascos, guantes, arneses y señalización',              'industrial'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Depósitos y Almacenaje',     'Depósitos de agua, silos y contenedores industriales',        'industrial');

-- ==============================================================================
-- 2. FABRICANTES (10 fabricantes)
-- ==============================================================================
INSERT INTO fabricantes (id, nombre, contacto, telefono, email, direccion) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10', 'Bosch Professional',     'Ventas España',        '911234567', 'distribucion@bosch.es',       'C/ Burgos 12, 28036 Madrid'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Roca Sanitarios',        'Centro B2B',           '935678901', 'profesionales@roca.es',       'Av. Diagonal 514, 08006 Barcelona'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Hunter Irrigation',      'Soporte Técnico',      '965551234', 'b2b@hunter-europe.com',       'Pol. Ind. Fuente del Jarro, Valencia'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Grundfos Iberia',        'Departamento Técnico', '914445566', 'ventas@grundfos.es',          'Pol. Ind. Alcobendas, Madrid'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'Laufen España',          'Atención Profesional', '932109876', 'pro@laufen.es',               'C/ Còrsega 289, 08008 Barcelona'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'Stanley Black & Decker', 'Canal Profesional',    '917654321', 'profesional@stanleybds.es',   'C/ Orense 34, 28020 Madrid'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'Siemens Building',       'Automatización',       '936789012', 'building@siemens.es',         'Av. Tibidabo 17, 08022 Barcelona'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17', 'Jimten Fontanería',      'Ventas Directas',      '965112233', 'ventas@jimten.es',            'Pol. Ind. Quart, 46930 Valencia'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18', 'Gewiss Electro',         'Distribución',         '918877665', 'ventas@gewiss.es',            'P. Empresarial Omega, Alcobendas'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19', 'Pladur Knauf',           'Soporte Obra',         '913456789', 'tecnico@pladur.es',           'Av. de la Industria 49, Alcobendas');

-- ==============================================================================
-- 3. PRODUCTOS (55 productos)
-- ==============================================================================
INSERT INTO productos (nombre, categoria_id, fabricante_id, descripcion, especificaciones_tecnicas, precio, tipo_iva, stock, activo)
VALUES

-- ── BOMBAS DE AGUA (8 productos) ─────────────────────────────────────────────
('Bomba Sumergible Aguas Sucias 1000W',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Bomba para extracción de aguas residuales con sólidos hasta 35 mm. Ideal para obras, sótanos e industria.',
 '{"potencia":"1000W","caudal_max":"18000 l/h","altura_max":"10m","paso_solidos":"35mm","inmersion_max":"7m"}',
 135.00, 21.00, 12, true),

('Bomba Presurizadora Grundfos CM5-5',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Bomba centrífuga de alta eficiencia para instalaciones domésticas e industriales ligeras.',
 '{"potencia":"750W","caudal_max":"5 m³/h","altura_max":"55m","conexion":"G 1 1/4\"","ip":"IP54"}',
 389.00, 21.00, 8, true),

('Bomba de Superficie 650W Autoaspirante',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Bomba autoaspirante para pozos, aljibes y trasvase de agua limpia.',
 '{"potencia":"650W","caudal_max":"3600 l/h","altura_max":"45m","profundidad_aspir":"9m"}',
 89.50, 21.00, 20, true),

('Bomba Dosificadora Grundfos DDE 15-4',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Dosificadora eléctrica de diafragma para tratamiento de agua y fertilización.',
 '{"caudal":"15 l/h","presion_max":"4 bar","comunicacion":"4-20mA","material_cabezal":"PP"}',
 245.00, 21.00, 15, true),

('Bomba Sumergible Pozo Profundo 4" 1HP',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Bomba helicoidal para pozos de 4". Protección contra marcha en seco.',
 '{"potencia":"0.75kW","caudal":"3.6 m³/h","altura":"80m","diametro":"4 pulgadas"}',
 312.00, 21.00, 6, true),

('Depósito Membrana 24L Anti-golpe Ariete',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Depósito de expansión con membrana de butilo. Para grupos de presión.',
 '{"capacidad":"24L","presion_max":"10 bar","conexion":"3/4\"","membrana":"butilo"}',
 48.90, 21.00, 35, true),

('Grupo de Presión Doméstico 1HP + Presostato',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Kit completo con bomba, depósito 24L y presostato. Listo para instalar.',
 '{"potencia":"0.75kW","caudal":"3 m³/h","deposito":"24L","presostato_incluido":true}',
 289.00, 21.00, 9, true),

('Bomba Circuladora Alpha1 L 25-40',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
 'Circuladora para calefacción y ACS. Ultra-eficiente clase A.',
 '{"potencia":"5-34W","altura_max":"4m","caudal_max":"3.5 m³/h","conexion":"1\"","clase_energia":"A"}',
 198.00, 21.00, 22, true),

-- ── TUBERÍAS Y ACCESORIOS PVC (7 productos) ──────────────────────────────────
('Tubo Saneamiento PVC 110mm x 3m SN4',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Tubo de saneamiento liso teja con junta elástica. Norma EN 1401.',
 '{"diametro":"110mm","longitud":"3m","rigidez":"SN4","espesor":"3.2mm","norma":"EN 1401"}',
 14.25, 21.00, 350, true),

('Tubo PVC Presión 63mm PN16 x 6m',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Tubo de PVC para agua potable a presión. Color azul. UNE-EN ISO 1452.',
 '{"diametro":"63mm","longitud":"6m","presion":"PN16","color":"azul","norma":"ISO 1452"}',
 22.80, 21.00, 180, true),

('Codo 90° PVC Saneamiento 110mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Codo de 90° para tuberías de saneamiento de 110mm. Con junta.',
 '{"angulo":"90°","diametro":"110mm","material":"PVC-U","color":"teja"}',
 4.80, 21.00, 500, true),

('Injerto PVC Saneamiento 110/50mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Injerto reducido 45° para derivaciones en tuberías de saneamiento.',
 '{"angulo":"45°","diametro_principal":"110mm","diametro_ramal":"50mm"}',
 6.20, 21.00, 280, true),

('Tubo Multicapa PEX-AL-PEX 20x2mm x 100m',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Tubería multicapa para instalaciones de fontanería y calefacción.',
 '{"diametro":"20mm","espesor":"2mm","longitud":"100m","presion_max":"10 bar","temp_max":"95°C"}',
 89.00, 21.00, 60, true),

('Collarín Toma en Carga PVC 110/1"',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Collarín electrosoldable para toma en carga sin corte de suministro.',
 '{"tubo_compatible":"110mm","rosca":"1 pulgada","material":"PVC+acero"}',
 12.50, 21.00, 120, true),

('Manguito PVC Saneamiento 110mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Manguito de unión para tuberías de saneamiento de 110mm.',
 '{"diametro":"110mm","longitud":"150mm","material":"PVC-U"}',
 3.90, 21.00, 400, true),

-- ── HERRAMIENTA ELÉCTRICA (9 productos) ──────────────────────────────────────
('Taladro Atornillador Bosch GSR 18V-55',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Taladro atornillador profesional 18V con dos baterías de 2Ah y maletín.',
 '{"voltaje":"18V","par_max":"55Nm","rpm_max":"1900","bateria":"2x2.0Ah","peso":"1.2kg"}',
 195.50, 21.00, 45, true),

('Amoladora Angular Bosch GWS 18V-10',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Amoladora angular 18V sin cable. Disco 125mm. Incluye 1 batería 5Ah.',
 '{"voltaje":"18V","disco":"125mm","rpm_max":"9000","bateria":"5Ah","peso":"2.0kg"}',
 224.00, 21.00, 30, true),

('Sierra Circular Bosch GKS 18V-57',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Sierra circular de batería con profundidad de corte 57mm a 90°.',
 '{"voltaje":"18V","disco":"165mm","corte_90":"57mm","corte_45":"40mm","bateria":"4Ah"}',
 278.00, 21.00, 18, true),

('Martillo Demoledor SDS-Max Bosch GSH 16-30',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Martillo demoledor de 1750W para trabajos intensivos en hormigón y mampostería.',
 '{"potencia":"1750W","energia_golpe":"41J","golpes":"900-1700/min","peso":"16.5kg"}',
 649.00, 21.00, 7, true),

('Nivel Láser Autonivelante Bosch GLL 3-80',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Nivel láser de 3 líneas con rango de 80m y base magnética incluida.',
 '{"lineas":"3","alcance":"80m","precision":"±0.1mm/m","autonivelacion":"±4°","ip":"IP 54"}',
 385.00, 21.00, 12, true),

('Caladora Pendular Stanley FME340K',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Caladora 18V con 4 posiciones de movimiento pendular y guía láser.',
 '{"voltaje":"18V","carrera":"26mm","movimiento_pendular":"4 pos","capacidad_madera":"80mm"}',
 164.00, 21.00, 25, true),

('Lijadora Orbital Stanley FME650K',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Lijadora orbital aleatoria de 18V. Bolsa de polvo 10L incluida.',
 '{"voltaje":"18V","diametro_disco":"125mm","orbita":"2.8mm","rpm":"8000-12000"}',
 142.00, 21.00, 20, true),

('Compresor Silencioso 24L 1.5HP Bosch',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
 'Compresor silencioso sin aceite 24L. Ideal para taller y obra.',
 '{"potencia":"1.1kW","deposito":"24L","caudal":"105 l/min","presion_max":"8 bar","ruido":"69dB"}',
 219.00, 21.00, 14, true),

('Soldadora Inverter MIG 180A',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Soldadora inverter MIG/MAG 180A con antorcha, pinza y cable 3m.',
 '{"corriente":"180A","ciclo_trabajo":"60%","tension":"230V","electrodo":"0.6-0.9mm"}',
 345.00, 21.00, 10, true),

-- ── SISTEMAS DE RIEGO (7 productos) ──────────────────────────────────────────
('Programador Hunter X-Core 4 Estaciones',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Programador de riego residencial interior/exterior. 3 programas independientes.',
 '{"estaciones":4,"programas":3,"tipo":"fijo","montaje":"muro","ip":"IP54"}',
 112.75, 21.00, 25, true),

('Programador Hunter Pro-HC 12 Estaciones WiFi',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Programador inteligente 12 estaciones con control por app y ajuste climático.',
 '{"estaciones":12,"conectividad":"WiFi","app":"Hydrawise","montaje":"muro","evapotranspiracion":true}',
 298.00, 21.00, 15, true),

('Aspersor Hunter PGP-ADJ 0-360°',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Aspersor emergente de turbina con arco y radio ajustables. Filtro integrado.',
 '{"arco":"0-360°","radio":"8-15m","presion":"2-5 bar","elevacion":"114mm"}',
 18.90, 21.00, 150, true),

('Gotero Autocompensante 4L/h',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Gotero de botón autocompensante. Caudal constante de 1 a 4 bar.',
 '{"caudal":"4 l/h","presion":"1-4 bar","conexion":"4mm","material":"PP"}',
 0.85, 21.00, 2000, true),

('Filtro de Malla 1" 120 mesh',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Filtro de malla para instalaciones de riego por goteo y micro-aspersión.',
 '{"conexion":"1 pulgada","filtrado":"120 mesh","caudal_max":"10 m³/h","presion_max":"10 bar"}',
 24.50, 21.00, 80, true),

('Tubería PE 32 x 2.9mm PN6 x 50m',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Tubería de polietileno de baja densidad para riego. Color negro.',
 '{"diametro":"32mm","espesor":"2.9mm","longitud":"50m","presion":"PN6","color":"negro"}',
 42.00, 21.00, 90, true),

('Electroválvula Hunter PGV-100-MM 1"',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
 'Electroválvula de plástico 1" con regulador de caudal integrado. 24VAC.',
 '{"conexion":"1 pulgada","voltaje":"24VAC","presion":"1-10 bar","caudal":"0.5-7.5 m³/h"}',
 48.90, 21.00, 55, true),

-- ── VALVULERÍA INDUSTRIAL (6 productos) ──────────────────────────────────────
('Válvula de Compuerta DN50 PN16 Fundición',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Válvula de compuerta con husillo ascendente. Bridas PN16. Para agua y vapor.',
 '{"dn":"50","pn":"16","material":"fundicion_ductil","obturador":"bronce","norma":"EN 1171"}',
 98.00, 21.00, 40, true),

('Válvula Mariposa DN100 Wafer Palanca',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Válvula mariposa tipo wafer con palanca. Cuerpo de fundición y disco de acero.',
 '{"dn":"100","tipo":"wafer","accionamiento":"palanca","presion_max":"16 bar"}',
 74.50, 21.00, 28, true),

('Válvula de Esfera 3/4" Latón PN25',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Válvula de paso total en latón niquelado. Rosca macho-hembra.',
 '{"conexion":"3/4 pulgada","pn":"25","material":"laton","paso":"total","rosca":"MH"}',
 12.80, 21.00, 300, true),

('Válvula de Retención Clapeta DN80',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Válvula antiretorno de clapeta con bridas. Acero inoxidable AISI 316.',
 '{"dn":"80","material":"acero_316","presion_max":"16 bar","temperatura_max":"120°C"}',
 145.00, 21.00, 20, true),

('Válvula Reductora de Presión 1" 1.5-6 bar',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Reductor de presión doméstico con manómetro incorporado.',
 '{"conexion":"1 pulgada","rango_salida":"1.5-6 bar","presion_entrada_max":"25 bar","manometro":true}',
 89.00, 21.00, 45, true),

('Colector Distribución 1" x 4 Salidas 3/4"',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Colector de latón con 4 salidas con llave. Ideal para circuito de suelo radiante.',
 '{"entrada":"1 pulgada","salidas":4,"diametro_salida":"3/4 pulgada","material":"laton"}',
 67.50, 21.00, 35, true),

-- ── GRIFERÍAS Y SANITARIOS (5 productos) ─────────────────────────────────────
('Grifo Monomando Lavabo Roca Esmai',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
 'Grifo monomando de lavabo con cartucho cerámico de 35mm. Acabado cromo brillo.',
 '{"conexion":"1/2 pulgada","cartucho":"35mm","acabado":"cromo","certificacion":"AENOR"}',
 89.90, 21.00, 40, true),

('Grifería Termoestática Ducha Roca T-1000',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
 'Termostato de ducha empotrado con antescalda 38°C. Incluye teclas y cuerpo.',
 '{"conexiones":"1/2 pulgada","temp_max":"38°C","caudal_max":"20 l/min","acabado":"cromo"}',
 345.00, 21.00, 12, true),

('Lavabo Suspendido Laufen Pro 60cm Blanco',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
 'Lavabo de porcelana vitrificada suspendido. Sin agujero de grifo. Con LCC.',
 '{"largo":"60cm","ancho":"48cm","material":"ceramica","montaje":"suspendido","lcc":true}',
 249.00, 21.00, 18, true),

('Inodoro Compacto Roca Dama Sentado Plus',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
 'Inodoro compacto con salida al suelo. Cisterna baja incluida. Descarga dual 3/6L.',
 '{"salida":"suelo","cisterna":"baja","descarga":"3_6L","asiento":"no_incluido"}',
 298.00, 21.00, 14, true),

('Plato de Ducha Extraplano 90x90 Resina',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
 'Plato de ducha de resina antideslizante. Altura 3cm. Incluye desagüe.',
 '{"medida":"90x90cm","altura":"3cm","material":"resina","antideslizante":true,"desague":"incluido"}',
 389.00, 21.00, 10, true),

-- ── CALEFACCIÓN Y ACS (5 productos) ──────────────────────────────────────────
('Termo Eléctrico Junkers Elacell 80L',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
 'Acumulador eléctrico vertical 80L. Clase energética B. Ánodo de magnesio.',
 '{"capacidad":"80L","potencia":"1.5kW","temperatura_max":"75°C","clase_energia":"B","presion_max":"6 bar"}',
 289.00, 21.00, 20, true),

('Caldera de Condensación Siemens 24kW',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
 'Caldera mural de condensación gas natural 24kW para calefacción y ACS.',
 '{"potencia":"24kW","rendimiento":"109%","clase_energia":"A","combustible":"gas_natural","display":"digital"}',
 1249.00, 21.00, 5, true),

('Radiador Aluminio 10 Elementos 600mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
 'Radiador de aluminio inyectado de alta emisión térmica. Altura 600mm.',
 '{"elementos":10,"altura":"600mm","profundidad":"80mm","potencia_termica":"1680W","color":"blanco"}',
 185.00, 21.00, 30, true),

('Tubo de Suelo Radiante PEX 16x2mm x 200m',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Tubería de PEX barrera de oxígeno para sistemas de suelo radiante.',
 '{"diametro":"16mm","espesor":"2mm","longitud":"200m","barrera_oxigeno":true,"presion":"6 bar"}',
 148.00, 21.00, 25, true),

('Termostato Programable Siemens RDG160',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
 'Termostato de habitación programable semanal. Pantalla retroiluminada.',
 '{"programacion":"semanal","display":"retroiluminado","comunicacion":"KNX","rango":"5-30°C"}',
 98.00, 21.00, 50, true),

-- ── HERRAMIENTA MANUAL (4 productos) ─────────────────────────────────────────
('Llave Inglesa Ajustable 12" Stanley',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Llave inglesa de acero al cromo-vanadio con mango antideslizante.',
 '{"longitud":"300mm","apertura_max":"40mm","material":"Cr-V","acabado":"cromado"}',
 28.50, 21.00, 80, true),

('Juego 38 piezas Llaves de Vaso Stanley',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Maletín con juego de llaves de vaso métrico 1/2" y 3/8". Trinquete reversible.',
 '{"piezas":38,"cuadrados":"1/2 y 3/8","material":"Cr-V","maletín":"incluido"}',
 89.00, 21.00, 35, true),

('Alicates Presión Knipex 200mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Alicates de presión con mordaza plana. Acero especial templado al aceite.',
 '{"longitud":"200mm","apertura_max":"50mm","material":"acero_especial","mangos":"PVC bicolor"}',
 42.00, 21.00, 60, true),

('Metro Láser 50m Stanley TLM165',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
 'Medidor láser compacto hasta 50m. Cálculo de área, volumen y pitágoras.',
 '{"alcance":"50m","precision":"±1.5mm","funciones":"area_volumen_pitagoras","ip":"IP54"}',
 89.00, 21.00, 45, true),

-- ── PROTECCIÓN Y SEGURIDAD (4 productos) ─────────────────────────────────────
('Casco de Seguridad EN 397 con Arnés',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
 'Casco de obra con arnés de 6 puntos y ranuras para accesorios.',
 '{"norma":"EN 397","puntos_arnes":6,"material":"HDPE","color":"amarillo","accesorios":"ranuras laterales"}',
 18.90, 21.00, 200, true),

('Guantes Anticorte Nivel 5 Talla L',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
 'Guantes de protección mecánica anticorte nivel 5. Palma de PU.',
 '{"nivel_corte":"5","norma":"EN 388","talla":"L","palma":"PU","interior":"HPPE"}',
 12.50, 21.00, 300, true),

('Arnés Anticaída Completo EN 361',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
 'Arnés corporal completo con punto dorsal y esternal. Hasta 150kg.',
 '{"norma":"EN 361","puntos_enganche":2,"carga_max":"150kg","material":"poliéster","talla":"M-XL"}',
 89.00, 21.00, 40, true),

('Señal Peligro Eléctrico 210x297mm',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
 'Señal de advertencia peligro eléctrico autoadhesiva. Conforme EN ISO 7010.',
 '{"medida":"210x297mm","norma":"EN ISO 7010","material":"vinilo","adhesiva":true,"codigo":"W012"}',
 3.20, 21.00, 500, true),

-- ── DEPÓSITOS Y ALMACENAJE (5 productos) ─────────────────────────────────────
('Depósito Agua Potable PE 500L Circular',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Depósito circular de polietileno para agua potable. Con tapa y bocas.',
 '{"capacidad":"500L","material":"PE","agua_potable":true,"tapa":"incluida","boca_llenado":"2 pulgadas"}',
 289.00, 21.00, 12, true),

('Depósito Vertical Industrial PEHD 1000L',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Depósito vertical de PEHD de alta densidad. Para productos químicos y agua.',
 '{"capacidad":"1000L","material":"PEHD","forma":"vertical","bocas":"3","palet_incluido":false}',
 498.00, 21.00, 6, true),

('Contenedor GRG 1000L IBC Inox',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'GRG/IBC de acero inoxidable 316L con jaula. Apto para alimentario y químicos.',
 '{"capacidad":"1000L","material":"AISI 316L","valvula":"DN50","palet":"acero","apto_alimentario":true}',
 1890.00, 21.00, 3, true),

('Estantería Metálica Industrial 5 Niveles',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
 'Estantería de acero galvanizado 5 niveles. Carga por balda 175kg.',
 '{"niveles":5,"largo":"180cm","alto":"180cm","profundidad":"60cm","carga_balda":"175kg"}',
 168.00, 21.00, 22, true),

('Bidón Metálico 200L Homologado ADR',
 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
 'Bidón metálico estándar 200L homologado para transporte de mercancías peligrosas.',
 '{"capacidad":"200L","material":"acero","homologacion":"ADR","cierre":"boca_ancha","recubrimiento":"epoxi"}',
 78.00, 21.00, 30, true);

-- ==============================================================================
-- FIN DEL SCRIPT
-- Totales: 10 categorías · 10 fabricantes · 55 productos
-- ==============================================================================
