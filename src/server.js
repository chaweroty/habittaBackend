const App = require('./app');

const PORT = parseInt(process.env.PORT || '3000');

// Crear e iniciar la aplicación
const app = new App();
app.listen(PORT);
