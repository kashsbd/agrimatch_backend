const express = require('express');
const multer = require('multer');
const router = express.Router();

const PostController = require('../controllers/posts');
const checkAuth = require('../middlewares/check-auth');
const cache = require('../middlewares/cache-service');
const { CROP_PIC_URL } = require('../config/config');

const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, CROP_PIC_URL);
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

//get all posts
router.get('/getAllPosts', checkAuth, cache(10), PostController.get_all_posts);

//create new post
router.post('/', checkAuth, upload.array('cropImage'), PostController.create_post);
//get post by id
router.get('/:postId', checkAuth, PostController.get_post_by_id);

//get photo by media id
router.get('/media/:mediaId/:type', PostController.get_photo);

//delete post
router.post('/:postId/delete', checkAuth, PostController.delete_post);

module.exports = router;