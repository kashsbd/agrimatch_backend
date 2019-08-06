const express = require('express');
const multer = require('multer');
const router = express.Router();

const UserController = require('../controllers/users');
const { PROPIC_URL } = require('../config/config');
const checkAuth = require('../middlewares/check-auth');

const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, PROPIC_URL);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }
);

const fileFilter = function (req, file, cb) {
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
        return cb(null, true);
    }
    else
        return cb(new Error(mimeType + " file types are not allowed."), false);
}

const upload = multer(
    {
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 524288000 // 500MB in bytes
        }
    }
);

router.get('/test', UserController.test);

router.post('/', checkAuth, upload.single('propic'), UserController.create_new_user);

router.post('/signup', upload.single('propic'), UserController.user_signup);

router.post('/login', UserController.user_login);

router.get('/:userId/profile_pic', UserController.get_profile_pic);

router.post('/:userId/logout', UserController.user_logout);

module.exports = router;