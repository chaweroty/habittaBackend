const { Database } = require('../config/database');
const { UserRepository } = require('../repositories/UserRepository');
const { UserService } = require('../services/UserService');
const { UserController } = require('../controllers/UserController');

// Clase del contenedor de inyección de dependencias
class DIContainer {
  constructor() {
    // Instanciar base de datos (Singleton)
    this.database = Database.getInstance();

    // Instanciar repositorios
    this.userRepository = new UserRepository(this.database);

    // Instanciar servicios
    this.userService = new UserService(this.userRepository);

    // Instanciar controladores
    this.userController = new UserController(this.userService);
  }

  // Método para obtener cualquier dependencia por nombre
  get(dependency) {
    return this[dependency];
  }

  // Método para cerrar conexiones cuando la aplicación termina
  async cleanup() {
    await this.database.close();
  }
}

// Instancia global del contenedor
let containerInstance = null;

// Factory para obtener el contenedor
const getContainer = () => {
  if (!containerInstance) {
    containerInstance = new DIContainer();
  }
  return containerInstance;
};

// Función para limpiar el contenedor (útil para testing)
const resetContainer = () => {
  containerInstance = null;
};

module.exports = {
  DIContainer,
  getContainer,
  resetContainer
};
