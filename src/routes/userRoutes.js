const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, userIdSchema } = require('../schemas/userSchema');

const createUserRoutes = (userController) => {
  const router = Router();

  // Rutas públicas de usuarios (solo admins pueden ver todos los usuarios)
  router.get('/', 
    authenticate, 
    authorize(['admin']), 
    userController.getAllUsers
  );

  router.get('/:id', 
    authenticate,
    validateParams(userIdSchema),
    userController.getUserById
  );

  // Solo admins pueden crear usuarios directamente
  router.post('/',
    authenticate,
    authorize(['admin']),
    validateBody(createUserSchema),
    userController.createUser
  );

  // Los usuarios pueden actualizar su propio perfil, admins pueden actualizar cualquiera
  router.put('/:id',
    authenticate,
    validateParams(userIdSchema),
    validateBody(updateUserSchema),
    userController.updateUser
  );

  // Solo admins pueden eliminar usuarios
  router.delete('/:id',
    authenticate,
    authorize(['admin']),
    validateParams(userIdSchema),
    userController.deleteUser
  );

  return router;
};

module.exports = { createUserRoutes };
