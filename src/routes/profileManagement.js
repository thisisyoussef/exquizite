const express = require("express");
const passport = require("passport");
const User = require("./models/user");

const router = express.Router();

// Registration
router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async(req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = await User.create({ username, email, password });
        req.flash("success", "Registration successful.");
        res.redirect("/login");
    } catch (error) {
        req.flash("error", "Registration failed.");
        res.redirect("/register");
    }
});

// Login
router.get("/login", (req, res) => {
    res.render("login");
});

router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        failureFlash: true,
    })
);

// Logout
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logout successful.");
    res.redirect("/");
});

// Dashboard
router.get("/dashboard", isLoggedIn, (req, res) => {
    res.render("dashboard", { user: req.user });
});

// Profile
router.get("/profile", isLoggedIn, (req, res) => {
    res.render("profile", { user: req.user });
});

router.post("/profile", isLoggedIn, async(req, res) => {
    const { username, email } = req.body;
    try {
        const user = await User.findById(req.user.id);
        user.username = username;
        user.email = email;
        await user.save();
        req.flash("success", "Profile updated successfully.");
        res.redirect("/profile");
    } catch (error) {
        req.flash("error", "Profile update failed.");
        res.redirect("/profile");
    }
});

// Middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Please login to access this page.");
    res.redirect("/login");
}

module.exports = router;