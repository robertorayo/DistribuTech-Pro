# DistribuTech Pro

Plataforma B2B de cotizaciones para un distribuidor de material técnico (ferretería, fontanería, riego, baño e industrial). Los clientes arman un carrito y lo envían como cotización, los comerciales la revisan y la aprueban comprobando el stock, y el administrador gestiona el catálogo y ve el estado del negocio.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

**Demo:** <https://distributech-pro.vercel.app>

## Probar la demo

Es un entorno público con cuentas de prueba. Cada enlace abre el acceso con los datos ya escritos; solo hay que pulsar «Iniciar sesión».

| Rol | Entrar | Correo | Contraseña |
| --- | --- | --- | --- |
| Cliente | [abrir](https://distributech-pro.vercel.app/login?demo=cliente) | `cliente@distributechpro.com` | `Cliente1324!` |
| Comercial | [abrir](https://distributech-pro.vercel.app/login?demo=comercial) | `comercial1@distributechpro.com` | `Comercial1234!` |
| Administrador | [abrir](https://distributech-pro.vercel.app/login?demo=admin) | `admin@distributechpro.com` | `Admin1234!` |

Los datos los comparte cualquiera que use la demo, así que pueden haber cambiado.

## Qué hace

- **Catálogo:** búsqueda por texto, filtros por categoría y fabricante, ordenación, paginación y ficha de producto con especificaciones técnicas en `JSONB`.
- **Carrito y cotización:** el carrito se guarda en el navegador (Zustand con persistencia) y limita las cantidades al stock disponible. Al enviarlo se crea una cotización.
- **Revisión comercial:** panel con la cartera de clientes y las cotizaciones entrantes, con filtros, búsqueda y detalle. El comercial aprueba o rechaza.
- **Control de stock al aprobar:** la aprobación se hace en la base de datos y comprueba el stock de forma atómica. Si falta stock, el cliente puede dividir la cotización (una parte aprobada y otra en espera), esperar a tener el pedido completo o cancelar. Cuando sube el stock de un producto, un trigger procesa automáticamente las cotizaciones en espera por orden de llegada.
- **Administración:** CRUD de productos, categorías y fabricantes (con desactivación en lugar de borrado) y panel con gráficas de ingresos y reparto de cotizaciones por estado, filtrable por mes y año.
- **Cuenta:** registro, recuperación de contraseña, perfil, modo claro y oscuro, interfaz en español e inglés y sesión única por usuario.

## Roles

| Zona | Cliente | Comercial | Administrador |
| --- | :---: | :---: | :---: |
| Catálogo, carrito y perfil | Sí | Sí | Sí |
| Mis cotizaciones y pedidos | Sí | No | No |
| Panel comercial y revisión de cotizaciones | No | Sí | Sí |
| Gestión de productos, categorías y fabricantes | No | Sí | Sí |
| Panel de administración con métricas | No | No | Sí |

El acceso a cada ruta se controla en el cliente con `PrivateRoute`, y los datos, en la base de datos con RLS.

## Stack

- **Frontend:** React 18, TypeScript, Vite, React Router 6, Tailwind CSS, componentes de shadcn/ui y Base UI, Zustand, Recharts, Sonner y i18next.
- **Backend:** Supabase, es decir, PostgreSQL con Row Level Security, funciones RPC y triggers, más Supabase Auth. No hay servidor propio.
- **Despliegue:** Vercel, con una regla de reescritura para la SPA (`vercel.json`).

## Base de datos

El esquema completo está en [`database/schema.sql`](database/schema.sql): 14 tablas, 18 políticas RLS, funciones, triggers e índices, incluido uno de búsqueda de texto completo en español sobre los productos. Los datos de ejemplo (categorías, fabricantes y productos) están en [`database/data.sql`](database/data.sql).

Tablas principales: `usuarios` (extiende `auth.users` con rol, empresa y datos de contacto), `empresas`, `categorias`, `fabricantes`, `productos` (con `especificaciones_tecnicas JSONB`), `cotizaciones` con `detalle_cotizacion`, y `pedidos` con `detalle_pedido`, `pedido_historial_estados` y `facturas`.

## Seguridad

Los permisos se aplican en PostgreSQL, no solo en la interfaz: aunque alguien se salte la aplicación y consulte la API directamente, cada rol solo ve lo suyo.

```sql
-- el cliente solo ve sus cotizaciones; el personal (admin/comercial) ve todas
CREATE POLICY "user_leer_cot" ON cotizaciones FOR SELECT USING (
  usuario_id = auth.uid() OR get_my_rol() IN ('admin', 'comercial')
);
```

- `get_my_rol()` lee el rol real desde la tabla `usuarios`, no desde datos que el cliente pueda manipular.
- La aprobación, la división y la espera de cotizaciones son funciones `SECURITY DEFINER` que comprueban el rol antes de actuar.
- Un trigger (`handle_new_user`) crea la fila de `usuarios` al registrarse alguien en Supabase Auth.
- `registrar_actividad_sesion()` impone una sola sesión activa por usuario; las cuentas de la demo pública están exentas.
- La clave que usa el navegador es la `anon`; la protección real está en las políticas RLS.

## Estructura

```
src/
├── components/   Layout, rutas protegidas y componentes compartidos (tabla, filtros, paginación…)
│   ├── shared/
│   └── ui/       primitivas de shadcn/ui
├── context/      sesión (AuthContext) y tema
├── lib/          cliente de Supabase, formateadores y utilidades
├── pages/        una pantalla por ruta (catálogo, checkout, paneles, CRUD, login…)
├── store/        carrito (Zustand)
├── types/        tipos del modelo de datos
└── i18n.ts       traducciones en español e inglés
database/         schema.sql y data.sql
docs/             manuales de usuario, técnico y de despliegue (PDF)
```

## Puesta en marcha

Requisitos: Node.js 18 o superior y un proyecto de Supabase.

```bash
git clone https://github.com/robertorayo/DistribuTech-Pro.git
cd DistribuTech-Pro
npm install
cp .env.example .env     # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

1. En el *SQL Editor* de Supabase ejecuta `database/schema.sql` y después `database/data.sql`.
2. Crea los usuarios en *Authentication → Users*. El trigger genera su fila en `usuarios` con rol `cliente`; para dar otro rol:
   ```sql
   update usuarios set rol = 'admin' where email = 'tu@correo.com';
   ```
3. Arranca la aplicación:
   ```bash
   npm run dev
   ```
   Se abre en `http://localhost:5173`. Para generar la versión de producción: `npm run build`.

## Licencia y autoría

Desarrollado por Roberto Borrallo Álvarez. Presentado originalmente como proyecto final del ciclo superior de Desarrollo de Aplicaciones Web.
