const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');

const chatRoomSchema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId },

		roomType: String, // may be one of SINGLE, GROUP

		participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

		roomName: String,
	},
	{
		timestamps: true,
	},
);

chatRoomSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
