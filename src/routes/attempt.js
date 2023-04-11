const express = require("express");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Assessment = require("../models/assessment");
const Attempt = require("../models/attempt");

//Create a new attempt, make sure the user has not surpassed the maximum number of attempts. Populate the attempt with the questions from the assessment
router.post("/attempts", auth, jsonParser, async (req, res) => {
    try {
        const attempt = new Attempt({
        assessment: req.body.assessment,
        createdBy: req.user._id,
    });
    //Find the assessment
    const assessment = Assessment.findById(req.body.assessment);
    //If the assessment is not found, send error
    if (!assessment) {
        return res.status(404).send();
    }
    //Find the user
    const user = User.findById(req.user._id);
    //Find the number of attempts the user has made on the assessment
    const numberOfAttempts = await Attempt.countDocuments({assessment: req.body.assessment, createdBy: req.user._id});
    //If the user has not surpassed the maximum number of attempts, create the attempt
    if (numberOfAttempts < assessment.maxAttempts) {
        //Populate the attempt with the questions from the assessment, make sure to populate the "correctAnswer" field
        for (let i = 0; i < assessment.questions.length; i++) 
        {
            assessment.populate("questions");
            //for each question, add the question to the attempt inside the "questions" array in the question object
            attempt.questions.push({
                question: assessment.questions[i]._id,
                correctAnswer: assessment.questions[i].answer,
            });
        }
    } else {
        //If the user has surpassed the maximum number of attempts, send error
        return res.status(401).send({"message":"You have exceeded the maximum number of attempts"});
    }
    //Save the attempt
    await attempt.save();
    res.status(201).send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


//Add answers to an attempt, submit the attempt, and grade the attempt
router.patch("/attempts/submit/:attemptId", auth, jsonParser, async (req, res) => {
    try{
        //Find the attempt
        const attempt = await Attempt.findById(req.params.attemptId);
        //If the attempt is not found, send error
        if (!attempt) {
            return res.status(404).send();
        }
        //Check that the attempt is not submitted
        if (attempt.submitted) {
            return res.status(401).send({"message":"You cannot add answers to a submitted attempt"});
        }
        //Push the answers to the attempt, the answers are in the form of an array of objects with the question id and the answer
        for (let i = 0; i < req.body.length; i++) {
            //Find the question in the attempt
            const question = attempt.questions.find((question) => question.question.toString() === req.body[i].question);
            //If the question is found, add the answer to the question
            if (question) {
                question.answer = req.body[i].answer;
            }
    }
    //Set the attempt to submitted
    attempt.submitted = true;
    //Grade the attempt
    for (let i = 0; i < attempt.questions.length; i++) {
        if (attempt.questions[i].answer === attempt.questions[i].correctAnswer) {
            attempt.questions[i].correct = true;
            attempt.score++;
        }
    }
    //Save the attempt
    await attempt.save();
    //Return the attempt
    res.send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Get all attempts for a user
router.get("/attempts", auth, async (req, res) => {
    try {
        //Find all attempts for the user
        const attempts = await Attempt.find({createdBy: req.user._id});
        //If the user has no attempts, send error
        if (!attempts) {
            return res.status(404).send();
        }
        //Return the attempts
        res.send(attempts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Get all attempts for an assessment
router.get("/attempts/:assessmentId", auth, async (req, res) => {
    try {
        //Find all attempts for the assessment
        const attempts = await Attempt.find({assessment: req.params.assessmentId});
        //If the assessment has no attempts, send error
        if (!attempts) {
            return res.status(404).send();
        }
        //Return the attempts
        res.send(attempts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;