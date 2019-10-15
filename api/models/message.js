const GeoJSON = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');
const ChatRoom = require('./chatroom');

const messageSchema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId },

		room: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },

		sender: { type: Schema.Types.ObjectId, ref: 'User' },

		message: String,

		media: { type: Schema.Types.ObjectId, ref: 'Media' },

		loc: { type: Schema.Types.Point },

		seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	},
	{
		timestamps: true,
	},
);

messageSchema.index({ loc: '2dsphere' });

messageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Message', messageSchema);
