const { faker } = require('@faker-js/faker');

const { PrismaClient } = require('./src/generated/prisma');
const { HashUtils } = require('./src/utils/hash');
const prisma = new PrismaClient();

// Algunas imágenes reales de propiedades (Unsplash)
const propertyImages = [
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760211060/casa-aislada-en-el-campo_dk1elk.jpg',
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760211913/carretera-y-la-ciudad_y1izou.jpg',
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760212101/encantadora-casa-amarilla-con-ventanas-de-madera-y-jardin-verde_kbncz9.jpg',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae',
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760211026/hermosa-foto-de-una-casa-moderna-cocina-y-comedor_xbmutm.jpg',
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760211020/casa-de-campo-con-arboles-verdes_xay53w.jpg',
  'https://res.cloudinary.com/dggzv9eld/image/upload/v1760212441/antigua-casa-blanca-y-jardin_zxzose.jpg',
  'https://images.unsplash.com/photo-1472224371017-08207f84aaae'
];

async function main() {
  // 1. Crear usuarios
  const users = [];
  const userRoles = ['admin', 'user', 'owner'];
  const userStatuses = ['Verified', 'Unverified', 'Pending'];
  // Hashear la contraseña una sola vez para todos los usuarios
  const hashedPassword = await HashUtils.hashPassword('Holamundo1234');
  for (let i = 0; i < 8; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        phone: faker.phone.number('3#########'),
        role: faker.helpers.arrayElement(userRoles),
        status: 'Verified',
      }
    });
    users.push(user);
  }

  // --- Crear planes de negocio si no existen (DEBE ejecutarse antes de crear propiedades) ---
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
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
    }
  } else {
    console.log(`🔁 Saltando creación de plans (ya existen ${planCount})`);
  }

  // Obtener plan gratuito preferido (id 1 si existe, si no buscar uno con price 0 o usar el primero disponible)
  let freePlan = await prisma.plan.findUnique({ where: { id: 1 } });
  if (!freePlan) {
    freePlan = await prisma.plan.findFirst({ where: { price: 0 } });
  }
  if (!freePlan) {
    // Si aún no hay plan gratuito, crear uno (no garantizamos id=1 si la tabla ya tenía datos)
    freePlan = await prisma.plan.create({
      data: {
        name: 'Plan Básico',
        price: 0,
        duration_days: 15,
        features: 'Plan básico automático creado por el seed'
      }
    });
  }

  // 2. Crear propiedades
  const properties = [];
  const propertyTypes = ['house', 'apartament', 'store', 'office', 'werehouse'];
  const cities = ['Medellin', 'Bogota', 'Manizales', 'Cartagena', 'Barranquilla', 'Cali', 'Bucaramanga'];
  const publicationStatuses = ['published', 'rented', 'disabled', 'expired'];
  for (let i = 0; i < 10; i++) {
    const owner = faker.helpers.arrayElement(users);
    const property = await prisma.property.create({
      data: {
        id_owner: owner.id,
        title: faker.lorem.words(3),
        description: faker.lorem.sentences(2),
        address: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(cities),
        price: faker.number.int({ min: 200000, max: 5000000 }),
        type: faker.helpers.arrayElement(propertyTypes),
        rooms: faker.number.int({ min: 1, max: 5 }),
        bathrooms: faker.number.int({ min: 1, max: 4 }),
        area: faker.number.int({ min: 40, max: 300 }),
        services: 'Agua, Luz, Gas',
        publication_status: faker.helpers.arrayElement(publicationStatuses),
      }
    });
    properties.push(property);

    // Crear una suscripción por defecto para cada propiedad usando el plan gratuito
    try {
      await prisma.subscription.create({
        data: {
          id_owner: owner.id,
          id_property: property.id,
          id_plan: freePlan.id,
          start_date: new Date(),
          final_date: null,
          status: 'active',
          auto_renew: false,
          plan_price: freePlan.price
        }
      });
    } catch (err) {
      console.warn(`No se pudo crear subscription para property ${property.id}: ${err.message}`);
    }
  }

  // 3. Crear imágenes de propiedades (1-3 por propiedad)
  for (const property of properties) {
    const numImages = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numImages; i++) {
      await prisma.imageProperty.create({
        data: {
          id_property: property.id,
          url_image: faker.helpers.arrayElement(propertyImages)
        }
      });
    }
  }

  // 4. Crear aplicaciones (applications)
  const applicationStatuses = ['pending', 'pending', 'pending', 'rejected', 'withdrawn', 'documents_required'];
  // Filtrar usuarios con role 'user' para asignar como renters
  let renters = users.filter(u => u.role === 'user');
  // Si hay pocos renters, crear usuarios adicionales con role 'user'
  const neededRenters = 8;
  if (renters.length < neededRenters) {
    const toCreate = neededRenters - renters.length;
    for (let i = 0; i < toCreate; i++) {
      const newUser = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: hashedPassword,
          phone: faker.phone.number('3#########'),
          role: 'user',
          status: 'Verified'
        }
      });
      users.push(newUser);
      renters.push(newUser);
    }
  }

  for (let i = 0; i < 15; i++) {
    const property = faker.helpers.arrayElement(properties);
    const renter = faker.helpers.arrayElement(renters);
    await prisma.application.create({
      data: {
        id_renter: renter.id,
        id_property: property.id,
        status: faker.helpers.arrayElement(applicationStatuses),
        description: faker.lorem.sentence(),
      }
    });
  }

// (Bloque de creación de planes movido arriba para ejecutarse antes de properties)

  console.log('✅ Seed de datos de desarrollo completado!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
