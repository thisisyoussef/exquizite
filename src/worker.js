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

const redisClient = redis.createClient({
  password: '1hmYL7z8FVMxvgRRFKruTqCgWSUy7v3D',
  socket:{
  host: 'redis-14740.c278.us-east-1-4.ec2.cloud.redislabs.com',
  port: 14740,
  }
});

workQueue.process(async (job) => {
  //check if redis is connected
  // if (!redisClient.connected) {
  //   console.log('Redis client not connected');
  // //Connect to redis
  // //redisClient.connect();
  // //console.log('Redis client connected');
  //   return;
  // }
  const { text, numQuestions, userId, assessmentName } = job.data;
  await processJob(text, numQuestions, userId, assessmentName);
  // Publish a message to the Redis channel when the job is completed
  //Check if client is open, if not open it
  if (!redisClient.isOpen) {
    console.log('Redis client not open');
    //Connect to redis
    redisClient.connect();
    console.log('Redis client connected');
    return;
  }
  redisClient.publish('job_completed', JSON.stringify({ jobId: job.id }));
});


workQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result ${result}`);
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