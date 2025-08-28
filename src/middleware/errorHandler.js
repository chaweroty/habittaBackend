const errorHandler = (error, req, res, next) => {
  // Log del error para debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determinar el código de estado
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';

  // Manejar errores específicos
  if (error.message.includes('Token inválido') || error.message.includes('Token de acceso requerido')) {
    statusCode = 401;
  } else if (error.message.includes('No tienes permisos')) {
    statusCode = 403;
  } else if (error.message.includes('no encontrado') || error.message.includes('not found')) {
    statusCode = 404;
  } else if (error.message.includes('ya existe') || error.message.includes('already exists')) {
    statusCode = 409;
  } else if (error.message.includes('Credenciales inválidas')) {
    statusCode = 401;
  }

  // Respuesta del error
  const errorResponse = {
    success: false,
    message: message,
    error: {
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // En desarrollo, incluir el stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Crear un error personalizado
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  createError
};
