//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.set("view engine", "ejs");
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//* connect mongoose to database
mongoose.set("strictQuery", true);
const mongoDB =
  "mongodb+srv://sanjayjatsanjay22:JlyID69wOG1EBZB0@cluster0.yhhcmza.mongodb.net/TodoDB";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Mongoose is connected to the MongoDB server!");
});

//* item schema

const itemSchema = new mongoose.Schema({
  name: { type: String, require: true },
});

//*item model -
const Item = new mongoose.model("Item", itemSchema);
//creating items -

const item1 = new Item({
  name: "Hey! welcome to the Todo List.",
});
const item2 = new Item({
  name: "click below to add your task to Todo list and click ----> ",
});
const item3 = new Item({
  name: "<----click on checkbox to delete item",
});
const defaultItems = [item1, item2, item3];

//* customList schema

const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

//* customList model

const customList = new mongoose.model("List", customListSchema);

app.get("/", function (req, res) {
  const day = date.getDate();

  //!to avoid repeatative entries in database
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("sucessfully added to the database");
      });
    }
  });
  //* fetch from database
  Item.find({}, function (err, myitems) {
    res.render("list", { listTitle: day, newListItems: myitems });
  });
});

//* adding items to our database collection
app.post("/", function (req, res) {
  const item = req.body.newItem;
  const ListName = _.capitalize(req.body.list);
  const newItem = new Item({
    name: item,
  });

  if (ListName == date.getDate()) {
    newItem.save();
    res.redirect("/");
  } else {
    customList.findOne({ name: ListName }, function (err, foundItems) {
      foundItems.items.push(newItem);
      foundItems.save();
      res.redirect("/" + ListName);
    });
  }
});
//! delete operation
app.post("/delete", (req, res) => {
  let id = req.body.toDelete;
  let ListName = req.body.ListName;
  console.log(req.body);
  // console.log(id);
  if (ListName === date.getDate()) {
    console.log("default list");
    Item.findOneAndDelete({ _id: id }, function (err) {
      if (err) console.log(err);
      else console.log("item deleted successfully");
    });
    res.redirect("/");
  } else {
    customList.findOneAndUpdate(
      { name: ListName },
      { $pull: { items: { _id: id } } },
      function (err) {
        if (err) console.log(err);
        else console.log(`${ListName} item deleted succesfully `);
      }
    );
    res.redirect("/" + ListName);
  }
});

app.get("/:custumUrl", function (req, res) {
  let ListName = _.capitalize(req.param.custumUrl);
  customList.findOne({ name: req.params.custumUrl }, function (err, foundList) {
    if (!foundList) {
      console.log("not found");
      // no list found create a list with url
      const newList = new customList({
        name: req.params.custumUrl,
        items: defaultItems,
      });
      newList.save();
      res.redirect("/" + req.params.custumUrl);
    } else if (err) {
      console.log(err);
    } else {
      console.log("found, showing list ....");
      // show the given list

      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

//* insert data to customList collection
app.post("/:customUrl", (req, res) => {});
app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
