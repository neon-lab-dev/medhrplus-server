const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    fileId: {
        type: String,
    },
    name: {
        type: String,
    },
    url: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("Video", videoSchema);