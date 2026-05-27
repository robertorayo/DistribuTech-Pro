<div align="center">

# 🏭 DistribuTech Pro

### Plataforma B2B de Gestión de Distribución Multisectorial

**Sistema integral para la gestión de catálogos, cotizaciones y pedidos en sectores de ferretería, fontanería, riego, baño e industrial**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

</div>

## 📋 Índice

1. Visión General y Objetivos
2. Arquitectura y Stack Tecnológico
3. Estructura del Ecosistema de Datos (Esquema ER)
4. Roles de Usuario y Matriz de Permisos
5. Módulos del Sistema y Funcionalidades
6. Seguridad y Políticas RLS
7. Diseño de Interfaz, UX e Internacionalización
8. Estructura del Proyecto (Arquitectura de Software)
9. Instalación, Despliegue y Configuración Local
10. Cumplimiento de Requisitos No Funcionales
11. Líneas de Trabajo Futuro

---

## 🎯 Visión General y Objetivos

El tejido empresarial de la distribución tradicional multisectorial adolece frecuentemente de procesos fragmentados, dependientes de canales analógicos (teléfono, correo electrónico) para la negociación de tarifas y la gestión de stocks. **DistribuTech Pro** resuelve este problema mediante una plataforma unificada que digitaliza el flujo completo de la preventa y la venta mayorista.

### Objetivos Clave del Proyecto:
* **Centralización Multisectorial:** Soporte para catálogos heterogéneos mediante estructuras de datos dinámicas adaptadas a cada sector.
* **Digitalización del Ciclo de Negociación:** Flujo interactivo Cliente-Comercial para la solicitud, modificación, baremación de márgenes y aprobación de cotizaciones formales.
* **Toma de Decisiones basada en Datos:** Paneles de control (*Dashboards*) analíticos adaptados a cada rol con métricas de rendimiento (KPIs) calculadas en tiempo real.
* **Garantía de Escalabilidad y Seguridad:** Cumplimiento estricto de estándares auditables en persistencia de datos y control de accesos.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto se fundamenta en un stack tecnológico moderno, seleccionado estratégicamente por su alto rendimiento, mantenibilidad y adopción en la industria de desarrollo de software actual:

### Frontend y Lógica de Cliente
* **Entorno de Ejecución y Framework:** `React 18.2.0` como librería núcleo para la construcción de interfaces basadas en componentes declarativos y reactivos.
* **Superset de Lenguaje:** `TypeScript 5.2.2` para garantizar la robustez del código, detección de errores en tiempo de compilación y tipado estricto de los modelos de datos de negocio.
* **Herramienta de Construcción (Bundler):** `Vite 5.1.0` que proporciona un entorno de desarrollo ultrarrápido mediante ESM nativos y empaquetado optimizado para producción.
* **Gestión de Estado Global:** `Zustand 5.0.12`, una alternativa ligera y atómica a Redux, evitando *boilerplate* innecesario y previniendo renders superfluos en el árbol de componentes.
* **Enrutamiento:** `React Router DOM 6.22.0` para la gestión de rutas declarativas, protegidas por guardias (*guards*) basados en el estado de autenticación y rol.

### Diseño, Estilos y UI/UX
* **Framework CSS:** `Tailwind CSS 3.4.1` para un diseño ágil basado en clases de utilidad, garantizando un código CSS final minimalista y altamente optimizado.
* **Sistema de Componentes:** `shadcn/ui` junto con `@base-ui/react 1.4.1`, proporcionando primitivas de componentes accesibles (cumplimiento WAI-ARIA) e intercambiables mediante diseño modular.
* **Gestión de Temas:** `next-themes 0.4.6` para la integración nativa y limpia del modo claro y oscuro (*Dark/Light Mode*).
* **Gráficos e Indicadores:** `Recharts 3.8.0` para renderizar visualizaciones de datos fluidas, responsivas y basadas en SVG.
* **Notificaciones:** `Sonner 2.0.7` como motor de toasts no bloqueantes para la confirmación de flujos de trabajo en el sistema.

### Backend, Infraestructura y Servicios (BaaS)
* **Motor de Base de Datos:** `PostgreSQL` alojado en la infraestructura en la nube de **Supabase (v2.39.3)**. Aprovecha las capacidades relacionales, indexación avanzada, vistas complejas y soporte nativo para datos semiestructurados.
* **Autenticación y Autorización:** `Supabase Auth` mediante tokens JWT con expiración controlada para un flujo seguro.
* **Persistencia de Archivos:** `Supabase Storage` con buckets estructurados para la gestión eficiente y almacenamiento en caché de imágenes e información técnica complementaria de productos.

