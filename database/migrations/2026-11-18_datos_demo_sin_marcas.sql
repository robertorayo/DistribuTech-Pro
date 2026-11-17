-- ==============================================================================
-- DISTRIBUTECH PRO - Datos de la demo sin marcas reales
-- ==============================================================================
-- ESTADO: APLICADA en producción el 18-11-2026. database/data.sql ya usa estos nombres.
--
-- Los fabricantes de ejemplo usaban marcas reales con correos inventados en sus dominios
-- y direcciones de sus sedes. Se sustituyen por empresas ficticias (dominio reservado
-- .example, sin teléfono). Los productos pierden la marca y el modelo comercial del
-- nombre, se corrige la errata «Águas» y se reasignan los que tenían un fabricante
-- incoherente (EPIs de una marca de placas de yeso, una bomba de una marca de sanitarios…).
-- Solo UPDATE por id: no se borra nada ni cambian precios, stock o pedidos.
-- ==============================================================================

-- Fabricantes ficticios (mismos id)
UPDATE fabricantes SET nombre = 'Voltek Herramientas', contacto = 'Canal Profesional', email = 'ventas@voltek.example',            telefono = NULL, direccion = 'Pol. Ind. Las Rozas, Madrid'       WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10';
UPDATE fabricantes SET nombre = 'Aquanova Sanitarios',  contacto = 'Atención Profesional', email = 'profesionales@aquanova.example', telefono = NULL, direccion = 'Pol. Ind. Can Calderón, Barcelona' WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
UPDATE fabricantes SET nombre = 'Riegotec',             contacto = 'Soporte Técnico',      email = 'b2b@riegotec.example',           telefono = NULL, direccion = 'Pol. Ind. Fuente del Jarro, Valencia' WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12';
UPDATE fabricantes SET nombre = 'Hidrobomba Ibérica',   contacto = 'Departamento Técnico', email = 'ventas@hidrobomba.example',      telefono = NULL, direccion = 'Pol. Ind. Coslada, Madrid'          WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13';
UPDATE fabricantes SET nombre = 'Cerámicas Lumen',      contacto = 'Atención Profesional', email = 'pro@ceramicaslumen.example',     telefono = NULL, direccion = 'Pol. Ind. El Colomer, Castellón'    WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14';
UPDATE fabricantes SET nombre = 'Ferrex Tools',         contacto = 'Canal Profesional',    email = 'profesional@ferrex.example',     telefono = NULL, direccion = 'Pol. Ind. Júndiz, Vitoria'          WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15';
UPDATE fabricantes SET nombre = 'Termalia Clima',       contacto = 'Departamento Técnico', email = 'ventas@termalia.example',        telefono = NULL, direccion = 'Pol. Ind. Malpica, Zaragoza'        WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16';
UPDATE fabricantes SET nombre = 'Fluxa Fontanería',     contacto = 'Ventas Directas',      email = 'ventas@fluxa.example',           telefono = NULL, direccion = 'Pol. Ind. Quart, Valencia'          WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17';
UPDATE fabricantes SET nombre = 'Electra Norte',        contacto = 'Distribución',         email = 'ventas@electranorte.example',    telefono = NULL, direccion = 'Pol. Ind. Asipo, Asturias'          WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18';
UPDATE fabricantes SET nombre = 'Segurpro EPI',         contacto = 'Soporte Obra',         email = 'tecnico@segurpro.example',       telefono = NULL, direccion = 'Pol. Ind. Alcobendas, Madrid'       WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19';

