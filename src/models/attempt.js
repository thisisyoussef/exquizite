const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Assessment",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    questions: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Question",
            },
            answer: {
                type: String,
                required: false,
                trim: true,
                default: "",
            },
            correctAnswer: {
                type: String,
                required: true,
                trim: true,
            },
            correct: {
                type: Boolean,
                required: true,
                default: false,
            },
        },
    ],
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
    timeTaken: {
        type: Number,
        required: false,
        default: 0,
    },
    score: {
        type: Number,
        required: true,
        default: 0,
    },
    maxScore: {
        type: Number,
        required: true,
        default: 0,
    },
    language: {
        type: String,
        enum: ["en", "es"],
        required: true,
        default: "en",
    },
    submitted: {
        type: Boolean,
        required: true,
        default: false,
    },
});

const Attempt = mongoose.model("Attempt", attemptSchema);