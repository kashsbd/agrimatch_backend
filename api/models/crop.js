const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');

const cropSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId },

        user: { type: Schema.Types.ObjectId, ref: 'User' },

        cropType: String,

        quantity: String,

        isAvailable: { type: Boolean, default: true }, // is available to users or not

        media: { type: Schema.Types.ObjectId, ref: 'Media' },
    },
    {
        timestamps: true,
    }
);

cropSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Crop', cropSchema);;
