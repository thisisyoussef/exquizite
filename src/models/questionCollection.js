const mongoose = require("mongoose");

const questionCollectionSchema = new mongoose.Schema({
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
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Question",
        },
    ],
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
    category : {
        type: String,
        required: false,
        trim: true,
    },
    difficulty : {
        type: String,
        required: false,
        trim: true,
    },
    tags : [
        {
            type: String,
            required: false,
            trim: true,
        },
    ],
});

const QuestionCollection = mongoose.model("QuestionCollection", questionCollectionSchema);

module.exports = QuestionCollection;