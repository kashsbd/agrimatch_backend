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

	const { fromOwnerId, toOwnerId, text, locationData, conversationId } = req.body;

	let gifted_msg;

	//init chat message model
	const message_model = new ChatMessage({ _id: new mongoose.Types.ObjectId() });
	message_model.sender = fromOwnerId;
	message_model.seenBy.push(fromOwnerId);

	//for text message
	if (text && text.trim().length > 0) {
		message_model.text = text;
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
		const chatMessage = await message_model.save();

		let fromOwner = await Owner.findById(fromOwnerId).exec();

		if (conversationId) {
			let conversation = await Conversation.findById(conversationId).exec();

			if (conversation) {
				conversation.messages.push(chatMessage._id);
				await conversation.save();

				gifted_msg = {
					_id: message_model._id,
					text: message_model.text,
					createdAt: message_model.createdAt,
					user: { _id: fromOwner._id, name: fromOwner.firstName + ' ' + fromOwner.lastName },
					meta: { conversation_id: conversationId, toOwnerId },
				};
			}
		} else {
			const saved_conversations = await Conversation.find({
				participants: { $all: [fromOwnerId, toOwnerId] },
			});
			let conver = saved_conversations[0];

			if (conver) {
				conver.messages.push(chatMessage._id);
				await conver.save();

				gifted_msg = {
					_id: message_model._id,
					text: message_model.text,
					createdAt: message_model.createdAt,
					user: { _id: fromOwner._id, name: fromOwner.firstName + ' ' + fromOwner.lastName },
					meta: { conversation_id: conver._id, toOwnerId },
				};
			} else {
				//init conversation model
				let conversation_model = new Conversation({ _id: new mongoose.Types.ObjectId() });

				conversation_model.participants.push(fromOwnerId);
				conversation_model.participants.push(toOwnerId);
				conversation_model.messages.push(chatMessage._id);

				const conversation = await conversation_model.save();

				fromOwner.conversations.push(conversation._id);
				await fromOwner.save();

				let toOwner = await Owner.findById(toOwnerId).exec();

				toOwner.conversations.push(conversation._id);
				await toOwner.save();

				gifted_msg = {
					_id: message_model._id,
					text: message_model.text,
					createdAt: message_model.createdAt,
					user: { _id: fromOwner._id, name: fromOwner.firstName + ' ' + fromOwner.lastName },
					meta: { conversation_id: conversation._id, toOwnerId },
				};
			}
		}

		//emits chat message  to chat_socket subscriber
		chat_socket.emit('chat::created', gifted_msg);

		return res.status(201).send(message_model);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_all_messages = async (req, res) => {
	const { userId } = req.query;

	const options = {
		sort: { createdAt: -1 },
		populate: [{ path: 'chatRooms', select: 'roomType participants' }],
	};

	try {
		const user = await User.findById(userId, 'chatRooms', options).exec();

		if (user) {
			const rooms = user.chatRooms;
			const roomsLength = rooms.length;

			if (roomsLength > 0) {
				for (let i = 0; i < roomsLength; i++) {
					console.length(rooms[i]);
				}
			}
		}

		return res.status(200).json({ users });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_messages = async (req, res) => {
	const { conId, toOwnerId, fromOwnerId } = req.body;

	const page = req.query.page || 1;

	let options = {
		sort: { createdAt: -1 },
		select: '-__v',
		populate: [{ path: 'user', select: 'firstName lastName' }],
		page: page,
	};

	let conversation;

	try {
		if (conId) {
			conversation = await Conversation.findById(conId);
		} else {
			const saved_conversations = await Conversation.find({
				participants: { $all: [toOwnerId, fromOwnerId] },
			});
			conversation = saved_conversations[0];
		}

		if (conversation) {
			const message_ids = conversation.messages;
			let rnMessages = await ChatMessage.paginate({ _id: { $in: message_ids } }, options);

			let messages = JSON.parse(JSON.stringify(rnMessages));

			for (let i = 0; i < messages.docs.length; i++) {
				messages.docs[i].user = {
					_id: messages.docs[i].user._id,
					name: messages.docs[i].user.firstName + ' ' + messages.docs[i].user.lastName,
				};
			}

			return res.status(200).send(messages);
		}

		return res.status(404).json({ message: 'No valid entry found for given conversation id.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};

exports.get_photo = async (req, res) => {};
