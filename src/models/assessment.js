const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    createdAt : {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt : {
        type: Date,
        required: true,
        default: Date.now,
    },
    subject : {
        type: String,
        required: false,
        trim: true,
        //enum: ["math", "science", "english", "history", "other"],
    },
    difficulty : {
        type: String,
        required: false,
        trim: true,
        enum: ["easy", "medium", "hard"],
    },
    tags : [
        {
            type: String,
            required: false,
            trim: true,
        },
    ],
    isPublic : {
        type: Boolean,
        required: false,
        default: true,
    },
    sharedWith : [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User",
        },
    ],
    language : {
        type: String,
        enum : ["en", "es"],
        required: true,
        default: "en",
    },
    questions : [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Question",
        },
    ],
    attempts : [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Attempt",
        },
    ],
    maxAttempts : {
        type: Number,
        required: false,
        default: 1,
    },
    topic : {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Topic",
    },
});

//populate materials


const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;

