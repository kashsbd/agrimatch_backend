const mongoose = require('mongoose');

const Rating = require('../models/rating');
const User = require('../models/user');
const Media = require('../models/media');

const readFilePromise = require('fs-readfile-promise');

exports.save_rating = async (req, res) => {
	const { fromUser, toUser, value, feedback } = req.body;

	console.log(req.body);

	const files = req.files || [];

	try {
		const ratedBefore = await Rating.find({ fromUser, toUser }).count();

		if (ratedBefore === 0) {
			// init rating model
			const ratingModel = new Rating({
				_id: new mongoose.Types.ObjectId(),
				fromUser,
				toUser,
				value,
				feedback,
			});

			//for feedback media
			if (files && files.length > 0) {
				for (let f of files) {
					//init media model
					const media_model = new Media({
						_id: new mongoose.Types.ObjectId(),
					});
					//check if it is image
					if (f.mimetype.startsWith('audio/')) {
						const imageName = Date.now() + '-' + f.originalname.split('.')[0] + '.3gp';

						//get image metadata
						media_model.width = undefined;
						media_model.height = undefined;
						media_model.contentType = f.mimetype;
						media_model.name = imageName;
					}

					//finally save media model and push media id to rating model
					const rnMedia = await media_model.save();
					ratingModel.feedbackAudio = rnMedia._id;
				}
			}

			await ratingModel.save();

			await User.update({ _id: toUser }, { $inc: { rateCount: 1, totalRateValue: value } });

			return res.status(201).json({ msg: 'OK' });
		}

		return res.status(201).json({ msg: 'OK' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
