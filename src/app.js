const mongoose = require("mongoose");
const express = require("express");
const userRouter = require("./routes/profileManagement");
const topicRouter = require("./routes/topic");
const questionRouter = require("./routes/question");
const assessmentRouter = require('./routes/assessment');
const attemptRouter = require("./routes/attempt");
const materialRouter = require("./routes/material");


const port = process.env.PORT || 3005;


const app = express();



//redisClient.connect();
app.use(userRouter);
app.use(topicRouter);
app.use(questionRouter);
app.use(assessmentRouter);
app.use(attemptRouter);
app.use(materialRouter);


app.listen(port, () => {
    console.log("Server is up on port " + port);
});

//run mongoose
require("./db/mongoose");