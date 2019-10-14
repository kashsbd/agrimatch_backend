const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const readFilePromise = require('fs-readfile-promise');

const ChatRoom = require('../models/chatroom');
const Media = require('../models/media');

const { CHAT_URL } = require('../config/config');

exports.get_all_chats = async (req, res) => {
	const { userType } = req.query;

	try {
		const users = await User.find({ userType }).exec();

		return res.status(200).json({ user_count: users.length });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error });
	}
};
