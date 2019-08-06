const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const User = require('./user');
const Media = require('./media');

const postSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId },
        postType: String,//may be one of PUBLIC,ONLY_ME,FOLLOWER
        postOwnerType: String,
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        isAvailable: { type: Boolean, default: true }, // is available to users or not
        status: { type: String, es_indexed: true, es_boost: 2.0 },
        media: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    },
    {
        timestamps: true,
    }
);

postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', postSchema);;
