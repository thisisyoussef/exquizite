const express = require("express");
const User = require("../models/user");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
//       // "dev": "env-cmd -f ./config/dev.env nodemon src/app.js",

// Registration
router.post("/register" , jsonParser, async(req, res) => {
    const user = new User(req.body);
    try {
        await user.save({timeout: 30000});
        res.status(201).json({ user });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error });
    }
});
/* Example of a request body:
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "x@x.com",
    "password": "password"
}
*/


module.exports = router;