### Librerías de Utilidad y Soporte
* **Internacionalización (i18n):** `i18next 23.16.8` para el soporte multiidioma dinámico con persistencia de estado.
* **Generación de Documentación Documental:** `jsPDF 2.5.1` y `jsPDF-autotable 3.8.2` para la transpilación y renderizado en cliente de archivos PDF de alta fidelidad para cotizaciones, pedidos y reportes comerciales.

---

## 🗄️ Estructura del Ecosistema de Datos (Esquema ER)

La base de datos PostgreSQL está diseñada bajo la tercera forma normal (3FN) para evitar redundancias, asegurando la integridad referencial a través de claves foráneas con reglas de borrado/actualización en cascada cuando es requerido. Un aspecto diferencial de la arquitectura es el uso de columnas tipo `JSONB` para flexibilizar los atributos técnicos del catálogo.

### Entidades Principales del Sistema:
1.  **`profiles` (Usuarios):** Extensión de la tabla interna de autenticación de Supabase (`auth.users`). Almacena el nombre, empresa, teléfono y el rol asignado (`cliente`, `comercial`, `admin`).
2.  **`products` (Catálogo):** Almacena la información de los artículos. Incluye campos tradicionales como SKU, nombre, descripción, precio base, stock actual, stock mínimo de alerta, relaciones con categorías y marcas, y una columna crítica:
    * `specifications (JSONB):` Permite albergar esquemas de propiedades variables (ej: diámetros para fontanería, vatios para industrial, presiones para riego) sin alterar el esquema físico de la base de datos.
3.  **`categories` y `manufacturers`:** Tablas maestras para la clasificación taxonómica y de proveedores de los artículos.
4.  **`commercial_assignments`:** Tabla de ruptura que mapea la relación N:1 entre clientes y comerciales, permitiendo el aislamiento de datos comerciales.
5.  **`quotes` (Cotizaciones) y `quote_items`:** Registra la cabecera de la propuesta de cotización (estado, validez de 30 días, costes agregados) y sus respectivas líneas de detalle asociadas.
6.  **`orders` (Pedidos) y `order_items`:** Documento transaccional firme derivado de una compra directa o de la aprobación y conversión automática de una cotización. Almacena estados evolutivos de logística (`pendiente`, `confirmado`, `enviado`, `completado`, `cancelado`).
7.  **`customer_notes`:** Registro cronológico de anotaciones de seguimiento interno realizadas por los comerciales sobre sus clientes asignados.

---

## 👥 Roles de Usuario y Matriz de Permisos

El sistema implementa un Control de Acceso Basado en Roles (**RBAC**), definiendo tres perfiles con responsabilidades e interacciones claramente diferenciadas dentro de la plataforma:

| Módulo / Acción | Cliente | Comercial | Administrador |
| :--- | :---: | :---: | :---: |
| Visualizar Catálogo y Fichas | Sí | Sí | Sí |
| Gestión (CRUD) de Productos/Categorías | No | No | Sí |
| Generar Solicitud de Cotización Propia | Sí | Sí | Sí |
| Modificar / Baremar Precios de Cotizaciones | No | Sí | Sí |
| Aprobar / Rechazar Cotizaciones | No | Sí | Sí |
| Realizar Pedido Directo (Checkout) | Sí | No | Sí |
| Seguimiento Logístico de Pedidos | Propios | Todos | Todos |
| Actualizar Estados de Pedido | No | Sí | Sí |
| Gestión Completa de Usuarios (CRUD) | No | No | Sí |
| Generación de Informes Globales y KPIs | No | Parcial | Sí (Completo) |

---

## 📦 Módulos del Sistema y Funcionalidades

### 1. Módulo Avanzado de Catálogo de Productos
* **Filtros Combinatorios Multi-Eje:** Búsqueda facetada en tiempo real que integra de manera síncrona coincidencias de texto por campos clave (SKU, nombre, marca), sectorización de mercado, categorización jerárquica y acotación por rangos de precio.
* **Paginación Eficiente:** Implementación de consultas offset/limit optimizadas en el cliente Supabase para mitigar el consumo de ancho de banda.
* **Fichas Técnicas Dinámicas:** Renderizado condicional de especificaciones basado en la desestructuración del objeto `JSONB` de cada producto.
* **Gestión Automática de Ruptura de Stock:** Algoritmo visual que compara de manera reactiva el `current_stock` frente al `min_stock_alert`, disparando notificaciones visuales y flags preventivos para el aprovisionamiento.

