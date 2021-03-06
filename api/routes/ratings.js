const express = require('express');
const multer = require('multer');
const router = express.Router();

const RatingController = require('../controllers/ratings');
const checkAuth = require('../middlewares/check-auth');
const { FEEDBACK_URL } = require('../config/config');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, FEEDBACK_URL);
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	},
});

const fileFilter = function (req, file, cb) {
	const mimeType = file.mimetype;
	if (mimeType.startsWith('audio/')) {
		return cb(null, true);
	} else return cb(new Error(mimeType + ' file types are not allowed.'), false);
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 524288000, // 500MB in bytes
	},
});

//save rating
router.post('/', checkAuth, upload.array('feedbackAudio'), RatingController.save_rating);
//for action
router.post('/action', checkAuth, RatingController.action);

module.exports = router;
