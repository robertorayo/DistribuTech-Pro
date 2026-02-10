# 🚀 DistribuTech Pro — Plataforma B2B de Distribución Multisectorial

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-HTML5/CSS3/JavaScript-blue?logo=javascript" alt="JavaScript Badge">
  <img src="https://img.shields.io/badge/Backend-Node.js/Express-green?logo=node.js" alt="Node.js Badge">
  <img src="https://img.shields.io/badge/Database-PostgreSQL/Supabase-336791?logo=postgresql" alt="PostgreSQL Badge">
  <img src="https://img.shields.io/badge/Licencia-MIT-yellow" alt="License Badge">
  <img src="https://img.shields.io/badge/Estado-En%20Desarrollo-orange" alt="Status Badge">
</p>

> 🏭 **DistribuTech Pro** es el Proyecto Final del Ciclo Superior en Desarrollo de Aplicaciones Web (DAW).  
> Una plataforma digital B2B que moderniza y unifica la gestión comercial multisectorial para empresas distribuidoras de ferretería, fontanería, riego, baño y suministros industriales.

---

## 🌍 Descripción General

DistribuTech Pro digitaliza los procesos comerciales de una empresa con 40 años de experiencia en distribución multisectorial, ofreciendo:

- 🔹 **Frontend:** Interfaz moderna, responsive y accesible con HTML5, CSS3 y JavaScript
- 🔹 **Backend:** API REST robusta con Node.js y Express
- 🔹 **Base de Datos:** PostgreSQL en Supabase con modelo relacional optimizado
- 🔹 **Autenticación:** Sistema seguro por roles (Administrador, Comercial, Cliente)
- 🔹 **Funcionalidades Clave:** Catálogo técnico multisectorial, cotizaciones, pedidos, gestión comercial y documentación automática

---

## 🏗️ Estructura del Proyecto

distributech-pro/
  docs/                 # Documentación del proyecto
    Modelo_E_R.pdf
    Manual_Técnico.md
    Manual_Usuario.md
  frontend/             # Interfaz de usuario
    assets/           # Imágenes, iconos, estilos
    views/            # Vistas (landing, catálogo, panel admin...)
    scripts/          # Lógica de frontend
    index.html        # Punto de entrada
  backend/              # Servidor y API
    src/
      controllers/  # Controladores de lógica
      models/       # Modelos de datos
      routes/       # Rutas API
      middleware/   # Autenticación, validación
      utils/        # Utilidades
    package.json
    server.js
  database/             # Scripts SQL y modelo de datos
    schema.sql        # Estructura completa
    data.sql          # Datos de ejemplo
    ER_diagram.drawio # Diagrama Entidad-Relación
  .env.example          # Variables de entorno
  .gitignore
  README.md
  package.json

---

## ⚙️ Instalación y Ejecución Local

### 1️⃣ Clonar el repositorio

git clone https://github.com/tu-usuario/distributech-pro.git
cd distributech-pro

### 2️⃣ Configurar entorno Backend

cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales de Supabase

### 3️⃣ Configurar Base de Datos

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar database/schema.sql en el SQL Editor
3. Configurar variables en .env:
   SUPABASE_URL=tu_url
   SUPABASE_KEY=tu_clave
   JWT_SECRET=tu_secreto

### 4️⃣ Ejecutar servidor de desarrollo

npm run dev

El backend estará disponible en: http://localhost:3000

### 5️⃣ Ejecutar Frontend

Abrir frontend/index.html en un servidor local (Live Server, XAMPP, etc.)

---

## 🗄️ Base de Datos (PostgreSQL/Supabase)

### Tablas Principales:

| Tabla | Descripción |
|-------|-------------|
| usuarios | Gestión unificada de usuarios con roles diferenciados |
| productos | Catálogo multisectorial con especificaciones técnicas (JSONB) |
| categorias | Estructura jerárquica para organización multisectorial |
| fabricantes | Proveedores y marcas representadas |
| cotizaciones | Presupuestos y propuestas comerciales |
| pedidos | Órdenes de compra con trazabilidad completa |
| contactos_comercial | Relaciones cliente-comercial |

### Políticas RLS (Row Level Security):
- Cada usuario solo accede a sus datos personales y transacciones
- Los comerciales ven únicamente sus clientes asignados
- Los administradores tienen acceso completo