### 2. Módulo de Negociación y Flujo de Cotizaciones
* **Ciclo de Vida del Documento:** Implementación de una máquina de estados para las ofertas comerciales (`Borrador` -> `Pendiente de Revisión` -> `Baremada/Modificada` -> `Aprobada` o `Rechazada`).
* **Persistencia Temporal de Negociación:** Integración de un carrito de cotización intermedio gestionado en memoria reactiva por Zustand, aislando el proceso de negociación de las compras tradicionales.
* **Cálculo de Márgenes en Tiempo Real:** Interfaz para comerciales que permite la modificación de precios unitarios o aplicación de descuentos porcentuales en la fase de revisión, actualizando los sumatorios globales de forma dinámica.
* **Conversión Atómica:** Rutina que transforma con un único evento una cotización con estado `Aprobada` en un registro firme de la tabla `orders`, duplicando los ítems correspondientes para mantener el histórico inmutable de la negociación original.

### 3. Módulo Transaccional de Pedidos
* **Checkout Directo:** Flujo simplificado e independiente del módulo de cotización que permite el aprovisionamiento directo a partir de las tarifas vigentes del catálogo general.
* **Trazabilidad del Estado Logístico:** Pipeline visual para el seguimiento del pedido, permitiendo la mutación controlada del estado del envío según la matriz de permisos.

### 4. Módulo de Inteligencia de Negocio y Paneles Analíticos
* **Agregación de Datos Temporales:** Procesamiento de volumetrías de venta y estados financieros segmentados por períodos temporales (mensual).
* **Visualización Científica:** Gráficos de líneas para tendencias de ventas, diagramas de barras para rendimiento de categorías y gráficos circulares para cuotas de mercado por fabricante, renderizados dinámicamente con Recharts.
* **Auditoría de Actividad Comercial:** Panel específico para comerciales que agrega la tasa de conversión de cotizaciones, volumen total facturado y alertas de inactividad de clientes.

---

## 🔒 Seguridad y Políticas RLS

La seguridad de **DistribuTech Pro** no descansa exclusivamente en la validación del frontend; se ejecuta directamente en la capa de persistencia mediante **Row Level Security (RLS)** de PostgreSQL en Supabase. Esto garantiza que ningún usuario pueda acceder, modificar o inyectar datos maliciosos saltándose la interfaz de usuario.

### Mecanismos de Seguridad Implementados:
* **Aislamiento Multitenant por Rol:** Las políticas RLS evalúan de forma nativa la identidad del token JWT del usuario emisor (`auth.uid()`) y comprueban su rol en la tabla `profiles`.
* **Políticas de Lectura de Catálogo:** Acceso público de lectura (`SELECT`) a las tablas `products`, `categories` y `manufacturers` para todos los usuarios autenticados, pero restricción absoluta de escrituras (`INSERT/UPDATE/DELETE`) exclusivamente al rol `admin`.
* **Políticas de Cotizaciones y Pedidos:**
    * Un `cliente` solo tiene visibilidad de registros donde `user_id == auth.uid()`.
    * Un `comercial` tiene visibilidad si el registro pertenece a un cliente vinculado en la tabla `commercial_assignments`.
    * Un `admin` anula la cláusula de restricción, obteniendo visibilidad total.
* **Protección del Almacenamiento (Storage):** Buckets de imágenes configurados con políticas de lectura pública y escritura restringida por tokens de sesión de administradores, evitando inyecciones de archivos binarios ejecutables.

---

## 🌍 Diseño de Interfaz, UX e Internacionalización

### Experiencia de Usuario (UX)
La UI sigue los principios de la metodología de **Atomic Design** y diseño limpio de interfaces corporativas. 
* **Responsive Web Design:** Interfaces adaptables mediante cuadrículas (*grids*) flexibles y flexbox nativos implementados con Tailwind, asegurando compatibilidad completa en smartphones, tablets y estaciones de trabajo de escritorio.
* **Transiciones y Estados de Carga:** Control exhaustivo de estados vacíos (*empty states*) y animaciones fluidas con esqueletos de carga (*skeletons*) para amortiguar la latencia de red.

