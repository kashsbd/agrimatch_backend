const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const sharp = require('sharp');
const _ = require('lodash');
const readFilePromise = require('fs-readfile-promise');

const { JWT_KEY, PROPIC_URL } = require('../config/config');

const User = require("../models/user");
const Media = require("../models/media");

exports.test = (req, res, next) => {
    res.status(200).json({
        message: 'Hello World!'
    });
}

exports.create_new_user = async (req, res, next) => {
    const propic_file = req.file;
    const users = await User.find({ email: req.body.email }).exec();

    if (users && users.length >= 1) {
        return res.status(409).json({
            message: "Mail exists"
        });
    } else {
        // init user model 
        const user = new User(
            {
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: req.body.password,
                name: req.body.name,
                role: req.body.role,
                createdBy: req.body.userId
            }
        );

        //check propic_file is not falsely 
        if (propic_file) {
            //init media model
            const media_model = new Media(
                {
                    _id: new mongoose.Types.ObjectId(),
                    type: 'PROFILE'
                }
            );
            //get metadata of propic
            const pic = await sharp(propic_file.path).metadata();
            //get image metadata 
            media_model.width = pic.width;
            media_model.height = pic.height;
            media_model.contentType = propic_file.mimetype;
            media_model.mediaUrl = propic_file.filename;

            //finally save media model and push media id to user model
            const rnMedia = await media_model.save();
            user.profile = rnMedia._id;
        }

        try {
            await user.save();

            return res.status(201).json({
                message: 'OK'
            });

        } catch (err) {

            return res.status(500).json({
                error: err
            })
        }
    }
}

exports.user_signup = async (req, res, next) => {
    const propic_file = req.file;
    const users = await User.find({ email: req.body.email }).exec();

    if (users && users.length >= 1) {
        return res.status(409).json({
            message: "Mail exists"
        });
    } else {
        // init user model 
        const user = new User(
            {
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: req.body.password,
                name: req.body.name,
                role: req.body.role,
                playerIds: [{ playerId: req.body.playerId, status: 'active' }]
            }
        );

        //check propic_file is not falsely 
        if (propic_file) {
            //init media model
            const media_model = new Media(
                {
                    _id: new mongoose.Types.ObjectId()
                }
            );
            //get metadata of propic
            const pic = await sharp(propic_file.path).metadata();
            //get image metadata 
            media_model.width = pic.width;
            media_model.height = pic.height;
            media_model.contentType = propic_file.mimetype;
            media_model.mediaUrl = propic_file.filename;

            //finally save media model and push media id to user model
            const rnMedia = await media_model.save();
            user.profile = rnMedia._id;
        }

        try {
            const result = await user.save();
            //generate token for new user
            const token = jwt.sign(
                {
                    email: result.email,
                    userId: result._id
                },
                JWT_KEY
            );

            return res.status(201).json({
                token: token,
                userId: result._id,
                role: result.role
            });
        } catch (err) {
            return res.status(500).json({
                error: err
            })
        }
    }
}

exports.user_login = async (req, res, next) => {
    const playerId = req.body.playerId;

    try {
        let users = await User.find({ email: req.body.email, password: req.body.password }).exec();
        console.log(users);

        if (users && users.length < 1) {
            return res.status(401).json({
                message: "Auth failed"
            });
        }

        //check playerId not to duplicate
        let ids = Object.assign([], users[0].playerIds);
        const index = _.findIndex(ids, { playerId });
        if (index > -1) {
            ids[index] = { playerId, status: 'active' };
        } else {
            ids.push({ playerId, status: 'active' });
        }

        users[0].playerIds = ids;

        await users[0].save();


        // generate token for logged user
        const token = jwt.sign(
            {
                email: users[0].email,
                userId: users[0]._id
            },
            JWT_KEY
        );

        return res.status(200).json(
            {
                token: token,
                userName: users[0].name,
                userId: users[0]._id,
                role: users[0].role
            }
        );

    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

exports.user_logout = async (req, res, next) => {
    const userId = req.params.userId;
    const playerId = req.body.playerId;

    try {
        let user = await User.findById(userId);
        if (user) {
            let playerIds = Object.assign([], user.playerIds);
            const index = _.findIndex(playerIds, { playerId });
            if (index !== -1) {
                playerIds.splice(index, 1);
                //set new playerIds
                user.playerIds = playerIds;
            }

            //finally save user model
            await user.save();

            return res.status(200).json({
                message: 'User is logged out !'
            });
        } else {
            return res.status(404).json({
                message: "No valid entry found for provided user id"
            });
        }
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
}


exports.get_profile_pic = async (req, res, next) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId);
        if (user) {
            try {
                const propic = await Media.findById(user.profile);
                if (propic) {
                    const propicUrl = PROPIC_URL + propic.mediaUrl;
                    try {
                        const file = await readFilePromise(propicUrl);
                        return res.status(200).send(file);
                    } catch (error) {
                        return res.status(404).json({
                            message: "No such file"
                        });
                    }
                }

                return res.status(404).json({
                    message: "No valid entry found for provided ID"
                });

            } catch (err) {
                return res.status(404).json({
                    message: 'No such file'
                });
            }
        }
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
}


