const Queue = require('bull');
const redis = require('redis');
const generateMCQ = require('./functions/MCQ');
const Assessment = require('../src/models/assessment');
const Question = require('../src/models/question');
//get processJob from processAssessment.js
const processJob = require('./functions/processAssessment');

const workQueue = new Queue('work', {
    redis:    {password: '1hmYL7z8FVMxvgRRFKruTqCgWSUy7v3D', // Replace with your Redis password if applicable
        host: 'redis-14740.c278.us-east-1-4.ec2.cloud.redislabs.com',
        port: 14740, 
},});


workQueue.process(async (job) => {
  const { text, numQuestions, userId, assessmentName } = job.data;
  await processJob(text, numQuestions, userId, assessmentName);
});

workQueue.on('completed', (job, result) => {
    console.log(`Job ${job} completed with result ${result}`);
    }
);

workQueue.on('failed', (job, err) => {
    console.log(`Job failed with ${err.message}`);
}
);

workQueue.on('error', (err) => {
    console.log(`Error with ${err.message}`);
}
);

//on start
workQueue.on('waiting', (jobId) => {
    console.log(`A job with ID ${jobId} is waiting`);
}
);

workQueue.on('active', (job, jobPromise) => {
    console.log(`Job ${job.id} is now active`);
}
);

workQueue.on('stalled', (job) => {
    console.log(`Job ${job.id} has stalled`);
}
);

workQueue.on('progress', (job, progress) => {
    console.log(`Job ${job.id} is ${progress * 100}% ready!`);
}
);

//on trying to connect
workQueue.on('drained', () => {
    console.log('Queue is drained!');
}
);

//on set up
workQueue.on('paused', () => {
    console.log('Queue is paused!');
}
);

//on start
workQueue.on('resumed', (job) => {
    console.log(`Job ${job.id} has resumed`);
}
);


module.exports = workQueue;