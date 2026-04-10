/**
 * DistribuTech Pro - Servidor Express principal
 * Punto de entrada del backend
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas de la API ──────────────────────────────────────────────────────────
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DistribuTech Pro API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// TODO: Importar y montar rutas cuando estén implementadas
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/productos', require('./routes/productos'));
// app.use('/api/categorias', require('./routes/categorias'));
// app.use('/api/fabricantes', require('./routes/fabricantes'));
// app.use('/api/cotizaciones', require('./routes/cotizaciones'));
// app.use('/api/pedidos', require('./routes/pedidos'));
// app.use('/api/usuarios', require('./routes/usuarios'));
// app.use('/api/comerciales', require('./routes/comerciales'));

// ── Manejo de rutas no encontradas ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor DistribuTech Pro corriendo en http://localhost:${PORT}`);
  console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
