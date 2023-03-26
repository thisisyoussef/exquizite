const mongoose = require("mongoose");
const express = require("express");
const userRouter = require("./routes/profileManagement");
const questionCollectionRouter = require("./routes/questionCollection");
const questionRouter = require("./routes/question");
const assessmentRouter = require("./routes/assessment");
const attemptRouter = require("./routes/attempt");

const app = express();
const port = process.env.PORT || 3005;

app.use(userRouter);
app.use(questionCollectionRouter);
app.use(questionRouter);
app.use(assessmentRouter);
app.use(attemptRouter);

app.listen(port, () => {
    console.log("Server is up on port " + port);
});
const main = async() => {};

main();