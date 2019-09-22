const mongoose = require('mongoose');

const Rating = require('../models/rating');
const User = require('../models/user');
const Media = require('../models/media');

const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');

const { FEEDBACK_URL } = require('../config/config');

exports.save_rating = async (req, res) => {
	const { fromUser, toUser, value, feedback } = req.body;

	const files = req.files || [];

	//for feedback media
	if (files && files.length > 0) {
		for (let f of files) {
			//init media model
			const media_model = new Media({
				_id: new mongoose.Types.ObjectId(),
				type: 'FEEDBACK',
			});
			//check if it is image
			if (f.mimetype.startsWith('video/')) {
				const imageName = Date.now() + f.originalname.split('.')[0] + '.3gp';

				const absolutePath = FEEDBACK_URL + imageName;

				//get image metadata
				media_model.width = undefined;
				media_model.height = undefined;
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
		const ratedBefore = await Rating.find({ fromUser, toUser }).count();

		if (ratedBefore === 0) {
			// init rating model
			const rating = new Rating({
				_id: new mongoose.Types.ObjectId(),
				fromUser,
				toUser,
				value,
				feedback,
			});

			await rating.save();

			await User.update({ _id: fromUser }, { $inc: { rateCount: 1, totalRateValue: value } });

			return res.status(200).json({ msg: 'OK' });
		}

		return res.status(200).json({ msg: 'OK' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
