const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { createUserSchema, loginSchema } = require('../schemas/userSchema');
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

module.exports = router;
