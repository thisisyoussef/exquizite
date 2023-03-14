const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true,
    },
    answer: {
        type: String,
        required: true,
        trim: true,
    },
    options: [
        {
            type: String,
            required: true,
            trim: true,
        },
    ],
    category: {
        type: String,
        required: false,
        trim: true,
    },
    difficulty: {
        type: String,
        required: false,
        trim: true,
    },
    tags: {
        type: Array,
        required: false,
        trim: true,
    },
    explanation: {
        type: String,
        required: false,
        trim: true,
    },
    image: {
        type: String,
        required: false,
        trim: true,
    },
    video: {
        type: String,
        required: false,
        trim: true,
    },
    audio: {
        type: String,
        required: false,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        ref: "User",
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    questionCollection: {   
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "QuestionCollection",
    },
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;