const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function seedPlans() {
  try {
    const count = await prisma.plan.count();
    if (count > 0) {
      console.log(`🔁 Saltando seed de planes: ya existen ${count} registros`);
      return;
    }

const plansData = [
      {
        name: 'Plan Básico',
        price: 0,
        duration_days: 15, // duración representada en días (15 días)
        features: `Publicación de propiedades sin costo.\n
Duración limitada: la publicación expira tras 15 días.\n
Visibilidad estándar en búsquedas. Ideal para propietarios ocasionales.`
      },
      {
        name: 'Plan Destacado',
        price: 3, // $3/mes
        duration_days: 30, // 0 = sin límite de tiempo mientras esté activo
        features: `Publicación sin límite de tiempo (vigente hasta concretar arriendo).\n
Propiedad destacada en búsquedas y recomendaciones.\n
Estadísticas básicas (visitas y clicks).`
      },
      {
        name: 'Plan Gestión',
        price: 0.025, // 2.5% sobre la renta representado como decimal
        duration_days: 30,
        features: `Incluye todo lo del Plan Destacado.\n
2.5%/renta mensual.\n
Verificación de antecedentes de inquilinos.\n
Gestión de pagos (recordatorios y cobros automáticos).\n
Soporte técnico (atención remota).\n
Opción de contratar un seguro adicional para imprevistos.`
      },
      {
        name: 'Plan Integral',
        price: 0.05, // 5% sobre la renta representado como decimal
        duration_days: 30,
        features: `Incluye todo lo del Plan Gestión.\n
5%/renta mensual.\n
Coordinación y verificación de mantenimientos.\n
Atención presencial en caso de emergencias.\n
Estadísticas avanzadas: comparación de precios, predicción de ingresos, reportes.\n
Incluye el seguro para cubrir imprevistos.`
      }
    ];

    for (const p of plansData) {
      await prisma.plan.create({ data: p });
      console.log(`+ creado plan: ${p.name}`);
    }

    console.log('✅ Seed de planes completado');
  } catch (err) {
    console.error('Error en seed de planes:', err);
    throw err;
  }
}

module.exports = { seedPlans };

if (require.main === module) {
  seedPlans()
    .catch(() => process.exit(1))
    .finally(async () => {
      await prisma.$disconnect();
    });
}
