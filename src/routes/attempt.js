const express = require("express");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Assessment = require("../models/assessment");
const Attempt = require("../models/attempt");

//function that sets up a new attempt by taking in an assessment id and adding questions from the assessment to the attempt, returns the attempt
const setupAttempt = async (assessmentId, userId) => {
    //Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    //populate the questions array in the assessment
    await assessment.populate("questions");
    //Create a placeholder for the questions array to be added to the attempt, it will be an array of objects
    const questions = [];
    //Add the questions from the assessment to the placeholder questions array, loop through each question and add a new object to the questions array, with question set to the question id and correctAnswer set to the answer
        for (let i = 0; i < assessment.questions.length; i++) {
            questions.push({
                questionId: assessment.questions[i]._id,
                correctAnswer: assessment.questions[i].answer,
                question: assessment.questions[i].question,
            });
        }
    //Create a new attempt
    const attempt = new Attempt({
        assessment: assessment._id,
    //Add the questions from the assessment to the attempt, loop through each question and add a new object to the questions array, with question set to the question id and correctAnswer set to the answer
    questions: questions,
        user: userId,
    });

    //Set the max score
    attempt.maxScore = assessment.questions.length;
    //Save the attempt
    await attempt.save();
    //Return the attempt
    return attempt;
};


//function that takes in an attempt and updates the attempt with the answers, correct value of each question, and the score
const gradeAttempt = (attempt) => {
    //Grade the attempt
    for (let i = 0; i < attempt.questions.length; i++) {
        if (attempt.questions[i].answer === attempt.questions[i].correctAnswer) {
            attempt.questions[i].correct = true;
            attempt.score++;
        }
    }
    //Set the attempt to submitted
    attempt.submitted = true;
    //set time completed
    attempt.completedAt = Date.now();
    //Save the attempt
    attempt.save();
};