---

## 👥 Roles de Usuario

| Rol | Permisos y Funcionalidades |
|-----|----------------------------|
| Cliente | Ver catálogo, solicitar cotizaciones, realizar pedidos, gestionar su perfil |
| Comercial | Gestionar clientes asignados, crear cotizaciones, seguir oportunidades, dashboard comercial |
| Administrador | CRUD completo de productos, categorías, usuarios y configuración del sistema |

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso en el Proyecto |
|------------|-------------------|
| HTML5 / CSS3 / JavaScript | Frontend responsive y accesible |
| Node.js + Express | Backend y API REST |
| PostgreSQL + Supabase | Base de datos y autenticación |
| JWT (JSON Web Tokens) | Autenticación segura por roles |
| Draw.io | Diagramas Entidad-Relación |
| Git + GitHub | Control de versiones y colaboración |

---

## ✅ Características Implementadas

### Módulo Catálogo Multisectorial
- ✅ Navegación por sectores (ferretería, fontanería, riego, baño, industrial)
- ✅ Filtros avanzados por características técnicas
- ✅ Especificaciones técnicas en formato JSON flexible
- ✅ Gestión jerárquica de categorías y subcategorías

### Módulo Comercial
- ✅ Sistema de cotizaciones con validez temporal
- ✅ Conversión de cotizaciones a pedidos
- ✅ Gestión de relaciones cliente-comercial
- ✅ Generación automática de documentos PDF

### Módulo Administración
- ✅ CRUD completo de productos, categorías y usuarios
- ✅ Dashboard con métricas comerciales
- ✅ Gestión de roles y permisos
- ✅ Soft delete para preservar datos históricos

---

## 📊 Modelo Entidad-Relación

USUARIOS (1) ───< COTIZACIONES (N) ───< DETALLE_COTIZACION (N)
      │                                       ↑
      │                                       │
      └──< PEDIDOS (N) ───< DETALLE_PEDIDO (N)
                               ↑
                               │
                         PRODUCTOS (1) ───< DETALLE_PEDIDO (N)
                               ↙ ↘
                   CATEGORIAS (1)  FABRICANTES (1)
                         ↑
                  CATEGORIAS (auto-relación jerárquica)

[Ver diagrama completo en Draw.io](database/ER_diagram.drawio)

---

## 👨‍🏫 Seguimiento de Tutorías

### Resumen de Sesiones con el Tutor

| Semana | Fecha | Temas Tratados |
|--------|-------|----------------|
| 1 | 07/10/2025 | Presentación del proyecto, definición de alcance y objetivos |
| 2 | 14/10/2025 | Justificación del proyecto y diferenciación de tiendas online tradicionales |
| 3 | 21/10/2025 | Diseño del Modelo Entidad-Relación y justificación de entidades |
| 4 | 28/10/2025 | Definición de tecnologías: Node.js, PostgreSQL, Supabase |
| 5 | 04/11/2025 | Arquitectura del sistema y planificación temporal |
| 6 | 11/11/2025 | Desarrollo del backend: API REST y autenticación JWT |
| 7 | 18/11/2025 | Implementación del frontend: catálogo y gestión comercial |
| 8 | 25/11/2025 | Integración de módulos y pruebas de funcionalidad |
| 9 | 02/12/2025 | Documentación final y preparación para la defensa |

### Metodología de Trabajo:
- Reuniones semanales de seguimiento
- Revisiones incrementales del código
- Validación continua del modelo de datos
- Ajustes basados en feedback del tutor

---

## 🧑‍💻 Autoría

- **Roberto Borrallo Álvarez**
- Ciclo Superior en Desarrollo de Aplicaciones Web (DAW)
- **IES Albarregas – Mérida (España)**
- 📘 **Proyecto TFG:** DistribuTech Pro – Plataforma B2B de Distribución Multisectorial (2025)

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver el archivo LICENSE para más detalles.

---

## 📞 Contacto

- 📧 Email: [tu-email@ejemplo.com]
- 💼 LinkedIn: [tu-perfil-linkedin]
- 🐙 GitHub: [tu-usuario-github]

---

✨ Un proyecto que va más allá del código: una solución real para un negocio real.
