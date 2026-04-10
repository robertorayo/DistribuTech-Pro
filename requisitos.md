# Requisitos Funcionales y No Funcionales – DistribuTech Pro

## 1. Alcance del MVP (Mínimo Producto Viable)

Para la primera versión entregable se implementarán:

- Gestión de usuarios con tres roles (cliente, comercial, administrador).
- Catálogo de productos con categorías jerárquicas y especificaciones técnicas flexibles (JSON).
- Creación de cotizaciones (presupuestos sin pago real) por parte de clientes y comerciales.
- Aprobación de cotizaciones por parte de comerciales o administradores.
- Conversión de cotización aprobada en pedido (con actualización de stock).
- Pedidos directos (sin cotización previa).
- Panel de administración básico para gestionar productos, categorías, fabricantes, usuarios y asignación de comerciales.
- Panel de comercial para ver sus clientes asignados, crear cotizaciones y hacer seguimiento.
- Historial de cotizaciones y pedidos para clientes.
- Generación de PDF de cotizaciones y pedidos.
- **Internacionalización básica** con selector de idioma (español/inglés) en la interfaz.

---

## 2. Requisitos Funcionales (RF)

### Módulo de usuarios y autenticación

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-01  | Registro de cliente              | Un visitante puede registrarse como cliente con nombre, email, contraseña, teléfono y empresa (opcional).                                   | Visitante  |
| RF-02  | Inicio de sesión                 | Cualquier usuario (cliente, comercial, admin) inicia sesión con email y contraseña; se obtiene un token JWT.                                | Todos      |
| RF-03  | Cierre de sesión                 | El usuario cierra sesión, eliminando el token del lado cliente.                                                                              | Todos      |
| RF-04  | Perfil de usuario                | El usuario puede ver y modificar sus datos personales (nombre, apellidos, teléfono, dirección, contraseña).                                 | Todos      |
| RF-05  | Roles de usuario                 | Roles: **cliente** (comprador), **comercial** (gestor de ventas), **administrador** (gestión global). Control de permisos en backend y frontend. | Admin      |
| RF-06  | Creación de usuarios (admin)     | El administrador puede crear comerciales y administradores con datos iniciales.                                                              | Admin      |
| RF-07  | Gestión de usuarios              | El administrador puede listar, editar, activar/desactivar usuarios (soft delete).                                                           | Admin      |
| RF-08  | Darse de baja                    | El cliente puede desactivar su cuenta (soft delete); se conserva el historial.                                                              | Cliente    |

### Módulo de internacionalización (nuevo)

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-46  | Selector de idioma              | Botón/selector visible en todas las páginas para cambiar entre español e inglés. El cambio persiste en localStorage y se aplica sin recargar la página. | Todos      |

### Módulo de catálogo de productos

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-09  | Visualización de catálogo       | Lista de productos activos con paginación.                                                                                                  | Cliente, Comercial, Admin |
| RF-10  | Filtros de catálogo             | Filtros por sector (ferretería, fontanería, riego, baño, industrial), categoría jerárquica, búsqueda por nombre y rango de precio.          | Cliente, Comercial, Admin |
| RF-11  | Ficha de producto               | Muestra imagen, descripción, especificaciones técnicas (JSON), precio y stock.                                                              | Todos      |
| RF-12  | Gestión de productos (CRUD)     | Administrador puede crear, editar, desactivar productos (soft delete). Campos: nombre, descripción, categoría, fabricante, precio, stock, imagen, especificaciones JSON. | Admin      |
| RF-13  | Gestión de categorías (CRUD)    | Administrador puede crear, editar, eliminar categorías jerárquicas. Cada categoría pertenece a un sector.                                   | Admin      |
| RF-14  | Gestión de fabricantes (CRUD)   | Administrador puede crear, editar, eliminar fabricantes (proveedores).                                                                      | Admin      |
| RF-15  | Stock mínimo                    | Aviso al administrador cuando el stock baja de un umbral configurable (ej. 5 unidades).                                                      | Admin      |

### Módulo de cotizaciones

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-16  | Crear cotización                | Cliente o comercial puede crear una cotización con productos y cantidades. Estado inicial "pendiente".                                      | Cliente, Comercial |
| RF-17  | Carrito de cotización           | Carrito temporal mientras se añaden productos a la cotización.                                                                              | Cliente, Comercial |
| RF-18  | Listado de cotizaciones         | Cada usuario ve sus cotizaciones; comerciales ven las de sus clientes asignados; administrador ve todas.                                    | Según rol  |
| RF-19  | Detalle de cotización           | Muestra productos, cantidades, precios, total, fecha, validez (30 días) y notas.                                                            | Según rol  |
| RF-20  | Aprobar / rechazar cotización   | Comercial o administrador cambia estado a "aprobada" o "rechazada".                                                                          | Comercial, Admin |
| RF-21  | Modificar cotización            | Mientras esté "pendiente", comercial o administrador puede modificar productos y cantidades.                                                | Comercial, Admin |
| RF-22  | Convertir cotización en pedido  | Cuando está "aprobada", cliente o comercial puede generar un pedido (actualiza stock y cambia estado de la cotización).                     | Cliente, Comercial |
| RF-23  | Exportar cotización a PDF       | Descargar PDF profesional con los datos de la cotización.                                                                                   | Según rol  |