//Create a new attempt connected to the user and assessment
router.post("/attempts/:assessmentId", auth, jsonParser, async (req, res) => {
    try {
        //Find the user
        const user = await User.findById(req.user._id);
        //Find the assessment
        const assessment = await Assessment.findById(req.params.assessmentId);
        //Check if assessment exists
        if (!assessment) {
            return res.status(404).send();
        }
        //TODO: Check if the user is about to surpass the maxAttempts
        //Create a new attempt
        const attempt = await setupAttempt(req.params.assessmentId, req.user._id);
        //Send the attempt
        res.status(201).send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Get all attempts for a user
router.get("/attempts", auth, async (req, res) => {
    try {
        //Find all attempts for the user
        const attempts = await Attempt.find({user: req.user._id});
        //Send the attempts
        res.status(200).send(attempts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Get all attempts for an assessment
router.get("/attempts/:assessmentId", auth, async (req, res) => {
    try {
        //Find all attempts for the assessment
        const attempts = await Attempt.find({assessment: req.params.assessmentId});
        //Send the attempts
        res.status(200).send(attempts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Get an attempt by id
router.get("/attempt/:id", auth, async (req, res) => {
    try {
        //Find the attempt
        const attempt = await Attempt.findById(req.params.id);
        //If the attempt is not found, send error
        if (!attempt) {
            return res.status(404).send();
        }
        //Send the attempt
        res.status(200).send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Update an attempt by id, given a 2d array with the first element being the question id and the second element being the answer
router.patch("/attempt/:id", auth, jsonParser, async (req, res) => {
    try {
        //Find the attempt
        const attempt = await Attempt.findById(req.params.id);
        //If the attempt is not found, send error
        if (!attempt) {
            return res.status(404).send("Attempt not found");
        }
        //Update the attempt
        for (let i = 0; i < req.body.length; i++) {
            //Find the question in the attempt, the question is in the array of "questions" within the attempt with the question field
            const question = attempt.questions.find((question) => {
                return question.questionId == req.body[i][0];
            });
            
            //If the question is not found, send error
            if (!question) {
                return res.status(404).send("Question with id" + req.body[i][0] + " not found");
             }
            // //populate the assessment inside
            // //If the question is not in the assessment, send error
            // if (!attempt.assessment.questions.includes(question._id)) {
            //     return res.status(404).send("Question not in assessment");
            // }
            //Update the answer in the attempt
            question.answer = req.body[i][1];
        }
        //Save the attempt
        await attempt.save();
        //Send the attempt
        res.status(200).send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Example body of patch request in json format
// [
//     ["5f9b3b3b1c9d440000a3b0b1", "A"],
//     ["5f9b3b3b1c9d440000a3b0b2", "B"],
//     ["5f9b3b3b1c9d440000a3b0b3", "C"],
// }

/* Example for these questions:
 {
            "questionId": "648afe7b26323a80c50b12ab",
            "question": "What is the purpose of the Redis client for Dart?",
            "answer": "",
            "correctAnswer": "To quickly and easily serialize and deserialize the Redis protocol",
            "correct": false,
            "_id": "6498c115c4a8746db1917e35"
        },
        {
            "questionId": "648afe7b26323a80c50b12ad",
            "question": "Which data types can be sent with the Redis protocol?",
            "answer": "",
            "correctAnswer": "String, Integer, Array, Error, Bulk",
            "correct": false,
            "_id": "6498c115c4a8746db1917e36"
        },
        {
            "questionId": "648afe7b26323a80c50b12af",
            "question": "What does the 'pipe_start' and 'pipe_end' functions do?",
            "answer": "",
            "correctAnswer": "Enables and disables the Nagle's algorithm on the socket",
            "correct": false,
            "_id": "6498c115c4a8746db1917e37"
        },
        {
            "questionId": "648afe7b26323a80c50b12b1",
            "question": "What is the purpose of class Transaction?",
            "answer": "",
            "correctAnswer": "To check the result of each command executed during a transaction",
            "correct": false,
            "_id": "6498c115c4a8746db1917e38"
        },
        {
            "questionId": "648afe7b26323a80c50b12b3",
            "question": "What is the CAS pattern?",
            "answer": "",
            "correctAnswer": "A way of executing commands without waiting for the previous command to complete",
            "correct": false,
            "_id": "6498c115c4a8746db1917e39"
        },
        {
            "questionId": "648afe7b26323a80c50b12b5",
            "question": "What is the purpose of TLS?",
            "answer": "",
            "correctAnswer": "To securely send and receive data over a network",
            "correct": false,
            "_id": "6498c115c4a8746db1917e3a"
        },
        {
            "questionId": "648afe7b26323a80c50b12b7",
            "question": "What is the purpose of UTF8 encoding?",
            "answer": "",
            "correctAnswer": "To convert strings from Dart to Redis",
            "correct": false,
            "_id": "6498c115c4a8746db1917e3b"
        },
        {
            "questionId": "648afe7b26323a80c50b12b9",
            "question": "What is the purpose of the EVAL command?",
            "answer": "",
            "correctAnswer": "To execute arbitrary Redis commands",
            "correct": false,
            "_id": "6498c115c4a8746db1917e3c"
        },
        {
            "questionId": "648afe7b26323a80c50b12bb",
            "question": "What is the maximum number of operations that can be executed per second?",
            "answer": "",
            "correctAnswer": "180K",
            "correct": false,
            "_id": "6498c115c4a8746db1917e3d"
        },
        {
            "questionId": "648afe7b26323a80c50b12bd",
            "question": "What is the purpose of the MULTI command?",
            "answer": "",
            "correctAnswer": "To start a transaction",
            "correct": false,
            "_id": "6498c115c4a8746db1917e3e"
        },

        The example input to update this is:
        [
            ["648afe7b26323a80c50b12ab", "To quickly and easily serialize and deserialize the Redis protocol"],
            ["648afe7b26323a80c50b12ad", "String, Integer, Array, Error, Bulk"],
            ["648afe7b26323a80c50b12af", "Enables and disables the Nagle's algorithm on the socket"],
            ["648afe7b26323a80c50b12b1", "To check the result of each command executed during a transaction"],
            ["648afe7b26323a80c50b12b3", "A way of executing commands without waiting for the previous command to complete"],
            ["648afe7b26323a80c50b12b5", "To securely send and receive data over a network"],
            ["648afe7b26323a80c50b12b7", "To convert strings from Dart to Redis"],
            ["648afe7b26323a80c50b12b9", "To execute arbitrary Redis commands"],
            ["648afe7b26323a80c50b12bb", "180K"],
            ["648afe7b26323a80c50b12bd", "To start a transaction"]
        ]
*/


//Submit an attempt by id
router.patch("/attempt/:id/submit", auth, jsonParser, async (req, res) => {
    try {
        //Find the attempt
        const attempt = await Attempt.findById(req.params.id);
        //If the attempt is not found, send error
        if (!attempt) {
            return res.status(404).send();
        }
        //If the attempt is already submitted, send error
        if (attempt.submitted) {
            //return res.status(400).send( "Attempt already submitted");
        }
        console.log("submitting attempt");
        //Update the questions
        console.log(req.body);
        for (let i = 0; i < req.body.length; i++) {
            console.log("updating question");
            //Find the question
            const question = attempt.questions.find((question) => {
                return question.questionId == req.body[i][0];
            });            //If the question is not found, send error
            if (!question) {
                return res.status(404).send();
            }
            //Update the answer
            question.answer = req.body[i][1];
            //Update the correct value
        }
        console.log("grading attempt");

        //Grade the attempt
        gradeAttempt(attempt);
        //Send the attempt
        res.status(200).send(attempt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;