const { Router } = require('express');
const { ReviewController } = require('../controllers/ReviewController');
const { authenticate, authorize } = require('../middleware/auth');
const reviewController = new ReviewController();

const router = Router();

// POST /reviews
router.post('/', authenticate, authorize(['admin']), reviewController.createReview);

// GET /reviews
router.get('/', authenticate, authorize(['admin']), reviewController.getAllReviews);

// GET /reviews/received/:userId - Ver todas las reviews recibidas por un usuario
router.get('/received/:userId', authenticate, reviewController.getReceivedReviews);

// GET /reviews/pending/me - Ver reviews pendientes que el usuario actual debe escribir
router.get('/pending/me', authenticate, reviewController.getPendingReviewsToWrite);

// GET /reviews/:id
router.get('/:id', authenticate, reviewController.getReview);

// GET /reviews/summary/:userId
router.get('/summary/:userId', authenticate, reviewController.getReviewSummary);

// PUT /reviews/:id
router.put('/:id', authenticate, authorize(['user']), reviewController.updateReview);

// DELETE /reviews/:id
router.delete('/:id', authenticate, reviewController.deleteReview);

// PATCH /reviews/:id/disable
router.patch('/:id/disable', authenticate, authorize(['admin']), reviewController.disableReview);

module.exports = router;