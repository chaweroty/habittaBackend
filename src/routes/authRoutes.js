const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { createUserSchema, loginSchema, updatePushTokenSchema } = require('../schemas/userSchema');
const { UserController } = require('../controllers/UserController');

const userController = new UserController();

const router = Router();

// POST /auth/register - Registro público
router.post('/register',
  validateBody(createUserSchema),
  userController.register
);

// POST /auth/login - Login público
router.post('/login',
  validateBody(loginSchema),
  userController.login
);

// GET /auth/me - Obtener información del usuario actual
router.get('/me',
  authenticate,
  userController.getCurrentUser
);

// PUT /auth/push-token - Actualizar push token del usuario
router.put('/push-token',
  authenticate,
  validateBody(updatePushTokenSchema),
  userController.updatePushToken
);

// DELETE /auth/push-token - Logout y limpiar push token
router.delete('/push-token',
  authenticate,
  userController.clearPushToken
);

module.exports = router;
