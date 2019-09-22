const express = require('express');
const multer = require('multer');
const router = express.Router();

const CropController = require('../controllers/crops');
const checkAuth = require('../middlewares/check-auth');
const { CROP_PIC_URL } = require('../config/config');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, CROP_PIC_URL);
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	},
});

const fileFilter = function(req, file, cb) {
	const mimeType = file.mimetype;
	if (mimeType.startsWith('image/')) {
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

//get all crops
router.get('/', checkAuth, CropController.get_all_crops);
//get crop by id
router.get('/:id', checkAuth, CropController.get_crop_by_id);
//create crop
router.post('/', checkAuth, upload.array('cropImage'), CropController.create_crop);
//get photo by media id
router.get('/media/:id/:type', CropController.get_photo);

module.exports = router;
