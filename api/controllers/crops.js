const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');

const Crop = require('../models/crop');
const Media = require('../models/media');

const { CROP_PIC_URL } = require('../config/config');
const { getPhotoQuality } = require('../utils/calculate-photo-quality');

exports.get_all_crops = async (req, res) => {
	const page = req.query.page || 1;
	const user = req.query.user;
	// limit is 10 as default  in mongoose pagination
	const options = {
		sort: { createdAt: -1 },
		select: '-__v',
		populate: [
			{ path: 'user', select: 'name userType isUserActive' },
			{ path: 'media', select: 'width height contentType' },
		],
		page: page,
	};

	try {
		const result = await Crop.paginate({ isAvailable: true, user }, options);
		return res.status(200).send(result);
	} catch (error) {
		console.log(error);
		return res.status(500).send(error);
	}
};

exports.get_crop_by_id = async (req, res) => {
	const id = req.params.id;

	try {
		const doc = await Crop.findById(id)
			.populate('user', 'name userType')
			.populate('media', 'width height contentType')
			.exec();

		if (doc && doc.isAvailable) {
			return res.status(200).send(doc);
		}

		return res.status(404).json({
			message: 'No valid entry found for provided ID',
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send(error);
	}
};

exports.create_crop = async (req, res, next) => {
	const files = req.files || [];

	const { userId, cropType, quantity } = req.body;

	//init crop model
	const crop_model = new Crop({
		_id: new mongoose.Types.ObjectId(),
		user: userId,
		cropType,
		quantity,
	});

	//for crop media
	if (files && files.length > 0) {
		for (let f of files) {
			//init media model
			const media_model = new Media({
				_id: new mongoose.Types.ObjectId(),
				type: 'CROP',
			});
			//check if it is image
			if (f.mimetype.startsWith('image/')) {
				const imageName = Date.now() + '_compressed_' + f.originalname.split('.')[0] + '.jpeg';

				const absolutePath = CROP_PIC_URL + imageName;

				const pic = await sharp(f.path)
					.resize()
					.jpeg({ quality: getPhotoQuality(f.size) })
					.toFile(absolutePath);

				//get image metadata
				media_model.width = pic.width;
				media_model.height = pic.height;
				media_model.contentType = f.mimetype;
				media_model.name = imageName;
				//finally delete original file
				fs.unlink(f.path, err => {
					if (err) console.log("Can't delete original file.");
				});
			}

			//finally save media model and push media id to crop model
			const rnMedia = await media_model.save();
			crop_model.media = rnMedia._id;
		}
	}

	try {
		const rnCrop = await crop_model.save();
		//get populated crop by crop id
		const final_crop = await Crop.findById(rnCrop._id)
			.populate('user', 'name userType')
			.populate('media', 'width height contentType')
			.exec();

		return res.status(201).send(final_crop);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_photo = async (req, res) => {
	const mediaId = req.params.id;

	try {
		const media = await Media.findById(mediaId);
		if (media) {
			const mediaUrl = CROP_PIC_URL + media.name;
			try {
				const file = await readFilePromise(mediaUrl);
				return res.status(200).send(file);
			} catch (error) {
				return res.status(404).json({
					message: 'No such file',
				});
			}
		} else {
			return res.status(404).json({
				message: 'No valid entry found for provided ID',
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: 'Internal server error',
		});
	}
};

exports.update_post = (req, res, next) => {};
