const express = require("express");
const mongoose = require("./db/mongoose");
const userRouter = require("./routes/profileManagement");

const app = express();
const port = process.env.PORT || 3005;

app.use(userRouter);

app.listen(port, () => {
    console.log("Server is up on port " + port);
});
const main = async() => {};

main();