### Módulo de pedidos

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-24  | Pedido directo                  | Cliente puede pedir directamente desde el catálogo sin cotización previa.                                                                   | Cliente    |
| RF-25  | Carrito de compra               | Carrito para pedidos directos (independiente del carrito de cotización).                                                                    | Cliente    |
| RF-26  | Flujo de checkout               | Confirmación de dirección de entrega, método de pago (simulado en MVP) y resumen antes de confirmar.                                       | Cliente    |
| RF-27  | Confirmación de pedido          | Tras confirmar, se crea el pedido, se actualiza el stock, se asigna número de pedido y se muestra resumen.                                  | Cliente    |
| RF-28  | Listado de pedidos              | Cliente ve su historial; comercial ve pedidos de sus clientes asignados; administrador ve todos.                                            | Según rol  |
| RF-29  | Detalle de pedido               | Muestra productos, cantidades, precios, total, dirección, método de pago, fecha y estado.                                                   | Según rol  |
| RF-30  | Estados de pedido               | Estados: pendiente, confirmado, enviado, completado, cancelado. Comercial/admin pueden cambiar el estado.                                   | Comercial, Admin |
| RF-31  | Cancelación de pedido           | Cliente puede cancelar si está "pendiente"; comercial/admin pueden cancelar hasta "enviado".                                                | Cliente, Comercial, Admin |
| RF-32  | Exportar pedido a PDF           | Descargar PDF con la información del pedido.                                                                                                | Según rol  |

### Módulo de gestión comercial

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-33  | Asignación de comercial a cliente | Administrador asigna un comercial a un cliente (histórico de asignaciones, una activa).                                                    | Admin      |
| RF-34  | Ver clientes asignados          | Comercial lista sus clientes con datos de contacto y resumen de actividad.                                                                  | Comercial  |
| RF-35  | Notas internas                  | Comercial puede añadir notas a un cliente (visibles solo para comerciales y admin).                                                         | Comercial, Admin |
| RF-36  | Dashboard comercial             | Panel con indicadores: número de clientes, cotizaciones pendientes, oportunidades, últimas cotizaciones.                                    | Comercial  |
| RF-37  | Crear cotización para cliente   | Comercial puede iniciar una cotización directamente desde la ficha del cliente.                                                             | Comercial  |

### Módulo de administración

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-38  | Dashboard admin                 | Métricas globales: totales de usuarios, productos, cotizaciones, pedidos; gráficos de ventas mensuales y ratio de conversión.               | Admin      |
| RF-39  | Gestión de todos los usuarios   | Listado con filtros, activar/desactivar, cambiar rol, asignar comercial.                                                                    | Admin      |
| RF-40  | Gestión completa de productos, categorías, fabricantes | CRUD completo.                                                                                                                              | Admin      |
| RF-41  | Gestión de todas las cotizaciones | Visión global, posibilidad de aprobar/rechazar/modificar cualquier cotización.                                                              | Admin      |
| RF-42  | Gestión de todos los pedidos    | Cambio de estado, cancelación, vista de detalle.                                                                                            | Admin      |
| RF-43  | Informes                        | Generación de informes PDF: ventas por período, cotizaciones por comercial, productos más vendidos.                                        | Admin      |

### Módulo de documentación y ayudas

| ID     | Nombre                          | Descripción                                                                                                                                 | Rol        |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------|
| RF-44  | Manual de usuario               | Enlace a PDF accesible desde la interfaz.                                                                                                   | Todos      |
| RF-45  | Ayuda contextual                | Tooltips o secciones de ayuda en formularios complejos.                                                                                     | Todos      |

---

## 3. Requisitos No Funcionales (RNF)

| ID     | Nombre                          | Descripción                                                                                                                                 | Métrica / Condición |
|--------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------------------|
| RNF-01 | Usabilidad                      | Interfaz intuitiva, navegación clara y responsive (adaptable a móviles y tablets).                                                          | Pruebas de usuario, media queries |
| RNF-02 | Rendimiento                     | Tiempo de carga de páginas principales < 2 segundos.                                                                                        | Lighthouse, pruebas de carga |
| RNF-03 | Seguridad                       | Contraseñas hasheadas (bcrypt). HTTPS en producción. JWT con expiración (ej. 24h). Validación de entradas para evitar SQLi y XSS.         | Auditoría, parámetros preparados |
| RNF-04 | Disponibilidad                  | En producción, 99% de uptime.                                                                                                               | Monitorización básica |
| RNF-05 | Mantenibilidad                  | Código estructurado con buenas prácticas (separación de capas, nombres claros, comentarios).                                               | Revisión de código |
| RNF-06 | Escalabilidad                   | Modelo de datos permite añadir nuevos sectores o tipos de producto sin modificar estructura.                                                | Análisis de diseño |
| RNF-07 | Integridad de datos             | Operaciones críticas (creación de pedidos) transaccionales.                                                                                 | Uso de transacciones en BD |
| RNF-08 | Documentación                   | Código documentado (comentarios de funciones y módulos importantes).                                                                        | Revisión de documentación |
| RNF-09 | Internacionalización            | Textos de la interfaz fácilmente intercambiables mediante archivos de recursos (i18n). Selector de idioma sin recargar.                    | Revisión de arquitectura frontend |

---

## 4. Funcionalidades fuera de alcance (futuras versiones)

- Integración de pasarela de pago real (Stripe, PayPal).
- Aplicación móvil nativa.
- Notificaciones automáticas por email.
- Valoraciones y comentarios de productos.
- Integración con empresas de mensajería.
- Gráficos avanzados (D3.js).
- Más de dos idiomas (MVP: español/inglés).
- Alertas por bajo stock vía email.
- Integración con ERP externo.

---

*Documento de requisitos – DistribuTech Pro – versión final para inicio del desarrollo.*