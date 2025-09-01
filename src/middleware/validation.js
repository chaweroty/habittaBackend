const { z, ZodError } = require('zod');

const validateBody = (schema) => {
  return (req, res, next) => {
    if (!schema || typeof schema.parse !== 'function') {
      return res.status(500).json({
        success: false,
        message: 'Schema de validación no definido o inválido en validateBody.'
      });
    }
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError && Array.isArray(error.errors)) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors
        });
      }
      next(error);
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors
        });
      }
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Query parameters inválidos',
          errors
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery
};
