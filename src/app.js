const express = require("express");
const mongoose = require("./db/mongoose");
const userRouter = require("./routes/profileManagement");
const questionCollectionRouter = require("./routes/questionCollection");
const questionRouter = require("./routes/question");

const app = express();
const port = process.env.PORT || 3005;

app.use(userRouter);
app.use(questionCollectionRouter);
app.use(questionRouter);

app.listen(port, () => {
    console.log("Server is up on port " + port);
});
const main = async() => {};

main();