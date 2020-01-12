const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');

const notiSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,

        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },

        createdTo: { type: Schema.Types.ObjectId, ref: 'User' },

        type: String, // REQUEST-TRANSACT,RESPONSE-TRANSACT

        data: String,

        isRead: { type: Boolean, default: false }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Notification', notiSchema);