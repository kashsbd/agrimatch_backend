const express = require('express');
const router = express.Router();

const RatingController = require('../controllers/ratings');
const checkAuth = require('../middlewares/check-auth');

//save rating
router.post('/ratings', checkAuth, RatingController.save_rating);

module.exports = router;
