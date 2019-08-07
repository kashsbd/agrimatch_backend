const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const sharp = require('sharp');
const _ = require('lodash');
const readFilePromise = require('fs-readfile-promise');

const { JWT_KEY, PROPIC_URL } = require('../config/config');

const User = require("../models/user");
const Media = require("../models/media");

exports.test = (req, res) => {
    res.status(200).json({
        message: 'Hello World!'
    });
}

exports.check_email = async (req, res) => {

    const {
        email,
        userType,
    } = req.body;

    try {
        const users = await User.find({ email, userType }).exec();

        if (users && users.length >= 1) {
            return res.status(409).json({ message: "Mail exists" });
        }

        return res.status(200).json({ message: "OK" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

exports.user_signup = async (req, res) => {
    const propic_file = req.files['proPic'] && req.files['proPic'].length > 0 ? req.files['proPic'][0] : undefined;
    const gpa_cert_file = req.files['gpaCertPic'] && req.files['gpaCertPic'].length > 0 ? req.files['gpaCertPic'][0] : undefined;

    const {
        email,
        userType,
        password,
        name,
        phno,
        gpaCertNo
    } = req.body;

    // init user model 
    const user = new User(
        {
            _id: new mongoose.Types.ObjectId(),
            email,
            password,
            name,
            phno,
            userType
        }
    );

    if ((userType === 'FARMER') && (gpaCertNo !== undefined) && (gpaCertNo.trim().length > 0)) {
        user.gpaCertNo = gpaCertNo;
    }

    if ((userType === 'FARMER') && (gpa_cert_file !== undefined)) {
        //init gpa media model
        const gpa_media_model = new Media(
            {
                _id: new mongoose.Types.ObjectId()
            }
        );
        //get metadata of gpa cert pic
        const pic = await sharp(gpa_cert_file.path).metadata();
        //get image metadata 
        gpa_media_model.width = pic.width;
        gpa_media_model.height = pic.height;
        gpa_media_model.contentType = gpa_cert_file.mimetype;
        gpa_media_model.name = gpa_cert_file.filename;

        //finally save media model and push media id to user model
        const rnMedia = await gpa_media_model.save();
        user.gpaCertPic = rnMedia._id;
    }

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
        media_model.name = propic_file.filename;

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
            name: result.name,
            userType: result.userType
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

exports.user_login = async (req, res, next) => {

    const {
        email,
        userType,
        password
    } = req.body;

    try {
        const users = await User.find({ email, password, userType }).exec();

        if (users && users.length < 1) {
            return res.status(401).json({ message: "Auth failed" });
        }

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
                name: users[0].name,
                userId: users[0]._id,
                userType: users[0].userType
            }
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

exports.get_profile_pic = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId).exec();

        if (user) {
            try {
                const propic = await Media.findById(user.profile).exec();

                if (propic) {
                    const propicUrl = PROPIC_URL + propic.name;
                    try {
                        const file = await readFilePromise(propicUrl);
                        return res.status(200).send(file);
                    } catch (error) {
                        return res.status(404).json({ message: "No such file" });
                    }
                }

                return res.status(404).json({ message: "No valid entry found for provided image id." });

            } catch (error) {
                console.log(error);
                return res.status(500).json({ error });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}


