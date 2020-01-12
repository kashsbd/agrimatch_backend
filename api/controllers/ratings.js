const mongoose = require('mongoose');

const Rating = require('../models/rating');
const User = require('../models/user');
const Media = require('../models/media');
const Notification = require('../models/notification');

exports.save_rating = async (req, res) => {
	const { fromUser, toUser, value, feedback } = req.body;

	const files = req.files || [];

	const noties_socket = req.noties_socket;

	try {
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

		const rating = await ratingModel.save();

		const _noti = new Notification(
			{
				_id: new mongoose.Types.ObjectId(),
				type: 'REQUEST-TRANSACT',
				createdBy: fromUser,
				createdTo: toUser,
				data: rating._id
			}
		);

		const ratingNoti = await _noti.save();

		noties_socket.emit('noti::created', ratingNoti);

		return res.status(201).json({ msg: 'OK' });

	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.action = async (req, res) => {
	const { status, notiId, ratingId } = req.body;

	try {
		let saved_noti = await Notification.findById(notiId).exec();
		if (saved_noti) {
			saved_noti.isRead = true;
			await saved_noti.save();
		}

		let saved_rating = await Rating.findById(ratingId).exec();
		if (saved_rating) {
			if (status === 'ALLOW') {
				await User.update({ _id: saved_rating.toUser }, { $inc: { rateCount: 1, totalRateValue: saved_rating.value } });
			} else {

			}

			saved_rating.status = status;
			await saved_rating.save();
		}

		return res.status(200).json({ msg: 'OK' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
}