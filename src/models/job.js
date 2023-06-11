const mongoose = require("mongoose");

//A job is a task that is run by a worker, it has an id and status amongst an enum 

const jobSchema = new mongoose.Schema({
    id : {
        type: String,
        required: true,
        trim: true,
    },
    status : {
        type: String,
        required: true,
        trim: true,
        enum : ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']
    },
    data : {
        type: Object,
        required: false,
    },
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;