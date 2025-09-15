const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, userIdSchema } = require('../schemas/userSchema');
const { UserController } = require('../controllers/UserController');

const userController = new UserController();
const router = Router();

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
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validateBody(createUserSchema), 
  userController.createUser
);
router.put('/:id', 
  authenticate, 
  validateParams(userIdSchema), 
  validateBody(updateUserSchema), 
  userController.updateUser
);
router.delete('/:id', 
  authenticate, 
  authorize(['admin', 'owner', 'user']), 
  validateParams(userIdSchema), 
  userController.deleteUser
);

module.exports = router;
