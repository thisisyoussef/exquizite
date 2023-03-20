const express = require("express");
const QuestionCollection = require("../models/questionCollection");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");

//Create a Question Collection
router.post("/questionCollection", auth, jsonParser, async (req, res) => 
{
    // Create a new question collection using the data from the request body,
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
        res.status(400).json({ error: error.message });
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

//Get all question collections, they must be public or shared with the user or the user must be the owner
router.get("/questionCollections", auth, async (req, res) => {
    try {
        //Get all question collections
        const questionCollections = await QuestionCollection.find({});
        //Filter out question collections that are not public or shared with the user or owned by the user
        const filteredQuestionCollections = questionCollections.filter((questionCollection) => {
            if (questionCollection.isPublic) {
                return true;
            }
            if (questionCollection.sharedWith.includes(req.user._id)) {
                return true;
            }
            if (questionCollection.createdBy.toString() === req.user._id.toString()) {
                return true;
            }
            return false;
        });
        //Send the question collections back to the client
        res.status(200).json({ questionCollections: filteredQuestionCollections });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Get a question collection by ID if it is public or shared with the user or the user is the owner. There is no need to populate the questions field because the client will make a separate request to get the questions
router.get("/questionCollection/:id", auth, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id).populate("questions");
        //Check if the question collection is public or shared with the user or the user is the owner
        if (!questionCollection.isPublic && !questionCollection.sharedWith.includes(req.user._id) && questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to view this question collection" });
        }
        //Send the question collection back to the client
        res.status(200).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Update a question collection by ID, user must be the owner
router.patch("/questionCollection/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id);
        //Check if the user is the owner
        if (questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to update this question collection" });
        }
        //Elligible updates
        const updates = Object.keys(req.body);
        const allowedUpdates = ["name", "description", "questions","public"];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        //Check if the update is valid
        if (!isValidOperation) {
            return res.status(400).json({ error: "Invalid updates!" });
        }
        //Update the question collection
        updates.forEach((update) => (questionCollection[update] = req.body[update]));
        //Save the question collection
        await questionCollection.save();
        //Send the question collection back to the client
        res.status(200).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Share a question collection by ID, user must be the owner, user must exist in the database, user must not already be shared with, user cannot share with themselves
router.patch("/questionCollection/share/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id);
         //Check if the user shared with exists in the database
        if (!await User.exists({ _id: req.body.sharedWith })) {
            return res.status(400).json({ error: "User does not exist" });
        }
        //Check if the user is not sharing with themselves
        if (req.body.sharedWith.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot share with yourself" });
        }

        //Check if the user is the owner
        if (questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to share this question collection" });
        }
        //Check if the user is already shared with
        if (questionCollection.sharedWith.includes(req.body.sharedWith)) {
            return res.status(400).json({ error: "User is already shared with" });
        }
        //Add the user to the sharedWith array
        questionCollection.sharedWith.push(req.body.sharedWith);
        console.log("User added to sharedWith array");
        //Save the question collection
        await questionCollection.save();
        //Send the question collection back to the client
        res.status(200).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        console.log("There was an error");
        res.status(500).json({ error: error.message });
    }
});

//Sample request body:
/*
{
    "sharedWith": "5f9f9f9f9f9f9f9f9f9f9f9f"
}
*/

//Turn a collection from private to public or vice versa
router.patch("/questionCollection/public/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id);
        //Check if the user is the owner
        if (questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to update this question collection" });
        }
        //Update the question collection
        questionCollection.isPublic = req.body.isPublic;
        //Save the question collection
        await questionCollection.save();
        //Send the question collection back to the client
        res.status(200).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});



//Unshare a question collection by ID, user must be the owner, user must exist in the database, user must already be shared with, user cannot unshare with themselves
router.patch("/questionCollection/unshare/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id);
        //Check if the user shared with exists in the database
        if (!await User.exists({ _id: req.body.sharedWith })) {
            return res.status(400).json({ error: "User does not exist" });
        }
        //Check if the user is not sharing with themselves
        if (req.body.sharedWith.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot unshare with yourself" });
        }
        //Check if the user is the owner
        if (questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to unshare this question collection" });
        }
        //Check if the user is already shared with
        if (!questionCollection.sharedWith.includes(req.body.sharedWith)) {
            return res.status(400).json({ error: "User is not shared with" });
        }
        //Remove the user from the sharedWith array
        questionCollection.sharedWith = questionCollection.sharedWith.filter((user) => user.toString() !== req.body.sharedWith.toString());
        console.log("User removed from sharedWith array");
        //Save the question collection
        await questionCollection.save();
        //Send the question collection back to the client
        res.status(200).json({ questionCollection });
    } catch (error) {
        // If there was an error, send it back to the client
        console.log("There was an error");
        res.status(500).json({ error: error.message });
    }
});

//Sample request body:
/*
{
    "sharedWith": "5f9f9f9f9f9f9f9f9f9f9f9f"
}
*/

//Delete a question collection by ID, and all of its questions, user must be the owner
router.delete("/questionCollection/:id", auth, async (req, res) => {
    try {
        //Get the question collection by ID
        const questionCollection = await QuestionCollection.findById(req.params.id);
        //Check if the user is the owner
        if (questionCollection.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this question collection" });
        }
        //Delete the question collection
        await QuestionCollection.deleteOne({ _id: req.params.id });
        //Send a success message back to the client
        res.status(200).json({ message: "Question collection deleted" });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error:error.message});
    }
});

