const mongoose = require("mongoose");
const Assessment = require("./assessment");

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
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Question",
            },
            question: {
                type: String,
                required: true,
                trim: true,
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
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: {
        type: Date,
        required: false,
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

attemptSchema.pre("save", async function (next) {
    const attempt = this;
    attempt.updatedAt = Date.now();
    //add questions from the assessment to the attempt
    if (!attempt.questions.length) {
        //find the assessment
        const assessment = Assessment.findById(attempt.assessment);
        //add the questions from the assessment to the attempt, loop through each question and add a new object to the questions array, with question set to the question id and correctAnswer set to the answer
        assessment.questions.forEach((question) => {
            attempt.questions.push({
                questionId: question._id,
                correctAnswer: question.answer,
            });
        }
        );
    }
    //if submitted is set to true, set the correct value for each questions if the answer is equal to the correctAnswer
    if (attempt.submitted) {
        attempt.questions.forEach((question) => {
            question.correct = question.answer === question.correctAnswer;
        });
    }
    //set the score to the number of correct answers in the questions array
    attempt.score = attempt.questions.filter((question) => question.correct).length;
    //set the maxScore to the number of questions in the questions array
    attempt.maxScore = attempt.questions.length;
    //Set the completedAt to the current time if the submitted flag is set
    if (attempt.submitted) {
        attempt.completedAt = Date.now();
    }
    //set the timeTaken to the difference between the startedAt and completedAt, account for completedAt not being set
    attempt.timeTaken = attempt.completedAt ? attempt.completedAt - attempt.startedAt : 0;
    next();
});

//When turning attempt to json, do all of the operations in the pre save
attemptSchema.methods.toJSON = function () {
    const attempt = this;
    const attemptObject = attempt.toObject();
    attemptObject.questions.forEach((question) => {
        question.correct = question.answer === question.correctAnswer;
    });
    attemptObject.score = attemptObject.questions.filter((question) => question.correct).length;
    attemptObject.maxScore = attemptObject.questions.length;
    attemptObject.timeTaken = attemptObject.completedAt ? attemptObject.completedAt - attemptObject.startedAt : 0;
    //Convert timeTaken to minutes
    attemptObject.timeTaken = attemptObject.timeTaken / 60000;
    return attemptObject;
};

const Attempt = mongoose.model("Attempt", attemptSchema);

module.exports = Attempt;