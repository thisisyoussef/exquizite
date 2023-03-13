const express = require("express");
const QuestionCollection = require("../models/questionCollection");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");

//Create a Question Collection
router.post("/questionCollection", auth, jsonParser, async (req, res) => 
{
    // Create a new question collection using the data from the request body
    const questionCollection = new QuestionCollection(req.body);
    try {
        //Add the owner to the question collection
        questionCollection.createdBy = req.user._id;
        // Save the question collection in the database
        await questionCollection.save();
        // Send the question collection back to the client
        res.status(201).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(400).json({ error });
    }
});

//Example of a request body:
/*
{
    "name": "Test Collection",
    "description": "This is a test collection",
    "questions": xxx,
    "owner": xxx
}
*/

module.exports = router;
