const express = require("express");
const mongoose = require("../src/db/mongoose");
const profileManagementRouter = require("./routers/profileManagement");

const app = express();
const port = process.env.PORT || 3005;

app.use(express.json());
app.use(profileManagementRouter);

app.listen(port, () => {
    console.log("Server is up on port " + port);
});
const main = async() => {};

main();