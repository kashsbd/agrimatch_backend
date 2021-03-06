const mongoose = require('mongoose');

const Location = require('../models/location');

exports.get_near_me = async (req, res) => {
	const { userType, lng, lat, userId } = req.query;

	let singleUsers = [];
	let groupUsers = [];

	const locQuery = {
		$near: {
			$maxDistance: 16093.4, // in meter ** 16093.4 metre = 10 mile
			$geometry: {
				type: 'Point',
				coordinates: [parseFloat(lng), parseFloat(lat)],
			},
		},
	};

	const query = {
		location: locQuery,
	};

	try {
		let locations = await Location.find(query)
			.populate('user', 'name userType phno profile rateCount totalRateValue', 'User', { userType })
			.populate('chatRoom', 'roomName participants')
			.exec();

		const locLength = locations.length;

		for (let i = 0; i < locLength; i++) {
			if (locations[i].chatType === 'SINGLE') {
				if (locations[i].user && locations[i].user._id != userId) {
					singleUsers.push(locations[i]);
				}
			} else {
				groupUsers.push(locations[i]);
			}
		}

		const data = { singleUsers, groupUsers };

		console.log(data);

		return res.status(200).send(data);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.notify_loc_change = async (req, res) => {
	const { user, lng, lat } = req.body;

	try {
		const locations = await Location.find({ user }).exec();

		if (locations && locations.length > 0) {
			const loc_id = locations[0]._id;

			if (lng !== undefined && lat !== undefined) {
				let selected_location = await Location.findById(loc_id).exec();

				const location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };

				selected_location.location = location;

				await selected_location.save();

				return res.status(200).json({ msg: 'Okay' });
			}
		}

		return res.status(404).json({ msg: 'No entry found for given id.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
