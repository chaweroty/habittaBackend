const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id_subscription: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan: {
    type: DataTypes.ENUM('basico', 'destacado', 'gestion', 'integral'),
    allowNull: false,
    defaultValue: 'basico',
    comment: 'basico: gratuito, destacado: $3/mes, gestion: 2.5% renta (solo propietarios), integral: 5% renta (solo propietarios)'
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'gratuito',
    comment: 'Tipo de suscripción: gratuito, mensual, porcentaje, etc.'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'subscriptions',
  timestamps: false
});

module.exports = Subscription;
