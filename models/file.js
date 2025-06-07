const mongoose = require("mongoose");
exports.FileSchema = new mongoose.Schema({
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
    thumbnailUrl: {
        type: String,
    },
});