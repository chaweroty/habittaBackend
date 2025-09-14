const { Router } = require('express');
const { PropertyController } = require('../controllers/PropertyController');
const { authenticate, authorize } = require('../middleware/auth');
const propertyController = new PropertyController();

const router = Router();

// POST /properties
router.post('/', authenticate, authorize(['owner']), propertyController.createProperty);

// GET /properties/:id
router.get('/:id', authenticate, authorize(['owner', 'admin']), propertyController.getProperty);

// GET /properties
 router.get('/', propertyController.getAllProperties);

// GET /properties/owner/:ownerId
router.get('/owner/:ownerId', authenticate, authorize(['owner']), propertyController.getPropertiesByOwner);

// PUT /properties/:id
 router.put('/:id', propertyController.updateProperty);

// DELETE /properties/:id
 router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
