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
      console.log("userfound");
      res.json({ username: userFound.username, _id: userFound._id });
    } else {
      // if user not found create new user + save
      const newUser = new USERModel({
        username: username,
      });
      newUser.save();
      console.log({
        username: newUser.username,
        _id: newUser._id.toHexString(),
      });
      res.json({ username: newUser.username, _id: newUser._id.toHexString() });
    }
  });
});

// post request to exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  // create date Object up here
  USERModel.findById(id).then((objFound) => {
    if (objFound) {
      if (!req.body.date) {
        console.log("no date");
        respObj = {
          username: objFound.username,
          description: req.body.description,
          duration: parseInt(req.body.duration),
          date: new Date().toDateString(),
          _id: objFound._id.toHexString(),
        };
        const newExercise = new EModel({
          username: objFound.username,
          description: req.body.description,
          duration: req.body.duration,
          date: new Date().toDateString(),
        }).save();
      } else {
        console.log("date");
        respObj = {
          username: objFound.username,
          description: req.body.description,
          duration: parseInt(req.body.duration),
          date: new Date(req.body.date).toDateString(),
          _id: objFound._id.toHexString(),
        };
        const newExercise = new EModel({
          username: objFound.username,
          description: req.body.description,
          duration: req.body.duration,
          date: new Date(req.body.date).toDateString(),
        }).save();
      }
      res.json(respObj);
    } else {
      console.log("not found");
    }
  });
});

// get request for logs
app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  // find user
  USERModel.findById(id).then((userObj) => {
    // get all exercise objects from user
    userToFind = userObj.username;
    EModel.find({ username: userToFind }).then((exercises) => {
      res.json({ username: userToFind, count: exercises.length, _id: id, log: exercises});
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
