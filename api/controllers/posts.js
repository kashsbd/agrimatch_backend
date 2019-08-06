const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');
const _ = require('lodash');

const Post = require("../models/post");
const User = require("../models/user");
const Media = require("../models/media");

const { CROP_PIC_URL, SERVER_URL } = require('../config/config');
const { getPhotoQuality } = require('../utils/calculate-photo-quality');

exports.get_all_posts = async (req, res, next) => {
    const page = req.query.page || 1;
    // limit is 10 as default  in mongoose pagination
    const options = {
        sort: { createdAt: -1 },
        select: '-__v',
        populate: [
            { path: 'user', select: 'name role' },
            { path: 'media', select: 'width height contentType' }
        ],
        page: page
    };

    try {
        const result = await Post.paginate({ isAvailable: true, postType: 'Public' }, options);
        return res.status(200).send(result);
    } catch (error) {
        return res.status(500).send(error);
    }
}

exports.get_post_by_id = async (req, res, next) => {

    const id = req.params.postId;

    try {
        let doc = await Post.findById(id)
            .populate('user', 'name role')
            .populate('media', 'width height contentType')
            .exec();

        if (doc && doc.isAvailable) {
            let rnDoc = JSON.parse(JSON.stringify(doc));
            rnDoc['type'] = 'POST';
            return res.status(200).send(rnDoc);
        }

        return res.status(404).json({
            message: "No valid entry found for provided ID"
        });

    } catch (error) {
        return res.status(500).send(error);
    }
}

exports.create_post = async (req, res, next) => {
    const files = req.files || [];

    const userId = req.body.userId;
    const postType = req.body.postType;

    //init post model
    const post_model = new Post({ _id: new mongoose.Types.ObjectId() });
    post_model.user = userId;
    post_model.postType = postType;

    //for post media
    if (files && files.length > 0) {
        for (let f of files) {
            //init media model
            const media_model = new Media(
                {
                    _id: new mongoose.Types.ObjectId(),
                    type: 'POST'
                }
            );
            //check if it is image
            if (f.mimetype.startsWith('image/')) {
                if (f.mimetype === 'image/gif') {
                    const gif = await sharp(f.path).metadata();
                    //get gif metadata 
                    media_model.width = gif.width;
                    media_model.height = gif.height;
                    media_model.contentType = f.mimetype;
                    media_model.mediaUrl = f.filename;
                } else {
                    const imageName = Date.now() + '_compressed_' + f.originalname.split('.')[0] + '.jpeg';
                    const absolutePath = CROP_PIC_URL + imageName;
                    const pic = await sharp(f.path).resize().jpeg({ quality: getPhotoQuality(f.size) }).toFile(absolutePath);
                    //get image metadata 
                    media_model.width = pic.width;
                    media_model.height = pic.height;
                    media_model.contentType = f.mimetype;
                    media_model.mediaUrl = imageName;
                    //finally delete original file
                    fs.unlink(f.path, (err) => {
                        if (err) console.log("Can't delete original file.");
                    });
                }
            }

            //finally save media model and push media id to post model
            const rnMedia = await media_model.save();
            post_model.media.push(rnMedia._id);
        }
    }

    try {
        const rnPost = await post_model.save();
        //get populated post by post id
        const final_post = await Post.findById(rnPost._id)
            .populate('user', 'name role')
            .populate('media', 'width height contentType')
            .exec();

        //get user by userId
        const rnUser = await User.findById(userId);

        return res.status(404).json({
            message: "No valid entry found for provided post id"
        });

    } catch (e) {
        return res.status(500).json({
            error: e
        });
    }
}

exports.get_photo = async (req, res, next) => {
    const mediaId = req.params.mediaId;

    try {
        const media = await Media.findById(mediaId);
        if (media) {
            const mediaUrl = CROP_PIC_URL + media.mediaUrl;
            try {
                const file = await readFilePromise(mediaUrl);
                return res.status(200).send(file);
            } catch (error) {
                return res.status(404).json({
                    message: 'No such file'
                });
            }
        } else {
            return res.status(404).json({
                message: 'No valid entry found for provided ID'
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
}

exports.delete_post = async (req, res, next) => {

    const post_id = req.params.postId;

    try {
        let post = await Post.findById(post_id).exec();

        if (post) {
            post.isAvailable = false;
            await post.save();
            return res.status(200).send({ message: 'OK' });
        }

        return res.status(404).json({
            message: "No valid entry found for provided ID"
        });

    } catch (error) {
        return res.status(500).json({
            error: err
        });
    }
}

exports.update_post = (req, res, next) => {

}