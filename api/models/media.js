const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mediaSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        width: Number,
        height: Number,
        name: String,
        contentType: String
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Media', mediaSchema);