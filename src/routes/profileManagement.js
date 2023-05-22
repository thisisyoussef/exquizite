const express = require("express");
const User = require("../models/user");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const auth = require("../middleware/auth");
const sendGrid = require("@sendgrid/mail");
sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
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
        res.status(400).json({ error: error.message });
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
        res.status(400).json({ error: error.message });
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

//Forgot password
router.post("/forgotPassword", jsonParser, async (req, res) => {
    console.log("Forgot password")
    try {
        console.log("Forgot password")
        // Get email from request body
        const email = req.body.email;
        console.log(email);
        // Find user by email
        const user = await User.findOne({ email });
            // If user doesn't exist, return error
            if (!user) {
                console.log("User not found")
                return res.status(404).json({ error: "User not found" });
            }
            console.log("User found")
            await sendResetEmail(user);
            console.log("Email sent")
            // Return success message
            res.status(200).json({ message: "Password reset email sent" });

    } catch (error) {
        console.log("Error")
        // Return error message
        res.status(500).json({ error });
    }
});

//Check reset code
router.post("/checkResetCode", jsonParser, async (req, res) => {
    try {
        // Get email and reset code from request body
        const { email, resetCode } = req.body;
        // Find user by email
        const user = await User.findOne({ email });
        // If user doesn't exist, return error
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // If reset code doesn't match, return error
        if (resetCode !== user.resetCode) {
            console.log(resetCode);
            console.log(user.resetCode);
            return res.status(400).json({ error: "Invalid reset code" });
        }
        // If reset code is expired, return error
        if (Date.now() > user.resetCodeExpiration) {
            return res.status(400).json({ error: "Reset code expired" });
        }
        // Return success message
        res.status(200).json({ message: "Reset code valid" });
    } catch (error) {
        // Return error message
        res.status(500).json({ error });
    }
});

//Reset password
router.post("/resetPassword", jsonParser, async (req, res) => {
    try {
        // Get email, reset code, and new password from request body
        const { email, resetCode, newPassword } = req.body;
        // Find user by email
        const user = await User.findOne({ email });
        // If user doesn't exist, return error
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // If reset code doesn't match, return error
        if (resetCode !== user.resetCode) {
            return res.status(400).json({ error: "Invalid reset code" });
        }
        // If reset code is expired, return error
        if (Date.now() > user.resetCodeExpiration) {
            return res.status(400).json({ error: "Reset code expired" });
        }
        // Set new password
        user.password = newPassword;
        // Clear reset code and expiration
        user.resetCode = null;
        user.resetCodeExpiration = null;
        // Save user
        await user.save();
        // Return success message
        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        // Return error message
        res.status(500).json({ error });
    }
});

generateResetCode = async function (user) {
    //Generate a random 6 digit number
    console.log("Generating Random Number")
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    console.log("Generated Random Number")
    //Set the reset code and expiration on the user
    user.resetCode = resetCode;
    console.log("Set Reset Code", user.resetCode)
    user.resetCodeExpiration = Date.now() + 600000; //expires in 10 minutes
    console.log("Set expiration date")
    await user.save();
    console.log("Saved user")
    return resetCode;
};

//Create a sendResetEmail method on the userSchema
sendResetEmail = async function (user) {
  console.log("Entered Function")
  // Generate a reset code and print it
  const resetCode = await generateResetCode(user);
  console.log("Generated reset code: ", resetCode);

  // Send the email and print success message
  await sendGrid.send({
    to: user.email,
    from: "youssefiahmedis@gmail.com",
    subject: "Password Reset",
    text: `Your password reset code is ${resetCode}`,
  });
  console.log("Reset email sent successfully.");
};



module.exports = router;