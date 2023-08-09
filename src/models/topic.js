const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
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
        enum : ["math", "science", "english", "history", "art", "music", "language", "other"],
        toLowerCase: true,
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
    isPublic : {
        type: Boolean,
        required: true,
        default: false,
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
        required: false,
        trim: true,
    },
});

//Maintain order of fields in the JSON response
topicSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

//populate questions
topicSchema.virtual("questions", {
    ref: "Question",
    localField: "_id",
    foreignField: "topic",
});

//populate materials
topicSchema.virtual("materials", {
    ref: "Material",
    localField: "_id",
    foreignField: "topic",
});

//populate assessments
topicSchema.virtual("assessments", {
    ref: "Assessment",
    localField: "_id",
    foreignField: "topic",
});


const Topic = mongoose.model("Topic", topicSchema);

module.exports = Topic;