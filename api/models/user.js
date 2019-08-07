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
        userType: String, // may be one of FARMER and MIDDLEMAN
        name: String,
        phno: String,
        //profile pic info
        profile: { type: Schema.Types.ObjectId, ref: 'Media' },
        //GPA Cert No: only save if userType is FARMER
        gpaCertNo: String,
        gpaCertPic: { type: Schema.Types.ObjectId, ref: 'Media' },
        //other info
        isUserActive: { type: Boolean, default: true }, // to check if this account exists or not
        //location of user
        lat: String,
        lng: String
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
