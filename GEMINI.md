# Tech Stack
- Frontend: React 18 + TypeScript + Vite 5
- Estilos: Tailwind CSS 3 + shadcn/ui + @base-ui/react
- Enrutamiento: React Router DOM v6
- i18n: i18next + react-i18next. Claves en `src/locales/`
- Estado global: Zustand v5
- HTTP: axios (solo para APIs externas; para Supabase usa el cliente propio)
- Tipos: `src/types/`

# Backend / Base de datos
- NO hay servidor Node.js ni Express. El backend es Supabase directamente.
- Auth: Supabase Auth. NO hay JWT manual ni bcrypt.
- DB: PostgreSQL en Supabase con RLS. Esquema completo en `database/`.
- Cliente Supabase: `src/lib/supabaseClient.ts`

# Librerías clave
- `recharts` → gráficos del dashboard
- `jspdf` + `jspdf-autotable` → exportar PDFs (cotizaciones, pedidos)
- `sonner` → toasts y notificaciones
- `next-themes` → dark/light mode

# Roles de usuario
- Cliente, Comercial, Admin
- El acceso a datos está controlado por RLS en Supabase, no por lógica frontend

# Convenciones de código
- Componentes: PascalCase (`UserProfile.tsx`)
- Hooks personalizados: prefijo `use` (`useAuth.ts`)
- Estilos: clases Tailwind exclusivamente; evitar CSS Modules
- Textos UI: en español vía i18n, claves en `locales/es.json`

# Comportamiento esperado del agente
- Asume Supabase operativo. Para el esquema consulta `database/`.
- Respuestas concisas: código primero, explicación breve al final.
- NO generes endpoints Express, middleware ni lógica de servidor: no existe esa capa.
- Si necesitas persistir datos, usa siempre el cliente Supabase.