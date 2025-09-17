const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

class App {
  constructor() {
    this.app = express();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  initializeRoutes() {
    // Ruta de salud
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Rutas de API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/properties', propertyRoutes);

    // Ruta base
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Bienvenido a la API de Habitta',
        version: '1.0.0',
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me'
          },
          users: {
            getAll: 'GET /api/users',
            getById: 'GET /api/users/:id',
            create: 'POST /api/users',
            update: 'PUT /api/users/:id',
            delete: 'DELETE /api/users/:id',
            beAnOwner: 'POST /api/users/be-an-owner'
          },
          properties: {
            getAll: 'GET /api/properties',
            getById: 'GET /api/properties/:id',
            create: 'POST /api/properties',
            update: 'PUT /api/properties/:id',
            delete: 'DELETE /api/properties/:id',
            getByOwner: 'GET /api/properties/owner/:ownerId'
          }
        }
      });
    });
  }

  initializeErrorHandling() {
    // Middleware para rutas no encontradas
    this.app.use(notFoundHandler);

    // Middleware de manejo de errores
    this.app.use(errorHandler);
  }

  listen(port) {
    this.app.listen(port, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`📚 API docs: http://localhost:${port}/`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Manejar el cierre graceful de la aplicación
    process.on('SIGTERM', async () => {
      console.log('🔄 Cerrando aplicación...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🔄 Cerrando aplicación...');
      process.exit(0);
    });
  }
}

module.exports = App;
