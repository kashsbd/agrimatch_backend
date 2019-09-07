const mongoose = require('mongoose');

const Location = require("../models/location");
const User = require("../models/user");

exports.get_near_me = async (req, res) => {

    const {
        userType,
        lng,
        lat
    } = req.query;

    const locQuery = {
        $near: {
            $maxDistance: 500, // in meter
            $geometry: {
                type: "Point",
                coordinates: [lng, lat]
            },
        }
    }

    const query = {
        location: locQuery,
        'user.userType': userType
    }

    try {
        const locations = await Location.find(query)
            .populate('user', 'name userType')
            .exec();

        console.log(locations);
        return res.status(200).send(locations);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}
