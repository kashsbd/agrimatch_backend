const mongoose = require('mongoose');

const Location = require('../models/location');

exports.get_near_me = async (req, res) => {
	const { userType, lng, lat } = req.query;

	const locQuery = {
		$near: {
			$maxDistance: 1000, // in meter ** 1000 metre = 0.621371 mile
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
			.exec();

		locations = locations.filter(loc => loc.user !== null);

		return res.status(200).send(locations);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
