const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');

const ChatRoom = require('../models/chatroom');
const ChatMessage = require('../models/message');
const Media = require('../models/media');
const User = require('../models/user');

const { CHAT_URL, SERVER_URL } = require('../config/config');
const { getPhotoQuality } = require('../utils/calculate-photo-quality');

exports.save_chat = async (req, res) => {
	const chat_socket = req.chat_socket;

	const chatMediaFile = req.file;

	const { fromSenderId, toReceiverId, text, locationData, roomId, roomType } = req.body;

	let gifted_msg = {};

	let room_id = roomId;

	//init chat message model
	let message_model = new ChatMessage({ _id: new mongoose.Types.ObjectId() });
	message_model.sender = fromSenderId;
	message_model.seenBy.push(fromSenderId);

	//for text message
	if (text && text.trim().length > 0) {
		message_model.message = text;

		gifted_msg['text'] = text;
	}

	//for chat media
	if (chatMediaFile) {
		//init media model
		const media_model = new Media({
			_id: new mongoose.Types.ObjectId(),
		});
		//check if it is image
		if (chatMediaFile.mimetype.startsWith('image/')) {
			if (chatMediaFile.mimetype === 'image/gif') {
				const gif = await sharp(chatMediaFile.path).metadata();
				//get gif metadata
				media_model.width = gif.width;
				media_model.height = gif.height;
				media_model.contentType = chatMediaFile.mimetype;
				media_model.name = chatMediaFile.filename;
			} else {
				const imageName =
					Date.now() + '_compressed_' + chatMediaFile.originalname.split('.')[0] + '.jpeg';
				const absolutePath = CHAT_URL + imageName;
				const pic = await sharp(chatMediaFile.path)
					.resize()
					.jpeg({ quality: getPhotoQuality(chatMediaFile.size) })
					.toFile(absolutePath);
				//get image metadata
				media_model.width = pic.width;
				media_model.height = pic.height;
				media_model.contentType = chatMediaFile.mimetype;
				media_model.name = imageName;
				//finally delete original file
				fs.unlink(chatMediaFile.path, err => {
					if (err) console.log("Can't delete original file.");
				});
			}

			//finally save media model and push media id to chat model
			const rnMedia = await media_model.save();
			message_model.media = rnMedia._id;

			gifted_msg['image'] = SERVER_URL + 'chats/media/' + rnMedia._id + '/pic';
		} else if (chatMediaFile.mimetype.startsWith('audio/')) {
			const audioName = Date.now() + '-' + chatMediaFile.originalname.split('.')[0] + '.3gp';

			//get audio metadata
			media_model.width = undefined;
			media_model.height = undefined;
			media_model.contentType = chatMediaFile.mimetype;
			media_model.name = audioName;

			const rnMedia = await media_model.save();
			message_model.media = rnMedia._id;

			gifted_msg['audio'] = SERVER_URL + 'chats/media/' + rnMedia._id + '/audio';
		}
	}

	//for event location
	if (locationData) {
		const location = JSON.parse(locationData);

		if (location) {
			const lng = parseFloat(location.longitude);
			const lat = parseFloat(location.latitude);

			const loc_obj = {
				type: 'Point',
				coordinates: [lng, lat],
			};

			message_model.loc = loc_obj;

			gifted_msg['location'] = { latitude: lat, longitude: lng };
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
			const { _id, createdAt } = await message_model.save();

			gifted_msg['_id'] = _id;
			gifted_msg['createdAt'] = createdAt;
			gifted_msg['user'] = { _id: fromSender._id, name: fromSender.name };
			gifted_msg['meta'] = { room_id, toReceiverId };
		}

		//emits chat message  to chat_socket subscriber
		chat_socket.emit('chat::created', gifted_msg);

		return res.status(201).send(gifted_msg);
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
				const { _id, message, media, loc, createdAt, sender, room } = messages[i];

				messages[i] = {
					_id,
					createdAt,
					user: {
						_id: sender._id,
						name: sender.name,
					},
					meta: { room_id: room, toReceiverId },
				};

				if (message) {
					messages[i]['text'] = message;
				}

				if (media) {
					if (media.contentType.startsWith('image/')) {
						messages[i]['image'] = SERVER_URL + 'chats/media/' + media._id + '/pic';
					} else if (media.contentType.startsWith('audio/')) {
						messages[i]['audio'] = SERVER_URL + 'chats/media/' + media._id + '/audio';
					}
				}

				if (loc) {
					const coords = loc.coordinates;

					messages[i]['location'] = { latitude: coords[1], longitude: coords[0] };
				}

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

exports.get_photo = async (req, res) => {
	const mediaId = req.params.id;

	try {
		const media = await Media.findById(mediaId).exec();

		if (media) {
			const mediaUrl = CHAT_URL + media.name;

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
		return res.status(500).send(error);
	}
};
