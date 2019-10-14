const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');

const chatRoomSchema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId },

		owner: { type: Schema.Types.ObjectId, ref: 'User' },

		roomType: String,

		participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	},
	{
		timestamps: true,
	},
);

chatRoomSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
