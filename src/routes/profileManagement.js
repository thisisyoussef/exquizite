const express = require("express");
const User = require("../models/user");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
//       // "dev": "env-cmd -f ./config/dev.env nodemon src/app.js",

// Registration
router.post("/register" , jsonParser, async(req, res) => {
    // Create a new user using the data from the request body
    const user = new User(req.body);
    try {
        // Save the user in the database
        await user.save({timeout: 30000});
        // Generate an authentication token for the new user
        const token = await user.generateAuthToken();
        // Send the user and their token back to the client
        res.status(201).json({user,token });
    } catch (error) {
        // If there was an error, send it back to the client
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
// 1. Create a new route handler to handle the request
router.post("/login", jsonParser, async (req, res) => {
    try {
        // 2. Log the request body to the console to see what the client sent
        console.log(req.body);
        // 3. Find the user by their email and password
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );
        // 4. Generate a token for the user
        const token = await user.generateAuthToken();
        // 5. Send the user object and the token to the client
        res.status(200).json({ user,token });
    } catch (error) {
        // 6. Send an error message to the client
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
// Create a new route
router.post("/logout", auth, async (req, res) => {
    try {
        // Filter out the current token from the user's tokens array
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        // Save the user's new tokens array
        await req.user.save();
        res.status(200).json({ message: "Logged out" });
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Logout from all devices

// @route POST api/users/logoutAll
// @desc Logout from all devices
// @access Private
router.post("/logoutAll", auth, async (req, res) => {
    try {
        // Remove all tokens from tokens array
        req.user.tokens = [];
        // Save user
        await req.user.save();
        // Send response
        res.status(200).json({ message: "Logged out from all devices" });
    } catch (error) {
        // Send error response
        res.status(500).json({ error });
    }
});

// Get profile
router.get("/profile", auth, async (req, res) => {
    res.status(200).json({ user: req.user });
});

// Update profile
// Route for updating user's profile
router.patch("/profile",jsonParser, auth, async (req, res) => {
    // Get the updates from the request
    const updates = Object.keys(req.body);
    // Get the allowed updates
    const allowedUpdates = ["firstName", "lastName", "email", "password"];
    // Check if the updates are valid
    const isValidOperation = updates.every((update) =>  {
        return allowedUpdates.includes(update);
    });
    // If the updates are not valid, return error status
    if (!isValidOperation) {
        return res.status(400).json({ error: "Invalid updates!" });
    }
    // If the updates are valid, update the user's profile
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
        // Remove user
        await req.user.remove();
        // Return success message
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        // Return error message
        res.status(500).json({ error });
    }
});


module.exports = router;