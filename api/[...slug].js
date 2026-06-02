const app = require('../backend/server.js');

// Exportar la app de Express para que Vercel la maneje serverlessly con rutas comodín
module.exports = app;
