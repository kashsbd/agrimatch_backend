const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');

const ratingSchema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId },

		fromUser: { type: Schema.Types.ObjectId, ref: 'User' },

		toUser: { type: Schema.Types.ObjectId, ref: 'User' },

		value: Number,

		feedback: String,
	},
	{
		timestamps: true,
	},
);

ratingSchema.index({ fromUser: 1, toUser: 1 });

ratingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Rating', ratingSchema);
