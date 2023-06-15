//Router to check on the status of a job, given its id and return the data if it is completed

// Path: src/routes/job.js

const express = require("express");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const Job = require("../models/job");

//Get the status of a job, given its id
router.get("/jobs/:id", auth, async (req, res) => {
    try {
        //Find the job by id but the id is not the same as the _id
        const job = await Job.findOne({id: req.params.id});
        //If the job is not found, send error
        if (!job) {
            return res.status(404).send();
        }
        //Send the job
        res.status(200).send(job);
    } catch (error) {
        res.status(500).send(error.message);
    }
}
);

//Get the data of a job, given its id
router.get("/jobs/:id/data", auth, async (req, res) => {
    try {
        //Find the job
        const job = await Job.findOne({id: req.params.id});
        //If the job is not found, send error
        if (!job) {
            return res.status(404).send();
        }
        //check if the job is completed
        if (job.status === "completed") {
            //Send the job's data
            res.status(200).send(job.data);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
}
);

module.exports = router;