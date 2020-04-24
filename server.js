var express = require('express'),
    path = require("path"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    methodOverride = require("method-override"),
    passport = require("passport"),
    passportLocal = require("passport-local"),
    expressLayouts = require("express-ejs-layouts"),
    passportLocalMongoose = require("passport-local-mongoose");

var app = express();
app.use(expressLayouts);
app.set('view engine', 'ejs');
mongoose.set('useCreateIndex', true);
app.use(express.static(path.resolve(__dirname) + '/public'));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: "true"}));


// Setting up the express sessions 
app.use(require("express-session")({
  secret: "This is first backend project.",
  resave: false,
  saveUninitialized: false
}));

// Setting up the passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connecting to the data base 
mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(console.log("__________DB Connected___________")).catch(function (err) {
  console.log(err.message);
});



// Route to home page of website
app.get("/", function (req, res) {
  res.render('index');
});
// Route to login page of website
app.get("/login", function(req, res) {
  res.render("login");
});

// Route for signup page 
app.get("/signup", function (req, res) {
  res.render("signup");
});

// Route to add the user to DB
app.post("/signup/add", function (req, res) {
  var data = req.body.data;
  User.register(data, req.body.password, function (err, dataRecieved) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

// Routes of Login
app.get("/user", isLoggedIn, async function (req, res) {
  var currentUser = await User.findById(req.user._id, function (err, foundUser) {
    if (err) {
      console.log(err);
    }
  });
  if (currentUser.username !== 'admin') {
    res.render("user", {currentUser: currentUser});
  } else if (currentUser.username === 'admin') {
    var allUsers = await User.find({}, function (err, foundAllUsers) {
      if (err) {
        console.log(err);
      }
    });
    res.render("admin", {currentUser: currentUser, allUsers: allUsers});
  }
});
app.post("/login", passport.authenticate("local", {
  failureRedirect: "/"
}), function (req, res) {
    res.redirect("/user");
  });

// Route for loging out
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/login");
});


// Route for updating user info 
app.get("/user/update", isLoggedIn, async function (req, res) {
  var currentUser = await User.findById(req.user._id, function (err, foundUser) {
    if (err) {
      console.log(err);
    }
  });
  res.render("update", {currentUser: currentUser});
});
app.put("/user", function (req, res) {
  var data = req.body.data;
  var password = req.body.password;
  var newPassword = req.body.newPassword;
  User.findOne({ username: req.user.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      
      foundUser.changePassword(password, newPassword)
          .then(() => {
              console.log('password changed');
              foundUser.update(data, function (err, updateUser) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(updateUser);
                }
              });
              
          })
          .catch((error) => {
              console.log(error);
          });
    }
  });
  res.redirect("/logout");
});

//  Route for users to delete their accounts
app.delete("/user/delete", function (req, res) {
  User.findOneAndDelete({ _id: req.user._id }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundUser);
      console.log("Sorry to see you go");
      res.redirect("/");
    }
  });
});

// Route for admin for deletion of users account
app.delete("/user/:id/delete", isLoggedIn, function (req, res) {
  var id = req.params.id;
  User.findByIdAndDelete(id, function (err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/user");
});



// Middleware for checking if any user is loged in 
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}


// Defining the port number to listen to
app.listen(process.env.PORT || 3000, function () {
  console.log('Server has started !!!');
});