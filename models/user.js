var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");
// Defining the user data schema
var userSchema = new mongoose.Schema({
  username: String,
  name: String,
  lastName: String,
  email: String,
  password: String
});


userSchema.plugin(passportLocalMongoose);

// Creating a model object out of specified Schema
module.exports = User = mongoose.model("User", userSchema);