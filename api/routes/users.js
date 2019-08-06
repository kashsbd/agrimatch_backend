const express = require('express');
const multer = require('multer');
const router = express.Router();

const UserController = require('../controllers/users');
const { PROPIC_URL, GPA_CERT_URL } = require('../config/config');
const checkAuth = require('../middlewares/check-auth');

const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            const picPath = file.fieldname === 'proPic' ? PROPIC_URL : GPA_CERT_URL;
            cb(null, picPath);
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

const cpUpload = upload.fields([{ name: 'proPic', maxCount: 1 }, { name: 'gpaCertPic', maxCount: 1 }]);

router.get('/test', UserController.test);

router.post('/checkEmail', UserController.check_email);

router.post('/signup', cpUpload, UserController.user_signup);

router.post('/login', UserController.user_login);

router.get('/:userId/profile_pic', UserController.get_profile_pic);

module.exports = router;