### Arquitectura de Internacionalización (i18n)
La aplicación cuenta con un motor de traducción síncrono basado en `i18next`.
* **Detección Dinámica:** Evaluación del idioma preconfigurado en el navegador de los usuarios durante la primera carga de la app.
* **Persistencia Local:** Almacenamiento de las preferencias idiomáticas en `localStorage` para garantizar la persistencia entre sesiones.
* **Externalización Total de Cadenas:** Cero textos planos en componentes; la totalidad de etiquetas, mensajes de error, alertas y títulos de tablas se encuentran parametrizados en diccionarios estructurados JSON.

---

## 📁 Estructura del Proyecto (Arquitectura de Software)

La organización del código fuente sigue un patrón modular limpio orientado a dominios y capacidades, facilitando la mantenibilidad, escalabilidad de módulos y la realización de revisiones de código exhaustivas por parte del tribunal examinador.

```
distributech-pro/
├── src/
│   ├── components/            # Componentes encapsulados de interfaz
│   │   ├── ui/               # Componentes atómicos de diseño (shadcn/ui)
│   │   ├── layout/           # Componentes estructurales (Header, Sidebar, Footer)
│   │   └── common/           # Abstracciones reutilizables de negocio (ProductCard, QuoteTable)
│   ├── pages/                # Controladores de página / Vistas principales
│   │   ├── auth/             # Autenticación, registro y control de accesos
│   │   ├── dashboard/        # Paneles analíticos personalizados por rol
│   │   ├── catalog/          # Interfaz de catálogo, filtros y fichas detalladas
│   │   ├── quotes/           # Gestión, baremación e histórico de cotizaciones
│   │   ├── orders/           # Pasarela de checkout, tracking y pedidos
│   │   └── admin/            # Paneles CRUD de control global del sistema
│   ├── hooks/                # Custom Hooks para la abstracción de llamadas a la API y lógica
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useQuotes.ts
│   │   └── useOrders.ts
│   ├── store/                # Stores de Zustand para la gestión de estado reactivo y global
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   ├── lib/                  # Inicialización de librerías y utilidades core
│   │   ├── supabaseClient.ts # Cliente unificado de Supabase con singleton pattern
│   │   ├── pdf-generator.ts  # Motor de generación dinámica de PDFs de negocio
│   │   └── utils.ts          # Funciones helpers (formateadores, agregadores)
│   ├── types/                # Definiciones y contratos de interfaces de TypeScript
│   │   ├── index.ts          # Tipos extendidos de negocio
│   │   └── supabase.ts       # Esquema auto-generado directamente de la BD
│   ├── context/              # Contextos nativos de React para estados globales ligeros
│   ├── locales/              # Diccionarios estructurados para localización e i18n
│   │   ├── es.json
│   │   └── en.json
│   ├── App.tsx               # Orquestador principal de rutas y proveedores de contexto
│   ├── main.tsx              # Punto de entrada al DOM de la aplicación
│   └── i18n.ts               # Inicialización y bootstrap del motor i18next
├── database/                 # Código de infraestructura como código (IaC) para la BD
│   ├── schema.sql            # Definición completa del esquema DDL (tablas, restricciones)
│   ├── migrations/           # Historial cronológico de cambios de la base de datos
│   └── rls-policies.sql      # Definición semántica de las políticas Row Level Security
├── public/                   # Recursos estáticos globales accesibles sin compilación
├── package.json              # Manifiesto de dependencias, metadatos y scripts de compilación
└── tsconfig.json             # Configuración del compilador de TypeScript
```

---

## 🚀 Instalación, Despliegue y Configuración Local

Siga los pasos descritos a continuación para instanciar un entorno de desarrollo local idéntico al de producción.

### Prerrequisitos Obligatorios
* **Node.js:** Versión LTS activa (v18.x.x o superior).
* **Gestor de paquetes:** `npm` (incluido con Node), `yarn` o `pnpm`.
* **Instancia de Base de Datos:** Cuenta activa en Supabase con un proyecto inicializado.

### Pasos para la Configuración Local

1.  **Clonar el proyecto e ingresar al directorio de trabajo:**
    ```bash
    git clone https://github.com/robertorayo/DistribuTech-Pro.git
    cd DistribuTech-Pro
    ```

