# 🚀 DistribuTech Pro — Plataforma B2B de Distribución Multisectorial

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue?logo=react" alt="React Badge">
  <img src="https://img.shields.io/badge/Backend-Node.js/Express-green?logo=node.js" alt="Node.js Badge">
  <img src="https://img.shields.io/badge/Database-PostgreSQL/Supabase-336791?logo=postgresql" alt="PostgreSQL Badge">
  <img src="https://img.shields.io/badge/Licencia-MIT-yellow" alt="License Badge">
  <img src="https://img.shields.io/badge/Estado-Producción-brightgreen" alt="Status Badge">
</p>

> 🏭 **DistribuTech Pro** es el Proyecto Final del Ciclo Superior en Desarrollo de Aplicaciones Web (DAW).  
> Una plataforma digital B2B que moderniza y unifica la gestión comercial multisectorial para empresas distribuidoras de ferretería, fontanería, riego, baño y suministros industriales.

---

## 🌍 Descripción General

DistribuTech Pro digitaliza los procesos comerciales de una empresa con 40 años de experiencia en distribución multisectorial, ofreciendo:

- **Frontend:** Interfaz moderna desarrollada con **React + Vite**, responsive y accesible.
- **Backend:** API REST robusta con **Node.js + Express**.
- **Base de Datos:** **PostgreSQL** en **Supabase** con modelo relacional optimizado.
- **Autenticación:** Sistema seguro por roles (Administrador, Comercial, Cliente) mediante **JWT**.
- **Funcionalidades Clave:** Catálogo técnico multisectorial, cotizaciones, pedidos, gestión comercial y documentación automática en PDF.

---

## 📂 Estructura del Proyecto

```
distributech-pro/
├── docs/ # Documentación completa
│ ├── manual_usuario.pdf
│ ├── manual_tecnico.pdf
│ ├── manual_despliegue.pdf
│ └── manual_proyecto.pdf
├── backend/ # API Node.js + Express
│ ├── src/
│ ├── package.json
│ └── .env.example
├── frontend/ # Aplicación React + Vite
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── .env.example
├── database/ # Scripts SQL y diagramas
│ ├── schema.sql
│ ├── data.sql
│ └── ER_diagram.drawio
├── README.md
└── .gitignore
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso en el Proyecto |
|------------|-------------------|
| **React 18 + Vite** | Frontend dinámico y componentes reutilizables |
| **React Router DOM** | Navegación SPA sin recargas |
| **Axios** | Peticiones HTTP a la API |
| **Context API** | Gestión de estado global (autenticación, carrito) |
| **CSS Modules** | Estilos modulares y encapsulados |
| **Node.js + Express** | Backend y API REST |
| **PostgreSQL + Supabase** | Base de datos y autenticación |
| **JWT** | Autenticación segura por roles |
| **Vercel / Render** | Plataformas de despliegue |

---

## 👥 Roles de Usuario

| Rol | Permisos y Funcionalidades |
|-----|----------------------------|
| **Cliente** | Ver catálogo, solicitar cotizaciones, realizar pedidos, gestionar perfil |
| **Comercial** | Gestionar clientes asignados, crear cotizaciones, seguir oportunidades |
| **Administrador** | CRUD completo de productos, categorías, usuarios y configuración global |

---

## ✅ Características Implementadas

- [x] Catálogo multisectorial con filtros por sector, categoría y búsqueda.
- [x] Ficha de producto con especificaciones técnicas en JSON.
- [x] Sistema de cotizaciones con validez temporal y PDF.
- [x] Conversión de cotización a pedido con actualización de stock.
- [x] Pedidos directos con historial y seguimiento de estado.
- [x] Gestión de relaciones cliente-comercial.
- [x] Paneles de administración y comercial con métricas.
- [x] Soft delete para preservar datos históricos.

---

## 🚀 Despliegue

- **Frontend en Vercel:** [https://distributech-pro.vercel.app](https://distributech-pro.vercel.app) (ejemplo)
- **Backend en Render:** [https://distributech-pro-backend.onrender.com](https://distributech-pro-backend.onrender.com) (ejemplo)
- **Base de datos:** Supabase (configuración en `database/schema.sql`)

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver archivo `LICENSE`.

---

## 👨‍💻 Autoría

- **Roberto Borrallo Álvarez**
- Ciclo Superior en Desarrollo de Aplicaciones Web (DAW)
- **IES Albarregas – Mérida (España)**
- 📘 **Proyecto TFG:** DistribuTech Pro (2025/2026)

---

## 📞 Contacto

- 📧 Email: robertobamym2@gmail.com
- 💼 LinkedIn: [linkedin.com/in/roberto-borrallo](https://linkedin.com)
- 🐙 GitHub: [github.com/roberto-borrallo](https://github.com)
