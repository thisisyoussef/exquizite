const Queue = require('bull');
const redis = require('redis');
const generateMCQ = require('./functions/MCQ');
const Assessment = require('../src/models/assessment');
const Question = require('../src/models/question');
//get processJob from processAssessment.js
const express = require('express');
const processJob = require('./functions/processAssessment');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const socketIO = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = socketIO(server);

// Rest of your code...

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('message', (message) => {
    console.log('Received message:', message);
    // Handle received message from client
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
    // Handle client disconnection
  });
});

server.listen(() => {
  console.log('Socket.IO server listening');
});


// Store WebSocket clients
const clients = new Set();

// WebSocket connection event
wss.on('connection', (client) => {
  // Add client to the Set of clients
  clients.add(client);

  // WebSocket close event
  client.on('close', () => {
    // Remove client from the Set of clients
    clients.delete(client);
  });
});

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
//on new message

  // io.emit('jobStarted', { jobId: job.id });
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


// Your existing job completion event handler
workQueue.on('completed', (job, result) => {
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