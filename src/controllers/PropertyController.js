const { PropertyService } = require('../services/PropertyService.prisma');
const { propertySchema } = require('../schemas/propertySchema');
const propertyService = new PropertyService();

class PropertyController {
  constructor() {
    this.propertyService = propertyService;
    this.createProperty = this.createProperty.bind(this);
    this.getProperty = this.getProperty.bind(this);
    this.getAllProperties = this.getAllProperties.bind(this);
    this.getAllPublishedProperties = this.getAllPublishedProperties.bind(this);
    this.searchPublishedProperties = this.searchPublishedProperties.bind(this);
    this.updateProperty = this.updateProperty.bind(this);
    this.deleteProperty = this.deleteProperty.bind(this);
    this.getPropertiesByOwner = this.getPropertiesByOwner.bind(this);
  }

  // POST /properties
  async createProperty(req, res, next) {
    try {
      const parseResult = propertySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.error.errors });
      }
      const property = await this.propertyService.createProperty(parseResult.data);
      res.status(201).json({
        success: true,
        message: 'Propiedad creada exitosamente',
        data: property
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /properties/:id
  async getProperty(req, res, next) {
    try {
      const id = req.params.id;
      const property = await this.propertyService.getProperty(id);
      if (!property) {
        return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });
      }
      res.json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  // GET /properties
  async getAllProperties(req, res, next) {
    try {
      const properties = await this.propertyService.getAllProperties();
      res.json({ success: true, data: properties });
    } catch (error) {
      next(error);
    }
  }
  // GET /properties/published
  async getAllPublishedProperties(req, res, next) {
    try {
      const properties = await this.propertyService.getAllPublishedProperties();
      res.json({ success: true, data: properties });
    } catch (error) {
      next(error);
    }
  }

  // GET /properties/search - Buscar propiedades con filtros
  async searchPublishedProperties(req, res, next) {
    try {
      const filters = req.query;
      const properties = await this.propertyService.searchPublishedProperties(filters);
      res.json({ 
        success: true, 
        message: `Se encontraron ${properties.length} propiedades`,
        data: properties,
        filters: filters // Incluir los filtros aplicados en la respuesta
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /properties/:id
  async updateProperty(req, res, next) {
    try {
      const parseResult = propertySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.error.errors });
      }
      const id = req.params.id;
      const updatedProperty = await this.propertyService.updateProperty(id, parseResult.data);
      res.json({ success: true, message: 'Propiedad actualizada exitosamente', data: updatedProperty });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /properties/:id
  async deleteProperty(req, res, next) {
    try {
      const id = req.params.id;
      const deleted = await this.propertyService.deleteProperty(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });
      }
      res.json({ success: true, message: 'Propiedad eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // GET /properties/owner/:ownerId
  async getPropertiesByOwner(req, res, next) {
    try {
      const ownerId = req.params.ownerId;
      const properties = await this.propertyService.getPropertiesByOwner(ownerId);
      res.json({ success: true, data: properties });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { PropertyController };
