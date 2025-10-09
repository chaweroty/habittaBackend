const { Router } = require('express');
const { ReviewController } = require('../controllers/ReviewController');
const { authenticate, authorize } = require('../middleware/auth');
const reviewController = new ReviewController();

const router = Router();

// POST /reviews
router.post('/', authenticate, authorize(['admin']), reviewController.createReview);

// GET /reviews
router.get('/', authenticate, authorize(['admin']), reviewController.getAllReviews);

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