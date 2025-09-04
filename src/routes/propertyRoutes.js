const { Router } = require('express');
const { PropertyController } = require('../controllers/PropertyController');
const propertyController = new PropertyController();

const router = Router();

// POST /properties
router.post('/', propertyController.createProperty);

// GET /properties/:id
 router.get('/:id', propertyController.getProperty);

// GET /properties
 router.get('/', propertyController.getAllProperties);

// PUT /properties/:id
 router.put('/:id', propertyController.updateProperty);

// DELETE /properties/:id
 router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
