const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		_id: Schema.Types.ObjectId,
		//crendential info
		email: String,
		phno: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		//detail info
		userType: String, // may be one of FARMER and MIDDLEMAN
		name: String,
		//profile pic info
		profile: { type: Schema.Types.ObjectId, ref: 'Media' },
		//GPA Cert No: only save if userType is FARMER
		gpaCertNo: String,
		gpaCertPic: { type: Schema.Types.ObjectId, ref: 'Media' },
		//other info
		isUserActive: { type: Boolean, default: true }, // to check if this account exists or not

		//for rating
		rateCount: { type: Number, default: 0 },
		totalRateValue: { type: Number, default: 0 },

		//for chatting
		chatRooms: [{ type: Schema.Types.ObjectId, ref: 'ChatRoom' }],

	},
	{
		timestamps: true,
	},
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
