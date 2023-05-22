const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" ,
    //set to lowercase
    set: (value) => value.toLowerCase(),
  },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    resetCode: { type: String, required: false , default: null, 
},
    resetCodeExpiration: { type: Date, required: false, default: null },
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

//ToJSON method to remove password and tokens from the user object
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};

//Have the user create questions
userSchema.virtual("questions", {
    ref: "Question",
    localField: "_id",
    foreignField: "owner",
});

//Have the user create question collections
userSchema.virtual("questionCollections", {
    ref: "QuestionCollection",
    localField: "_id",
    foreignField: "createdBy",
});



const User = mongoose.model("User", userSchema);

module.exports = User;