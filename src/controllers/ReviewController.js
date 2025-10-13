const { ReviewService } = require('../services/ReviewService.prisma');
const { reviewSchema } = require('../schemas/reviewSchema');
const reviewService = new ReviewService();

class ReviewController {
  constructor() {
    this.reviewService = reviewService;
    this.createReview = this.createReview.bind(this);
    this.getReview = this.getReview.bind(this);
    this.getAllReviews = this.getAllReviews.bind(this);
    this.getReceivedReviews = this.getReceivedReviews.bind(this);
    this.getPendingReviewsToWrite = this.getPendingReviewsToWrite.bind(this);
    this.updateReview = this.updateReview.bind(this);
    this.deleteReview = this.deleteReview.bind(this);
    this.disableReview = this.disableReview.bind(this);
    this.getReviewSummary = this.getReviewSummary.bind(this);
  }

  // POST /reviews
  async createReview(req, res, next) {
    try {
      const parseResult = reviewSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.error.errors });
      }
      const review = await this.reviewService.createReview(parseResult.data);
      res.status(201).json({ success: true, message: 'Reseña creada exitosamente', data: review });
    } catch (error) {
      next(error);
    }
  }

  // GET /reviews/:id
  async getReview(req, res, next) {
    try {
      const id = req.params.id;
      const review = await this.reviewService.getReview(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      }
      if (
        req.user.role !== 'admin' &&
        req.user.id !== review.id_author &&
        req.user.id !== review.id_receiver
      ) {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  // GET /reviews
  async getAllReviews(req, res, next) {
    try {
      const reviews = await this.reviewService.getAllReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }

    // GET /reviews/received/:userId - Obtener todas las reviews recibidas por un usuario
  async getReceivedReviews(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Verificar permisos: solo el usuario mismo o un admin pueden ver sus reviews
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estas reseñas'
        });
      }

      const reviews = await this.reviewService.getReceivedReviews(userId);
      
      res.json({
        success: true,
        message: `Se encontraron ${reviews.length} reseñas recibidas`,
        data: reviews
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /reviews/pending/me - Obtener reviews pendientes que el usuario actual debe escribir
  async getPendingReviewsToWrite(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const pendingReviews = await this.reviewService.getPendingReviewsToWrite(userId);
      
      res.json({
        success: true,
        message: `Tienes ${pendingReviews.length} reseñas pendientes por escribir`,
        data: pendingReviews
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /reviews/:id
  async updateReview(req, res, next) {
    try {
      const id = req.params.id;
      const review = await this.reviewService.getReview(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      }
      if (req.user.userId !== review.id_author) {
        return res.status(403).json({ success: false, message: 'Solo el autor puede actualizar la reseña' });
      }
      const parseResult = reviewSchema.pick({ comment: true, rating: true }).safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.error.errors });
      }
      const updatedReview = await this.reviewService.updateReview(id, parseResult.data);
      res.json({ success: true, message: 'Reseña actualizada exitosamente', data: updatedReview });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /reviews/:id
  async deleteReview(req, res, next) {
    try {
      const id = req.params.id;
      const review = await this.reviewService.getReview(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      }
      if (req.user.id !== review.id_author) {
        return res.status(403).json({ success: false, message: 'Solo el autor puede eliminar la reseña' });
      }
      const deletedReview = await this.reviewService.updateReview(id, { status: 'Deleted' });
      res.json({ success: true, message: 'Reseña eliminada exitosamente', data: deletedReview });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /reviews/:id/disable
  async disableReview(req, res, next) {
    try {
      const id = req.params.id;
      const review = await this.reviewService.getReview(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo un administrador puede deshabilitar la reseña' });
      }
      const disabledReview = await this.reviewService.updateReview(id, { status: 'disabled' });
      res.json({ success: true, message: 'Reseña deshabilitada exitosamente', data: disabledReview });
    } catch (error) {
      next(error);
    }
  }

  // GET /reviews/summary/:userId
  async getReviewSummary(req, res, next) {
    try {
      const { userId } = req.params;

      // Obtener el resumen de reseñas del servicio
      const summary = await this.reviewService.getReviewSummary(userId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ReviewController };