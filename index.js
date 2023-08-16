// newest

// Requirements
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const dns = require("dns");

// add mongoose + MongDB and connect
const mongo = require("mongodb");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Configuration
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// schema/model for users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
});
const USERModel = mongoose.model("user", userSchema);

//schema/model for exercises
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
  description: { type: String, required: true, unique: false },
  duration: { type: Number, required: true, unique: false },
  date: { type: Date, required: false, unique: false },
});
const EModel = mongoose.model("exercise", exerciseSchema);

// post request for users
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  //check for object in database
  USERModel.findOne({ username }).then((userFound) => {
    // if user found
    if (userFound) {
      console.log(userFound);
      res.json({ username: userFound.username, _id: userFound._id });
    } else {
      // if user not found create new user + save
      const newUser = new USERModel({
        username: username,
      });
      newUser.save();
      res.json({ username: newUser.username, _id: newUser._id.toHexString() });
    }
  });
});

// post request to exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  USERModel.findById(id).then((userFound) => {
    if (userFound) {
      if (!req.body.date) {
        date = new Date().toDateString();
      } else {
        date = new Date(req.body.date).toDateString();
      }
      respObj = {
        username: userFound.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: date,
        _id: userFound._id.toHexString(),
      };
      const newExercise = new EModel({
        username: userFound.username,
        description: req.body.description,
        duration: req.body.duration,
        date: date,
      }).save();
      res.json(respObj);
    } else {
      res.json({ message: "User not found" });
    }
  });
});

// get request for logs
app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  // find user
  USERModel.findById(id).then((userObj) => {
    // get all exercise objects from user
    userToFind = userObj.username;
    let dateObj = { username: userToFind };
    // if there are from/to parameters
    if (from || to) {
      dateObj.date = {};
    }
    if (from) {
      dateObj.date["$gte"] = from;
    }
    if (to) {
      dateObj.date["$lte"] = to;
    }
   // find exercise entries
    EModel.find(dateObj)
      .limit(limit)
      .then((exercises) => {
        const entries = exercises.map((entry) => {
          return {
            description: entry.description,
            duration: entry.duration,
            date: entry.date.toDateString(),
          };
        });
        res.json({
          username: userToFind,
          count: exercises.length,
          _id: id,
          log: entries,
        });
      });
  });
});

// get request for all users
app.get("/api/users", (req, res) => {
  USERModel.find({})
    .sort({ _id: "desc" })
    .then((usersFound) => {
      res.json(usersFound);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
