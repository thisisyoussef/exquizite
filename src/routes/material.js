const express = require("express");
const Topic = require("../models/topic");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const User = require("../models/user");
const Material = require("../models/material");
const multer = require("multer");
const getTextFromFile = require("../functions/getTextFromFile");
const scanMaterialFiles = require("../functions/scanMaterialFiles");

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(pdf|doc|docx|ppt|pptx|jpg|png|jpef)$/)) {
            return cb(new Error("Please upload a pdf, doc, docx, ppt, pptx, jpg, jpeg or png file"), false);
        }
        cb(undefined, true);
    },
});

//Upload file(s) to a material
router.post("/materials/:id/files", auth, upload.any("files"), async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).send( {error: "Material not found"} );
        }
        //check if user is the owner of the material
        if (req.user._id.toString() !== material.owner.toString()) {
            return res.status(401).send( {error: "You are not the owner of this material"} );
        }
        //loop through the files and push them to the files array of the material
        for (let i = 0; i < req.files.length; i++) {
            material.files.push(req.files[i].buffer);
        }
        //then call the scanMaterialFiles function to scan the files and update the material text
        material = await scanMaterialFiles.scanMaterialFiles(material);
        await material.save();
        res.send(material);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Delete file(s) from a material, take in an array of indices of the files in the files array of the material
router.delete("/materials/:id/files", auth, jsonParser, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).send( {error: "Material not found"} );
        }
        //check if user is the owner of the material
        if (req.user._id.toString() !== material.owner.toString()) {
            return res.status(401).send( {error: "You are not the owner of this material"} );
        }
        //check if the indices are valid
        for (let i = 0; i < req.body.indices.length; i++) {
            if (req.body.indices[i] >= material.files.length) {
                return res.status(400).send( {error: "Invalid index"} );
            }
        }
        //sort the indices in descending order
        req.body.indices.sort(function(a, b) {
            return b - a;
        });
        //remove the files from the files array
        for (let i = 0; i < req.body.indices.length; i++) {
            material.files.splice(req.body.indices[i], 1);
        }
        await material.save();
        material = await scanMaterialFiles.scanMaterialFiles(material);
        res.send(material);
    } catch (error) {
        res.status(400).send(error);
    }
});


//Create a new material and add it to a topic
router.post("/topics/:id/materials", auth, upload.any("files"), jsonParser, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).send( {error: "Topic not found"} );
        }
        //check if user is the owner of the topic
        if (req.user._id.toString() !== topic.createdBy.toString()) {
            return res.status(401).send( {error: "You are not the owner of this topic"} );
        }
        const material = new Material({
            ...req.body,
            topic: req.params.id,
            owner: req.user._id,
            createdBy: req.user._id,
        });
        await material.save();
        res.status(201).send(material);
    } catch (e) {
        res.status(400).send(e);

    }
});

//Upload file(s) to a material and add it to a topic
router.post("/topics/:id/materials/files", auth, upload.any("files"), jsonParser, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).send( {error: "Topic not found"} );
        }
        //check if user is the owner of the topic
        if (req.user._id.toString() !== topic.createdBy.toString()) {
            return res.status(401).send( {error: "You are not the owner of this topic"} );
        }
        const material = new Material({
            ...req.body,
            topic: req.params.id,
            owner: req.user._id,
            createdBy: req.user._id,
        });
        //loop through the files and push them to the files array of the material
        for(let i = 0; i < req.files.length; i++) {
            material.files.push(req.files[i].buffer);
        }
        //then call the scanMaterialFiles function to scan the files and update the material text
        material = await scanMaterialFiles.scanMaterialFiles(material);
        await material.save();
        res.status(201).send(material);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Get all materials of a topic
router.get("/topics/:id/materials", auth, jsonParser, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).send( {error: "Topic not found"} );
        }
        //check if user is the owner of the topic
        if (req.user._id.toString() !== topic.createdBy.toString()) {
            return res.status(401).send( {error: "You are not the owner of this topic"} );
        }
        await topic.populate("materials");
        res.send(topic.materials);
    } catch (e) {
        res.status(400).send(e);
    }
});

//Get a material by id
router.get("/materials/:id", auth, jsonParser, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).send( {error: "Material not found"} );
        }
        //check if user is the owner of the material
        if (req.user._id.toString() !== material.owner.toString()) {
            return res.status(401).send( {error: "You are not the owner of this material"} );
        }
        res.send(material);
    } catch (e) {
        res.status(400).send(e);
    }
});

//Update a material by id
router.patch("/materials/:id", auth, jsonParser, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "description", "content"];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send( {error: "Invalid updates"} );
    }
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).send( {error: "Material not found"} );
        }
        //check if user is the owner of the material
        if (req.user._id.toString() !== material.owner.toString()) {
            return res.status(401).send( {error: "You are not the owner of this material"} );
        }
        updates.forEach((update) => {
            material[update] = req.body[update];
        });
        await material.save();
        res.send(material);
    } catch (e) {
        res.status(400).send(e);
    }
});

//Delete a material by id
router.delete("/materials/:id", auth, jsonParser, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).send( {error: "Material not found"} );
        }
        //check if user is the owner of the material
        if (req.user._id.toString() !== material.owner.toString()) {
            return res.status(401).send( {error: "You are not the owner of this material"} );
        }
        await Material.deleteOne({_id: req.params.id});
        res.send(material);
    } catch (e) {
        res.status(400).send({error: e});
    }
});

//Get all materials of a user
router.get("/materials", auth, jsonParser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send( {error: "User not found"} );
        }
        await user.populate("materials");
        res.send(user.materials);
    } catch (e) {
        res.status(400).send(e);
    }
});


//export router
module.exports = router;