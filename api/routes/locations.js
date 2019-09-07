const express = require('express');
const router = express.Router();

const LocationController = require('../controllers/locations');
const checkAuth = require('../middlewares/check-auth');

//get all near me
router.get('/nearme', checkAuth, LocationController.get_near_me);

module.exports = router;