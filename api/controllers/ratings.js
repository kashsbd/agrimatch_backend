const mongoose = require('mongoose');

const Rating = require('../models/rating');
const User = require('../models/user');

exports.save_rating = async (req, res) => {
	const { fromUser, toUser, value, feedback } = req.body;

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
