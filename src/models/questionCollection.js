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
questionCollectionSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

//populate questions
questionCollectionSchema.virtual("question", {
    ref: "Question",
    localField: "_id",
    foreignField: "questionCollection",
});


const QuestionCollection = mongoose.model("QuestionCollection", questionCollectionSchema);

module.exports = QuestionCollection;