-- Productos: nombre sin marca ni modelo comercial
UPDATE productos SET nombre = 'Alicates de Presión 200mm'                  WHERE id = 'ae9a10cb-c2d1-438b-bfdd-5305c5ac2cdb';
UPDATE productos SET nombre = 'Amoladora Angular 18V 125mm'                WHERE id = '74e16f4e-7b8c-4bcd-b4b7-27d2074abeb2';
UPDATE productos SET nombre = 'Aspersor de Turbina Ajustable 0-360°'       WHERE id = 'fc65b798-4442-4873-b33c-e6f1d7041716';
UPDATE productos SET nombre = 'Bomba Circuladora 25-40 Clase A'            WHERE id = 'e9f49752-26dc-4628-b8eb-cba293f17de4';
UPDATE productos SET nombre = 'Bomba Dosificadora de Diafragma 15 l/h'     WHERE id = '48d9498b-e374-4cca-adfe-e6b77b01274d';
UPDATE productos SET nombre = 'Bomba Presurizadora Centrífuga 750W'        WHERE id = '72bd52a4-0926-47df-835c-4192c73aa84c';
UPDATE productos SET nombre = 'Bomba Sumergible Aguas Sucias 1000W'        WHERE id = '6c48dd0a-012d-4a86-9703-f9e44f4526a3';
UPDATE productos SET nombre = 'Caladora Pendular 18V'                      WHERE id = '27ea35c7-3e70-4f4b-bcf0-274843406215';
UPDATE productos SET nombre = 'Caldera de Condensación 24kW'               WHERE id = '8339656c-6dcc-4a74-a537-486034b532da';
UPDATE productos SET nombre = 'Compresor Silencioso 24L 1.5HP'             WHERE id = '05c275b5-011a-437d-ad7e-30fb736e1871';
UPDATE productos SET nombre = 'Electroválvula de Riego 1" 24VAC'           WHERE id = 'a32d783c-bdda-4a0f-9f6e-f6b96300f70a';
UPDATE productos SET nombre = 'Grifería Termostática de Ducha Empotrada'   WHERE id = 'f75adadf-ff4a-4b7d-b660-8ccfc66cece4';
UPDATE productos SET nombre = 'Grifo Monomando de Lavabo Cromado'          WHERE id = 'ae6aae62-e85f-4a57-9fca-b2f366a70c4d';
UPDATE productos SET nombre = 'Inodoro Compacto Descarga Dual'             WHERE id = 'b863cc1b-2ce4-4322-bd13-e8433ae09e1a';
UPDATE productos SET nombre = 'Juego de Llaves de Vaso 38 Piezas'          WHERE id = '43507b04-a8b3-43ff-a41d-120582fa71d2';
UPDATE productos SET nombre = 'Lavabo Suspendido 60cm Blanco'              WHERE id = 'b509b364-b212-475c-84d0-acaeb7dbb8f2';
UPDATE productos SET nombre = 'Lijadora Orbital 18V'                       WHERE id = '94c64804-66e8-4059-9f26-afd635a8d204';
UPDATE productos SET nombre = 'Llave Inglesa Ajustable 12"'                WHERE id = '9e5fd393-fffd-4691-8e84-ae7e11155843';
UPDATE productos SET nombre = 'Martillo Demoledor SDS-Max 1750W'           WHERE id = 'a42f1378-1d6f-4aa6-9137-fa7304d79741';
UPDATE productos SET nombre = 'Metro Láser 50m'                            WHERE id = '76aa8506-5d54-415c-b84c-e4ea68996896';
UPDATE productos SET nombre = 'Nivel Láser Autonivelante 3 Líneas'         WHERE id = '4290b6ce-9d05-40b6-a8dc-c04f2a508933';
UPDATE productos SET nombre = 'Programador de Riego WiFi 12 Estaciones'    WHERE id = 'fc5dd450-8abd-4c46-8595-2416a5a0c1a5';
UPDATE productos SET nombre = 'Programador de Riego 4 Estaciones'          WHERE id = '6825ba74-90ef-4106-abcf-00ac87623a85';
UPDATE productos SET nombre = 'Sierra Circular 18V 57mm'                   WHERE id = '91c85b2e-ad72-4c0d-a1fe-c55d57cdab1f';
UPDATE productos SET nombre = 'Taladro Atornillador 18V'                   WHERE id = '9f81878c-4428-4714-bedd-4858ecaf00b9';
UPDATE productos SET nombre = 'Termo Eléctrico 80L'                        WHERE id = '891664af-1e4c-4446-b881-f7526b6ccb47';
UPDATE productos SET nombre = 'Termostato Programable Semanal'             WHERE id = '35c506bc-381b-4150-9cdc-1d50081c2e2a';

-- Productos con un fabricante incoherente con su categoría
UPDATE productos SET fabricante_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13' WHERE id = '6c48dd0a-012d-4a86-9703-f9e44f4526a3'; -- bomba (era de sanitarios)
UPDATE productos SET fabricante_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10' WHERE id IN (
  '27ea35c7-3e70-4f4b-bcf0-274843406215',  -- caladora
  '94c64804-66e8-4059-9f26-afd635a8d204',  -- lijadora
  'ca2588d3-5f2d-441c-960d-dcdcf330dc3a',  -- soldadora
  '91f87c74-78cd-451c-9129-b72a3a0d7e1a'   -- taladro creado desde la demo (era de riego)
);
UPDATE productos SET fabricante_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17' WHERE id = '5d0318fe-1546-46a7-b685-803db9f05844'; -- tubo PVC (era de herramienta)
UPDATE productos SET fabricante_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19' WHERE id IN (
  'e18f1fe8-1aaf-4873-8f76-f36644d8e65a',  -- bidón ADR
  '5207a595-97a8-42b9-b561-978fc5b1d039',  -- contenedor GRG
  '04d6ec8c-e2fa-4e99-bc9b-8b050ae578f2'   -- depósito industrial
);
UPDATE productos SET fabricante_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13' WHERE id = '50f41369-d4ce-4cae-ac5f-77861bb28463'; -- depósito de membrana para grupos de presión
