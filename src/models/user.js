const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
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


const User = mongoose.model("User", userSchema);

module.exports = User;