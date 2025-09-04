const { UserService } = require('../services/UserService');
const userService = new UserService();

class UserController {
  constructor() {
    // No inyección de dependencias
    this.userService = userService;
    
    // Bind methods to preserve 'this' context
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
  }

  // GET /users
  async getAllUsers(req, res, next) {
    try {
      const users = await this.userService.getAllUsers();
      
      res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /users/:id
  async getUserById(req, res, next) {
    try {
      const id = req.params.id; // UUID string
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /users
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await this.userService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /users/:id
  async updateUser(req, res, next) {
    try {
      const id = req.params.id; // UUID string
      const userData = req.body;
      
      const updatedUser = await this.userService.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /users/:id
  async deleteUser(req, res, next) {
    try {
      const id = req.params.id; // UUID string
      const deleted = await this.userService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/login
  async login(req, res, next) {
    try {
      const loginData = req.body;
      const authResponse = await this.userService.login(loginData);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: authResponse
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/register
  async register(req, res, next) {
    try {
      const userData = req.body;
      const authResponse = await this.userService.register(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: authResponse
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/me
  async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const user = await this.userService.getUserById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Información del usuario actual',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { UserController };
