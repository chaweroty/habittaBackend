const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient(); // Instanciar PrismaClient

class ReviewService {
  async createReview(data) {
    // Lógica para crear una reseña
    return await prisma.review.create({ data });
  }

  async getReview(id) {
    // Lógica para obtener una reseña por ID
    return await prisma.review.findUnique({ where: { id } });
  }

  async getAllReviews() {
    // Lógica para obtener todas las reseñas
    return await prisma.review.findMany();
  }

  async updateReview(id, data) {
    // Lógica para actualizar una reseña
    return await prisma.review.update({ where: { id }, data });
  }

  async deleteReview(id) {
    // Lógica para cambiar el estado de una reseña a eliminado
    return await prisma.review.update({ where: { id }, data: { status: 'deleted' } });
  }

  // Obtener todas las reviews recibidas por un usuario
  async getReceivedReviews(userId) {
    return await prisma.review.findMany({
      where: { 
        id_receiver: userId,
        status: { not: 'deleted' } // Excluir reviews eliminadas
      },
      select: {
        id: true,
        id_application: true,
        id_author: true,
        id_receiver: true,
        rating: true,
        comment: true,
        context_type: true,
        weight: true,
        status: true,
        create_date: true
      },
      orderBy: {
        create_date: 'desc'
      }
    });
  }

  // Obtener las reviews pendientes que el usuario debe escribir como author
  async getPendingReviewsToWrite(userId) {
    // Obtener reviews pendientes (sin relaciones porque Review no define relations explícitas)
    const reviews = await prisma.review.findMany({
      where: { 
        id_author: userId,
        status: 'pending', // Solo reviews pendientes
        rating: null // Reviews que aún no han sido completadas
      },
      select: {
        id: true,
        id_application: true,
        id_author: true,
        id_receiver: true,
        rating: true,
        comment: true,
        context_type: true,
        weight: true,
        status: true,
        create_date: true
      },
      orderBy: {
        create_date: 'desc'
      }
    });

    if (!reviews || reviews.length === 0) return reviews;

    // Recolectar applicationIds y receiverIds para enriquecer la información
    const applicationIds = Array.from(new Set(reviews.map(r => r.id_application).filter(Boolean)));
    const receiverIds = Array.from(new Set(reviews.map(r => r.id_receiver).filter(Boolean)));

    // Traer aplicaciones con el título de la propiedad relacionada
    const applications = applicationIds.length > 0
      ? await prisma.application.findMany({
          where: { id: { in: applicationIds } },
          select: {
            id: true,
            property: {
              select: { title: true }
            }
          }
        })
      : [];

    // Map de applicationId -> property title
    const appPropMap = {};
    for (const a of applications) {
      appPropMap[a.id] = a.property?.title || null;
    }

    // Traer nombres de los usuarios receivers
    const receivers = receiverIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: receiverIds } },
          select: { id: true, name: true }
        })
      : [];

    const receiverMap = {};
    for (const u of receivers) {
      receiverMap[u.id] = u.name || null;
    }

    // Enriquecer cada review con property_title y receiver_name
    const enriched = reviews.map(r => ({
      ...r,
      property_title: r.id_application ? appPropMap[r.id_application] || null : null,
      receiver_name: r.id_receiver ? receiverMap[r.id_receiver] || null : null
    }));

    return enriched;
  }

  async createReviewsForApplicationTransition(application, currentStatus, newStatus, actorId) {
    const reviewData = [];
    const now = new Date();

    // Escenario 1: Inquilino se retira antes del cierre
    if ((currentStatus === 'pre_approved' && newStatus === 'withdrawn') ||
        (currentStatus === 'approved' && newStatus === 'withdrawn')) {
      reviewData.push({
        id_author: application.property.id_owner, // El propietario evalúa
        id_receiver: actorId, // El inquilino es evaluado
        id_application: application.id,
        rating: null,
        comment: null,
        context_type: 'cancelledByTenant',
        weight: 0.5,
        status: 'pending'
      });
    }

    // Escenario 2: Propietario rechaza una solicitud aprobada
    if (currentStatus === 'approved' && newStatus === 'rejected' && actorId === application.property.id_owner) {
      reviewData.push({
        id_author: application.renter.id, // El inquilino evalúa
        id_receiver: actorId, // El propietario es evaluado
        id_application: application.id,
        rating: null,
        comment: null,
        context_type: 'cancelledByOwner',
        weight: 0.5,
        status: 'pending'
      });
    }

    // Escenario 3: Arriendo finalizado normalmente
    if (currentStatus === 'signed' && newStatus === 'terminated') {
      reviewData.push(
        {
          id_author: application.property.id_owner, // El propietario evalúa
          id_receiver: application.renter.id, // El inquilino es evaluado
          id_application: application.id,
          rating: null,
          comment: null,
          context_type: 'normal',
          weight: 1.0,
          status: 'pending'
        },
        {
          id_author: application.renter.id, // El inquilino evalúa
          id_receiver: application.property.id_owner, // El propietario es evaluado
          id_application: application.id,
          rating: null,
          comment: null,
          context_type: 'normal',
          weight: 1.0,
          status: 'pending'
        }
      );
    }

    // Crear las reseñas en la base de datos
    if (reviewData.length > 0) {
      await prisma.review.createMany({ data: reviewData });
    }
  }

  async getReviewSummary(userId) {
    const reviews = await prisma.review.findMany({
      where: { id_receiver: userId },
      select: {
        context_type: true,
        weight: true,
        rating: true
      }
    });

    const summary = {
      totalReviews: reviews.length,
      positivePercentage: 0,
      contextCounts: {}
    };

    let totalWeight = 0;
    let positiveWeight = 0;

    for (const review of reviews) {
      totalWeight += review.weight;
      if (review.rating === true) {
        positiveWeight += review.weight;
      }

      if (!summary.contextCounts[review.context_type]) {
        summary.contextCounts[review.context_type] = 0;
      }
      summary.contextCounts[review.context_type] += 1;
    }

    summary.positivePercentage = totalWeight > 0 ? (positiveWeight / totalWeight) * 100 : 0;

    return summary;
  }
}

module.exports = { ReviewService };