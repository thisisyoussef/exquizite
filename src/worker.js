const Queue = require('bull');
const redis = require('redis');
//get processJob from processAssessment.js
const processJob = require('./functions/processAssessment');
const Job = require('./models/job');



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
  //create a new job
  const newJob = new Job({id: job.id, status: 'waiting'});

  const { text, numQuestions, userId, assessmentName } = job.data;
  const result = await processJob(text, numQuestions, userId, assessmentName);
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
  //pass the result to the job data and save it
  newJob.data = result;
  await newJob.save();
});


// Your existing job completion event handler
workQueue.on('completed', (job, result) => {
  //query the job and update the status
  //also update the data with the result
  Job.findOneAndUpdate({id: job.id}, {status: 'completed', data: result}, {new: true}, (err, doc) => {
    if (err) {
      console.log("Something wrong when updating data!");
    }
    console.log(doc);
  });
  const message = `Job ${job.id} completed with result ${result}`;
  console.log(message);

  // Send the completion message to all connected WebSocket clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

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