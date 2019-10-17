const express = require('express');
const multer = require('multer');
const router = express.Router();

const ChatController = require('../controllers/chat');
const checkAuth = require('../middlewares/check-auth');
const { CHAT_URL } = require('../config/config');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, CHAT_URL);
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

//get all chats
router.get('/messages', checkAuth, ChatController.get_msgs_of_room);
//create chat
router.post('/', checkAuth, upload.array('chatImage'), ChatController.save_chat);
//get photo by media id
router.get('/media/:id/:type', ChatController.get_photo);

module.exports = router;
