const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');

const ChatRoom = require('../models/chatroom');
const ChatMessage = require('../models/message');
const Media = require('../models/media');
const User = require('../models/user');

const { CHAT_URL } = require('../config/config');
const { getPhotoQuality } = require('../utils/calculate-photo-quality');

exports.save_chat = async (req, res) => {
	const chat_socket = req.chat_socket;

	const chatPicFile = req.file;

	const { fromSenderId, toReceiverId, text, locationData, roomId, roomType } = req.body;

	let gifted_msg;

	let room_id = roomId;

	//init chat message model
	let message_model = new ChatMessage({ _id: new mongoose.Types.ObjectId() });
	message_model.sender = fromSenderId;
	message_model.seenBy.push(fromSenderId);

	//for text message
	if (text && text.trim().length > 0) {
		message_model.message = text;
	}

	//for chat media
	if (chatPicFile) {
		//init media model
		const media_model = new Media({
			_id: new mongoose.Types.ObjectId(),
			type: 'CHAT-PIC',
		});
		//check if it is image
		if (chatPicFile.mimetype.startsWith('image/')) {
			if (chatPicFile.mimetype === 'image/gif') {
				const gif = await sharp(chatPicFile.path).metadata();
				//get gif metadata
				media_model.width = gif.width;
				media_model.height = gif.height;
				media_model.contentType = chatPicFile.mimetype;
				media_model.name = chatPicFile.filename;
			} else {
				const imageName =
					Date.now() + '_compressed_' + chatPicFile.originalname.split('.')[0] + '.jpeg';
				const absolutePath = CHAT_URL + imageName;
				const pic = await sharp(chatPicFile.path)
					.resize()
					.jpeg({ quality: getPhotoQuality(chatPicFile.size) })
					.toFile(absolutePath);
				//get image metadata
				media_model.width = pic.width;
				media_model.height = pic.height;
				media_model.contentType = chatPicFile.mimetype;
				media_model.name = imageName;
				//finally delete original file
				fs.unlink(chatPicFile.path, err => {
					if (err) console.log("Can't delete original file.");
				});
			}

			//finally save media model and push media id to chat model
			const rnMedia = await media_model.save();
			message_model.media = rnMedia._id;
		}
	}

	//for event location
	if (locationData) {
		const location = JSON.parse(locationData);
		if (location) {
			const loc_obj = {
				type: 'Point',
				coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
			};

			message_model.loc = loc_obj;
		}
	}

	try {
		let fromSender = await User.findById(fromSenderId).exec();

		if (roomId) {
			let chatRoom = await ChatRoom.findById(roomId).exec();

			if (chatRoom) {
				room_id = chatRoom._id;
			}
		} else {
			const saved_rooms = await ChatRoom.find({
				participants: { $all: [fromSenderId, toReceiverId] },
			});

			const room_one = saved_rooms[0];

			if (room_one) {
				room_id = room_one._id;
			} else {
				//init room model
				let room_model = new ChatRoom({ _id: new mongoose.Types.ObjectId() });

				room_model.participants.push(fromSenderId);
				room_model.participants.push(toReceiverId);
				room_model.roomType = roomType;

				const saved_room = await room_model.save();

				fromSender.chatRooms.push(saved_room._id);
				await fromSender.save();

				let toReceiver = await User.findById(toReceiverId).exec();

				toReceiver.chatRooms.push(saved_room._id);
				await toReceiver.save();

				room_id = saved_room._id;
			}
		}

		if (room_id) {
			message_model.room = room_id;
			await message_model.save();

			gifted_msg = {
				_id: message_model._id,
				text: message_model.message,
				media: message_model.media,
				location: message_model.loc,
				createdAt: message_model.createdAt,
				user: { _id: fromSender._id, name: fromSender.name },
				meta: { room_id, toReceiverId },
			};
		}

		//emits chat message  to chat_socket subscriber
		chat_socket.emit('chat::created', gifted_msg);

		return res.status(201).send(message_model);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_msgs_of_room = async (req, res) => {
	const { toReceiverId, fromSenderId, roomType, roomId, page } = req.query;

	const skipValue = 10 * (page - 1);
	const limitValue = 10;

	let room_id = roomId;

	let gifted_msgs = [];

	try {
		// have to check with string undefined coz roomId is string undefined in req query
		if (room_id === 'undefined') {
			const saved_rooms = await ChatRoom.find({
				participants: { $all: [toReceiverId, fromSenderId] },
				roomType,
			});

			room_id = saved_rooms && saved_rooms[0] ? saved_rooms[0]._id : 'undefined';
		}

		// same as above
		if (room_id !== 'undefined') {
			let rnMessages = await ChatMessage.find({ room: room_id })
				.populate('sender', 'name')
				.populate('media', 'name contentType')
				.skip(skipValue)
				.limit(limitValue)
				.sort('-createdAt');

			let messages = JSON.parse(JSON.stringify(rnMessages));

			const msg_length = messages.length;

			for (let i = 0; i < msg_length; i++) {
				messages[i] = {
					_id: messages[i]._id,
					text: messages[i].message,
					media: messages[i].media,
					location: messages[i].loc,
					createdAt: messages[i].createdAt,
					user: { _id: messages[i].sender._id, name: messages[i].sender.name },
					meta: { room_id: messages[i].room, toReceiverId },
				};

				gifted_msgs.push(messages[i]);
			}
		}

		return res.status(200).send(gifted_msgs);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.notify_chat = async (req, res) => {
	const { userId, msgId } = req.body;

	try {
		let chat_message = await ChatMessage.findById(msgId).exec();

		if (chat_message) {
			const seen_message = chat_message.seenBy.includes(userId);

			if (!seen_message) {
				chat_message.seenBy.push(userId);
				await chat_message.save();
			}

			return res.status(200).json({ message: 'OK' });
		}

		return res.status(404).json({ message: 'No valid entry found for given id.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_photo = async (req, res) => {};
