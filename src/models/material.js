const mongoose = require("mongoose");

//Material Model. Material is a generic term for any content that can be uploaded to the platform. 
//This includes images, videos, audio, and documents.
//Each material object has an owner, a name, a description, an array of files, a topic that its under and a text equivalent to all the information in the files.
//The topic is a reference to a topic object.
const materialSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "File",
        },
    ],
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Topic",
    },
    text: {
        type: String,
        required: false,
        trim: true,
    },
}, {
    timestamps: true,
});

const Material = mongoose.model("Material", materialSchema);

module.exports = Material;