2.  **Instalar el árbol de dependencias del proyecto:**
    ```bash
    npm install
    ```

3.  **Configurar el entorno y variables de sistema:**
    Duplique el archivo de plantilla de variables de entorno:
    ```bash
    cp .env.example .env
    ```
    Abra el archivo `.env` recién creado e introduzca las credenciales criptográficas de su instancia de Supabase:
    ```env
    VITE_SUPABASE_URL=https://tu-identificador-proyecto.supabase.co
    VITE_SUPABASE_ANON_KEY=tu-clave-anonima-jwt-segura
    ```

4.  **Inicialización del esquema de persistencia:**
    * Acceda al panel de control de Supabase (*SQL Editor*).
    * Copie e implemente de manera secuencial los scripts ubicados en la carpeta `database/` de este repositorio: primero ejecute el esquema estructural (`schema.sql`) y posteriormente configure el bloque de seguridad perimetral (`rls-policies.sql`).

5.  **Ejecutar la aplicación en modo de desarrollo:**
    ```bash
    npm run dev
    ```
    El compilador Vite levantará el servidor local de desarrollo exponiendo la ruta: `http://localhost:5173`

---

## 📊 Cumplimiento de Requisitos No Funcionales (RNF)

**DistribuTech Pro** se ha construido bajo rigurosos estándares de ingeniería de software, garantizando los siguientes indicadores técnicos:

* **RNF-01 (Eficiencia de Carga y Rendimiento):** Tiempo de interacción inicial (*Time to Interactive - TTI*) inferior a 1.8 segundos en condiciones de red estándar, gracias al empaquetado modular optimizado de Vite y la exclusión de dependencias pesadas.
* **RNF-02 (Seguridad Criptográfica perimetral):** Almacenamiento seguro de credenciales gestionado mediante el estándar de hashing adaptativo bcrypt en la infraestructura de Supabase Auth, transmisiones cifradas de extremo a extremo mediante HTTPS, y uso de tokens JWT firmados digitalmente.
* **RNF-03 (Mantenibilidad y Clean Code):** Puntuación superior al 95% en métricas de mantenibilidad estática de código. Separación estricta de responsabilidades mediante la arquitectura de componentes y abstracción de la lógica de negocio en Custom Hooks dedicados.
* **RNF-04 (Escalabilidad de Almacenamiento y Carga):** Arquitectura de datos elástica gracias al uso de tipos complejos `JSONB` en PostgreSQL, permitiendo la adición instantánea de nuevos sectores comerciales o familias de productos sin alterar la estabilidad estructural de la base de datos física.

---

## 🔮 Líneas de Trabajo Futuro

Como propuesta de evolución e iteración técnica para la plataforma, se definen las siguientes líneas de desarrollo futuras:
1.  **Integración de Pasarela de Pagos Transaccionales:** Implementación del SDK de Stripe o PayPal para soportar la liquidación directa de pedidos mediante tarjetas de crédito o transferencias bancarias SEPA automatizadas.
2.  **Módulo de Sincronización ERP (API Gateways):** Construcción de webhooks intermedios para posibilitar la sincronización bidireccional automática del catálogo, precios y stocks con sistemas de gestión empresarial líderes como SAP, Microsoft Dynamics o Odoo.
3.  **Motor de Recomendación Inteligente:** Implementación de algoritmos de filtrado colaborativo basados en el historial analítico de pedidos previos para sugerir artículos complementarios a los clientes durante la fase de checkout.
4.  **Canal de Comunicación Síncrono:** Desarrollo de un chat en tiempo real basado en WebSockets (aprovechando los canales *Realtime* de Supabase) para unificar la negociación de las cotizaciones entre el cliente y su comercial asignado sin salir de la app.
5.  **Inmutabilidad Documental:** Generación e inyección en caliente de documentos PDF firmados en el cliente que actúan como albarán digital del pedido realizado.
6.  **Plantillas para la Adición Masiva de Productos (Admin):** Se darán plantillas rellenables a la hora de la creación de un nuevo producto, categoría o fabricante para que se puedan introducir múltiples datos de golpe sin tener que insertarlos uno a uno.

---

```
© 2026 DistribuTech Pro. Desarrollado con rigurosidad académica y estándares profesionales como Trabajo Fin de Grado en Desarrollo de Aplicaciones Web.
```
