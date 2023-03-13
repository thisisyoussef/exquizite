const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

//Hash the password before saving the user model
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, process.env.SALT_ROUNDS);
  }
  next();
});

//Generate an auth token for the user
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id }, process.env.SALT_ROUNDS);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

//Search for a user by email and password.
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};



const User = mongoose.model("User", userSchema);

module.exports = User;