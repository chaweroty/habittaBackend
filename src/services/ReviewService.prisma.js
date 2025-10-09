const { prisma } = require('../prismaClient'); // Asegúrate de que la ruta sea correcta

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

  async createReviewsForApplicationTransition(application, currentStatus, newStatus, actorId) {
    const reviewData = [];
    const now = new Date();

    // Escenario 1: Inquilino se retira antes del cierre
    if ((currentStatus === 'pre_approved' && newStatus === 'withdrawn') ||
        (currentStatus === 'approved' && newStatus === 'withdrawn')) {
      reviewData.push({
        reviewer_id: application.property.id_owner, // El propietario evalúa
        reviewed_id: actorId, // El inquilino es evaluado
        application_id: application.id,
        rating: null,
        comment: null,
        context_type: 'cancelled_by_tenant',
        weight: 0.5,
        status: 'pending',
        auto_created: true,
        created_at: now
      });
    }

    // Escenario 2: Propietario rechaza una solicitud aprobada
    if (currentStatus === 'approved' && newStatus === 'rejected' && actorId === application.property.id_owner) {
      reviewData.push({
        reviewer_id: application.renter.id, // El inquilino evalúa
        reviewed_id: actorId, // El propietario es evaluado
        application_id: application.id,
        rating: null,
        comment: null,
        context_type: 'cancelled_by_owner',
        weight: 0.5,
        status: 'pending',
        auto_created: true,
        created_at: now
      });
    }

    // Escenario 3: Arriendo finalizado normalmente
    if (currentStatus === 'signed' && newStatus === 'terminated') {
      reviewData.push(
        {
          reviewer_id: application.property.id_owner, // El propietario evalúa
          reviewed_id: application.renter.id, // El inquilino es evaluado
          application_id: application.id,
          rating: null,
          comment: null,
          context_type: 'normal',
          weight: 1.0,
          status: 'pending',
          auto_created: true,
          created_at: now
        },
        {
          reviewer_id: application.renter.id, // El inquilino evalúa
          reviewed_id: application.property.id_owner, // El propietario es evaluado
          application_id: application.id,
          rating: null,
          comment: null,
          context_type: 'normal',
          weight: 1.0,
          status: 'pending',
          auto_created: true,
          created_at: now
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
      where: { reviewed_id: userId },
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