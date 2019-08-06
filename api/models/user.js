const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        //crendential info
        email: {
            type: String,
            required: true,
            unique: true,
            match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
        },
        password: {
            type: String,
            required: true
        },
        //detail info
        name: {
            type: String,
            required: [true, 'User name is required.']
        },
        phno: String,
        //profile pic info
        profile: { type: Schema.Types.ObjectId, ref: 'Media' },
        isUserActive: { type: Boolean, default: true }, // to check if this account exists or not
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
