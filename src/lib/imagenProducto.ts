/* ==== Imagen de producto ====
 * Las fotos de catálogo de marcas reales tienen derechos, así que la demo usa ilustraciones
 * propias (SVG en public/productos/). Se elige por el tipo de producto que indica el nombre;
 * si no se reconoce, por la categoría y, en último caso, una genérica. Así también tienen
 * imagen los productos que cree el administrador.
 */

type ProductoParaImagen = {
  nombre: string;
  categorias?: { nombre?: string | null; sector?: string | null } | null;
};

// El orden importa: las reglas más concretas van antes («depósito membrana» antes que «depósito»).
const REGLAS_NOMBRE: [RegExp, string][] = [
  [/membrana|vaso de expansion/, 'vaso'],
  [/grupo de presion|bomba|circuladora/, 'bomba'],
  [/multicapa|suelo radiante|\bpex\b/, 'rollo'],
  [/codo|injerto|manguito|collarin|racor|te igual/, 'racor'],
  [/tubo|tuberia/, 'tubo'],
  [/taladro|atornillador/, 'taladro'],
  [/amoladora|radial/, 'amoladora'],
  [/sierra circular|ingletadora/, 'sierra'],
  [/caladora/, 'caladora'],
  [/martillo|demoledor|percutor/, 'martillo'],
  [/laser/, 'laser'],
  [/lijadora/, 'lijadora'],
  [/compresor/, 'compresor'],
  [/soldador/, 'soldadora'],
  [/programador/, 'programador'],
  [/aspersor|difusor/, 'aspersor'],
  [/gotero/, 'gotero'],
  [/filtro/, 'filtro'],
  [/valvula|electrovalvula|colector|llave de paso/, 'valvula'],
  [/termostato/, 'termostato'],
  [/termoestatica|ducha(?! extraplano)|rociador/, 'ducha'],
  [/plato de ducha/, 'plato'],
  [/grifo|griferia|monomando/, 'grifo'],
  [/lavabo/, 'lavabo'],
  [/inodoro/, 'inodoro'],
  [/termo electrico|calentador/, 'termo'],
  [/caldera/, 'caldera'],
  [/radiador/, 'radiador'],
  [/llaves de vaso|juego de llaves|maletin/, 'vaso_llaves'],
  [/llave inglesa|llave ajustable|\bllave\b/, 'llave'],
  [/alicate/, 'alicates'],
  [/casco/, 'casco'],
  [/guante/, 'guantes'],
  [/arnes/, 'arnes'],
  [/senal/, 'senal'],
  [/grg|ibc|contenedor/, 'ibc'],
  [/bidon/, 'bidon'],
  [/estanteria/, 'estanteria'],
  [/deposito|aljibe/, 'deposito'],
];

// Respaldo por categoría, cuando el nombre no da pistas.
const REGLAS_CATEGORIA: [RegExp, string][] = [
  [/bomba/, 'bomba'],
  [/tuberia|pvc/, 'tubo'],
  [/herramienta electrica/, 'taladro'],
  [/herramienta manual/, 'llave'],
  [/riego/, 'aspersor'],
  [/valvul/, 'valvula'],
  [/griferia|sanitario|bano/, 'grifo'],
  [/calefaccion|acs/, 'radiador'],
  [/proteccion|seguridad/, 'casco'],
  [/deposito|almacenaje/, 'deposito'],
];

/** Pasa a minúsculas y quita tildes para comparar sin depender de cómo se escribió. */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Devuelve la ruta pública de la ilustración que corresponde al producto. */
export const imagenProducto = (producto: ProductoParaImagen): string => {
  const nombre = normalizar(producto.nombre);
  const porNombre = REGLAS_NOMBRE.find(([patron]) => patron.test(nombre));
  if (porNombre) return `/productos/${porNombre[1]}.svg`;

  const categoria = normalizar(
    `${producto.categorias?.nombre ?? ''} ${producto.categorias?.sector ?? ''}`
  );
  const porCategoria = REGLAS_CATEGORIA.find(([patron]) => patron.test(categoria));
  return `/productos/${porCategoria ? porCategoria[1] : 'generico'}.svg`;
};
