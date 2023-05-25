const express = require("express");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Assessment = require("../models/assessment");
const Question = require("../models/question");

//Create a new assessment
router.post("/assessments", auth, jsonParser, async (req, res) => {
    try {
        //Create a new assessment
        const assessment = new Assessment({
            name: req.body.name,
            createdBy: req.user._id,
        });
        //Save the assessment
        await assessment.save();
        //Return the assessment
        res.status(201).send(assessment);
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Add questions to an assessment
router.patch("/assessments/addQuestions/:assessmentId", auth, jsonParser, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send();
        }
        //If the user is the owner of the assessment, add the questions to the assessment
        if (assessment.createdBy.toString() === req.user._id.toString()) {
            //Find all questions via id
            const questions = await Question.find({_id: {$in: req.body.questions}});
            //Add the questions to the assessment make sure there are no duplicates by checking if the question is already in the assessment
            for (let i = 0; i < questions.length; i++) {
                if (!assessment.questions.includes(questions[i]._id)) {
                    assessment.questions.push(questions[i]._id);
                }
            }
            //Save the assessment
            await assessment.save();
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment, send error
            res.status(401).send({"message":"You are not authorized to add questions to this assessment"});
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Remove questions from an assessment
router.patch("/assessments/removeQuestions/:assessmentId", auth, jsonParser, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send();
        }
        //If the user is the owner of the assessment, remove the questions from the assessment
        if (assessment.createdBy.toString() === req.user._id.toString()) {
            //Remove the questions from the assessment
            assessment.questions = assessment.questions.filter(question => !req.body.questions.includes(question.toString()));
            //Save the assessment
            await assessment.save();
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment, send error
            res.status(401).send({"message":"You are not authorized to remove questions from this assessment"});
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Get all assessments created by the user or shared with the user or public
router.get("/assessments", auth, async (req, res) => {
    try {
        //Find all assessments created by the user or shared with the user or public
        const assessments = await Assessment.find({$or: [{createdBy: req.user._id}, {sharedWith: req.user._id}, {isPublic: true}]});
        //Return the assessments
        res.send(assessments);
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Get an assessment by id, make sure the user is the owner of the assessment or the assessment is public or the user is shared with the assessment
router.get("/assessments/:assessmentId", auth, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send();
        }
        //If the user is the owner of the assessment or the assessment is public or the user is shared with the assessment, return the assessment
        if (assessment.createdBy.toString() === req.user._id.toString() || assessment.isPublic || assessment.sharedWith.includes(req.user._id)) {
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment or the assessment is not public or the user is not shared with the assessment, send error
            res.status(401).send();
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Update an assessment by id, make sure the user is the owner of the assessment
router.patch("/assessments/:assessmentId", auth, jsonParser, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send();
        }
        //Set allowed updates
        const allowedUpdates = ["name", "description", "category", "difficulty", "tags", "isPublic", "sharedWith", "language"];
        //Get the updates
        const updates = Object.keys(req.body);
        //Check if the updates are allowed
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        //If the updates are not allowed, send error
        if (!isValidOperation) {
            return res.status(400).send({error: "Invalid updates!"});
        }
        //If the user is the owner of the assessment, update the assessment
        if (assessment.createdBy.toString() === req.user._id.toString()) {
            //Update the assessment
            assessment.name = req.body.name;
            assessment.description = req.body.description;
            assessment.category = req.body.category;
            assessment.difficulty = req.body.difficulty;
            assessment.tags = req.body.tags;
            assessment.isPublic = req.body.isPublic;
            assessment.sharedWith = req.body.sharedWith;
            assessment.language = req.body.language;
            //Save the assessment
            await assessment.save();
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment, send error
            res.status(401).send();
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Delete an assessment by id, make sure the user is the owner of the assessment
router.delete("/assessments/:assessmentId", auth, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send({"error": "Assessment not found"});
        }
        //If the user is the owner of the assessment, delete the assessment
        if (assessment.createdBy.toString() === req.user._id.toString()) {
            //Delete the assessment
            await assessment.deleteOne();
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment, send error
            res.status(401).send();
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Get all assessments shared with the user
router.get("/sharedAssessments", auth, async (req, res) => {
    try {
        //Find all assessments shared with the user
        const assessments = await Assessment.find({sharedWith: req.user._id});
        //Return the assessments
        res.send(assessments);
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Share an assessment with a user
router.post("/assessments/share/:assessmentId/:userId", auth, jsonParser, async (req, res) => {
    try {
        //Find the assessment by id
        const assessment = await Assessment.findById(req.params.assessmentId);
        //If the assessment is not found, send error
        if (!assessment) {
            return res.status(404).send({"error": "Assessment not found"});
        }
        //Find the user by id
        const user = await User.findById(req.params.userId);
        //If the user is not found, send error
        if (!user) {
            return res.status(404).send({"error": "User not found"});
        }
        //If the user is the owner of the assessment, share the assessment with the user
        if (assessment.createdBy.toString() === req.user._id.toString()) {
            //Share the assessment with the user
            assessment.sharedWith.push(user._id);
            //Save the assessment
            await assessment.save();
            //Return the assessment
            res.send(assessment);
        } else {
            //If the user is not the owner of the assessment, send error
            res.status(401).send();
        }
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});

//Get all assessments created by the user
router.get("/myAssessments", auth, async (req, res) => {
    try {
        //Find all assessments created by the user
        const assessments = await Assessment.find({createdBy: req.user._id});
        //Return the assessments
        res.send(assessments);
    } catch (error) {
        //If error, send error
        res.status(500).send(error.message);
    }
});


module.exports = router;