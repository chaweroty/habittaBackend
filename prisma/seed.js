const { faker } = require('@faker-js/faker');

const { PrismaClient } = require('../src/generated/prisma');
const { HashUtils } = require('../src/utils/hash');
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
  for (let i = 0; i < 15; i++) {
    const property = faker.helpers.arrayElement(properties);
    const renter = faker.helpers.arrayElement(users);
    await prisma.application.create({
      data: {
        id_renter: renter.id,
        id_property: property.id,
        status: faker.helpers.arrayElement(applicationStatuses),
        description: faker.lorem.sentence(),
      }
    });
  }

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
