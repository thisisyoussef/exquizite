const express = require("express");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Question = require("../models/question");
const generateMCQ = require("../functions/MCQ");
const QuestionCollection = require("../models/questionCollection");


//Create new questions, if a questionCollection id is provided, add the question to the collection
router.post("/questions", auth, jsonParser, async (req, res) => {
    try {
        //Generate MCQ
        const response = await generateMCQ(req.body.prompt, req.body.numQuestions);
        //Create new question
        const question = new Question({
            question: response.question,
            answer: response.answer,
            options: response.options,
            createdBy: req.user._id,
            questionCollection: req.body.questionCollection,
        });
        //Save question
        await question.save();
        //Add question to questionCollection
      
            res.status(201).send(question);
        }
         catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

module.exports = router;