//Get all question collections created by logged in user
router.get("/questionCollections/me", auth, async (req, res) => {
    try {
        //Get all question collections created by logged in user
        const questionCollections = await QuestionCollection.find({ createdBy: req.user._id });
        //Send the question collections back to the client
        res.status(200).json({ questionCollections });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ erro:error.message });
    }
});

//Get all question collections created by a specific user that are public or shared with the logged in user
router.get("/questionCollections/user/:id", auth, async (req, res) => {
    try {
        //Get all question collections created by a specific user that are public or shared with the logged in user
        const questionCollections = await QuestionCollection.find({ createdBy: req.params.id, $or: [{ isPublic: true }, { sharedWith: req.user._id }] });
        //Send the question collections back to the client
        res.status(200).json({ questionCollections });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error });
    }
});

//Search for question collections by name, description, createdBy, sharedWith, difficulty, subject, topic, or tags, must be public or shared with logged in user
//TODO: WIP
router.get("/questionCollections/search", auth, jsonParser, async (req, res) => {
    try {
        //Get the search query
        const searchQuery = req.body.searchQuery;
        //Get results from the search query
        const results = await QuestionCollection.find({ $or: [{ name: { $regex: searchQuery.name, $options: "i" } }, { description: { $regex: searchQuery.description, $options: "i" } }, { createdBy: { $regex: searchQuery.createdBy, $options: "i" } }, { sharedWith: { $regex: searchQuery.sharedWith, $options: "i" } }, { difficulty: { $regex: searchQuery.difficulty, $options: "i" } }, { subject: { $regex: searchQuery.subject, $options: "i" } }, { topic: { $regex: searchQuery.topic, $options: "i" } }, { tags: { $regex: searchQuery.tags, $options: "i" } }], $or: [{ isPublic: true }, { sharedWith: req.user._id }] });
        res.status(200).json({ results });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error });
    }
});


//Sample request body:
/*
{
    "searchQuery": {
        "name": "test",
        "description": "test",
        "createdBy": "test",
        "sharedWith": "test",
        "difficulty": "test",
        "subject": "test",
        "topic": "test",
        "tags": ["test"]
    },
    "filterQuery": {
        "difficulty": "test",
        "subject": "test",
        "topic": "test",
        "tags": ["test"]
    },
    "pageNumber": 1
}
*/




module.exports = router;