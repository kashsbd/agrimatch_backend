const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');

const ratingSchema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId },

		fromUser: { type: Schema.Types.ObjectId, ref: 'User' },

		toUser: { type: Schema.Types.ObjectId, ref: 'User' },

		value: Number,

		feedback: String,

		feedbackAudio: { type: Schema.Types.ObjectId, ref: 'Media' },

		status: { type: String, default: 'PENDING' },
	},
	{
		timestamps: true,
	},
);

ratingSchema.index({ fromUser: 1, toUser: 1 });

ratingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Rating', ratingSchema);
