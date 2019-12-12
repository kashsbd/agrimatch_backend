const mongoose = require('mongoose');

const ChatRoom = require('../models/chatroom');
const User = require('../models/user');
const Location = require('../models/location');

const { CHAT_URL, SERVER_URL } = require('../config/config');
const { getNewLngLat } = require('../utils/geo-utils');

exports.create_chatroom = async (req, res) => {
	const { roomName, user, lng, lat } = req.body;

	try {
		const saved_room = await ChatRoom.find({ roomName }).exec();

		if (saved_room.length > 0) {
			return res.status(409).json({ msg: 'Group name already exist.' });
		}

		//init room model
		let room_model = new ChatRoom({ _id: new mongoose.Types.ObjectId(), roomName, roomType: 'GROUP' });
		room_model.participants.push(user);
		const chatRoom = await room_model.save();

		//push room id to user's chatRoom
		let saved_user = await User.findById(user).exec();
		saved_user.chatRooms.push(chatRoom._id);
		await saved_user.save();

		if (lng !== undefined && lat !== undefined) {
			const newLatLng = getNewLngLat(parseFloat(lng), parseFloat(lat));

			const location = { type: 'Point', coordinates: [newLatLng.lng, newLatLng.lat] };
			//init location model
			let location_model = new Location({
				_id: new mongoose.Types.ObjectId(),
				location,
				chatType: 'GROUP',
				user,
			});

			location_model.chatRoom = chatRoom._id;
			const rnLocation = await location_model.save();
		}

		return res.status(201).json({ msg: 'Group name created.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.join_chatroom = async (req, res) => {
	const { user, roomId } = req.body;

	try {
		let saved_room = await ChatRoom.findById(roomId).exec();

		if (saved_room) {
			if (!saved_room.participants.includes(user)) {
				saved_room.participants.push(user);

				await saved_room.save();

				let saved_user = await User.findById(user).exec();
				saved_user.chatRooms.push(roomId);
				await saved_user.save();

				return res.status(200).json({ msg: 'User joined chatroom.' });
			}

			return res.status(200).json({ msg: 'User already joined chatroom.' });
		}

		return res.status(404).json({ msg: 'No valid entry found for given id.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
