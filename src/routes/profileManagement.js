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
        const token = await user.generateAuthToken();
        res.status(201).json({user,token });
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


// Login
router.post("/login", jsonParser, async (req, res) => {
    try {
        console.log(req.body);
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );
        const token = await user.generateAuthToken();
        res.status(200).json({ user,token });
    } catch (error) {
        res.status(400).json({ error });
    }
});
/* Example of a request body:
{
    "email": "x@x.com"
    "password": "password"
}
*/

// Logout
router.post("/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.status(200).json({ message: "Logged out" });
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Logout from all devices
router.post("/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).json({ message: "Logged out from all devices" });
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Get profile
router.get("/profile", auth, async (req, res) => {
    res.status(200).json({ user: req.user });
});

// Update profile
router.patch("/profile",jsonParser, auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["firstName", "lastName", "email", "password"];
    const isValidOperation = updates.every((update) =>  {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).json({ error: "Invalid updates!" });
    }
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(400).json({ error });
    }
});
// Example of a request body:
// {
//     "firstName": "John",
//     "lastName": "Doe",
//     "email": "
// }


// Delete profile
router.delete("/profile", auth, async (req, res) => {
    try {
        await req.user.remove();
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error });
    }
});


module.exports = router;