const express = require("express");
const Topic = require("../models/topic");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");

//Create a Question Collection
router.post("/topic", auth, jsonParser, async (req, res) => 
{
    // Create a new question collection using the data from the request body,
    const topic = new Topic(req.body);
    try {
        //Add the owner to the question collection
        topic.createdBy = req.user._id;
        // Save the question collection in the database
        await topic.save();
        // Send the question collection back to the client
        res.status(201).json({ topic });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(400).json({ error: error.message });
    }
});
//merchant of a request body:
/*
{
    "name": "Test Collection",
    "description": "This is a test collection",
    "questions": xxx,
    "owner": xxx
}
*/

//Get all question collections, they must be public or shared with the user or the user must be the owner
router.get("/topics", auth, async (req, res) => {
    try {
        //Get all question collections
        const topics = await Topic.find({});
        //Filter out question collections that are not public or shared with the user or owned by the user
        const filteredtopics = topics.filter((topic) => {
            if (topic.isPublic) {
                return true;
            }
            if (topic.sharedWith.includes(req.user._id)) {
                return true;
            }
            if (topic.createdBy.toString() === req.user._id.toString()) {
                return true;
            }
            return false;
        });
        //Send the question collections back to the client
        res.status(200).json({ topics: filteredtopics });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Get a question collection by ID if it is public or shared with the user or the user is the owner. There is no need to populate the questions field because the client will make a separate request to get the questions
router.get("/topic/:id", auth, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id).populate("questions");
        //Check if the question collection is public or shared with the user or the user is the owner
        if (!topic.isPublic && !topic.sharedWith.includes(req.user._id) && topic.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to view this question collection" });
        }
        //populate the materials field
        await topic.populate("materials");
        //Send the question collection back to the client
        res.status(200).json({ topic });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Update a question collection by ID, user must be the owner
router.patch("/topic/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id);
        //Check if the user is the owner
        if (topic.createdBy.toString() !== req.user._id.toString()) {
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
        updates.forEach((update) => (topic[update] = req.body[update]));
        //populate the materials field
        await topic.populate("materials");
        //if materials is empty, set it to an empty array
        if (!topic.materials) {
            topic.materials = [];
        }
        //Save the question collection
        await topic.save();
        //Send the question collection back to the client
        res.status(200).json({ topic });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});

//Share a question collection by ID, user must be the owner, user must exist in the database, user must not already be shared with, user cannot share with themselves
router.patch("/topic/share/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id);
         //Check if the user shared with exists in the database
        if (!await User.exists({ _id: req.body.sharedWith })) {
            return res.status(400).json({ error: "User does not exist" });
        }
        //Check if the user is not sharing with themselves
        if (req.body.sharedWith.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot share with yourself" });
        }

        //Check if the user is the owner
        if (topic.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to share this question collection" });
        }
        //Check if the user is already shared with
        if (topic.sharedWith.includes(req.body.sharedWith)) {
            return res.status(400).json({ error: "User is already shared with" });
        }
        //Add the user to the sharedWith array
        topic.sharedWith.push(req.body.sharedWith);
        console.log("User added to sharedWith array");
        //Save the question collection
        await topic.save();
        //Send the question collection back to the client
        res.status(200).json({ topic });
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
router.patch("/topic/public/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id);
        //Check if the user is the owner
        if (topic.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to update this question collection" });
        }
        //Update the question collection
        topic.isPublic = req.body.isPublic;
        //Save the question collection
        await topic.save();
        //Send the question collection back to the client
        res.status(200).json({ topic });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error: error.message });
    }
});



//Unshare a question collection by ID, user must be the owner, user must exist in the database, user must already be shared with, user cannot unshare with themselves
router.patch("/topic/unshare/:id", auth, jsonParser, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id);
        //Check if the user shared with exists in the database
        if (!await User.exists({ _id: req.body.sharedWith })) {
            return res.status(400).json({ error: "User does not exist" });
        }
        //Check if the user is not sharing with themselves
        if (req.body.sharedWith.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot unshare with yourself" });
        }
        //Check if the user is the owner
        if (topic.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to unshare this question collection" });
        }
        //Check if the user is already shared with
        if (!topic.sharedWith.includes(req.body.sharedWith)) {
            return res.status(400).json({ error: "User is not shared with" });
        }
        //Remove the user from the sharedWith array
        topic.sharedWith = topic.sharedWith.filter((user) => user.toString() !== req.body.sharedWith.toString());
        console.log("User removed from sharedWith array");
        //Save the question collection
        await topic.save();
        //Send the question collection back to the client
        res.status(200).json({ topic });
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
router.delete("/topic/:id", auth, async (req, res) => {
    try {
        //Get the question collection by ID
        const topic = await Topic.findById(req.params.id);
        //Check if the user is the owner
        if (topic.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this question collection" });
        }
        //Delete the question collection
        await Topic.deleteOne({ _id: req.params.id });
        //Send a success message back to the client
        res.status(200).json({ message: "Question collection deleted" });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error:error.message});
    }
});

//Get all question collections created by logged in user
router.get("/topics/me", auth, async (req, res) => {
    try {
        //Get all question collections created by logged in user
        const topics = await Topic.find({ createdBy: req.user._id });
        //Send the question collections back to the client
        res.status(200).json({ topics });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ erro:error.message });
    }
});

//Get all question collections created by a specific user that are public or shared with the logged in user
router.get("/topics/user/:id", auth, async (req, res) => {
    try {
        //Get all question collections created by a specific user that are public or shared with the logged in user
        const topics = await Topic.find({ createdBy: req.params.id, $or: [{ isPublic: true }, { sharedWith: req.user._id }] });
        //Send the question collections back to the client
        res.status(200).json({ topics });
    } catch (error) {
        // If there was an error, send it back to the client
        res.status(500).json({ error });
    }
});

//Search for question collections by name, description, createdBy, sharedWith, difficulty, subject, topic, or tags, must be public or shared with logged in user
//TODO: WIP
router.get("/topics/search", auth, jsonParser, async (req, res) => {
    try {
        //Get the search query
        const searchQuery = req.body.searchQuery;
        //Get results from the search query
        const results = await Topic.find({ $or: [{ name: { $regex: searchQuery.name, $options: "i" } }, { description: { $regex: searchQuery.description, $options: "i" } }, { createdBy: { $regex: searchQuery.createdBy, $options: "i" } }, { sharedWith: { $regex: searchQuery.sharedWith, $options: "i" } }, { difficulty: { $regex: searchQuery.difficulty, $options: "i" } }, { subject: { $regex: searchQuery.subject, $options: "i" } }, { topic: { $regex: searchQuery.topic, $options: "i" } }, { tags: { $regex: searchQuery.tags, $options: "i" } }], $or: [{ isPublic: true }, { sharedWith: req.user._id }] });
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