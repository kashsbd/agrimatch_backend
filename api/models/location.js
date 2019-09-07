const GeoJSON = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');

const locationSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId },

        user: { type: Schema.Types.ObjectId, ref: 'User' },

        chatType: String, // may be one of SINGLE, GROUP

        location: { type: Schema.Types.Point }
    },
    {
        timestamps: true,
    }
);

locationSchema.index({ location: "2dsphere" });

locationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Location', locationSchema);;
