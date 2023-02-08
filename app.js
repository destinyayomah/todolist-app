const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config();
const date = require(__dirname + "/date.js");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL);

const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model('Item', itemsSchema);

const List = mongoose.model('List', listSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function(req, res) {
    const day = date.getDate();
    Item.find((err, items) => {
        if (items.length === 0) {
            Item.insertMany(defaultItems, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(docs);
                }
            });
            res.redirect('/');
        } else {
            res.render("list", { listTitle: day, newListItems: items, type: "homeRoute" });
        }
    });
});

app.get("/:listname", function(req, res) {
    const listName = _.capitalize(req.params.listname);

    List.findOne({ name: listName }, (err, list) => {
        if (list === null) {
            const list = new List({
                name: listName,
                items: defaultItems
            });

            list.save((err, list) => {
                console.log('New list created');
                res.redirect('/' + listName);
            });
        } else {
            res.render("list", { listTitle: list.name, newListItems: list.items, type: "customRoute" });
        }
    });
});

app.post("/", function(req, res) {

    const name = req.body.newItem;
    const type = req.body.type;
    const list = _.capitalize(req.body.list);

    const item = new Item({ name });

    if (type == 'homeRoute') {
        item.save((err, result) => {
            console.log('Item added');
            res.redirect('/');
        });
    } else {
        List.findOne({ name: list }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save((err, docs) => {
                console.log('Item added to  list');
                res.redirect('/' + list);
            });
        });
    }
});

app.post('/delete', (req, res) => {
    const _id = req.body.checkbox;
    const type = req.body.type;
    const list = _.capitalize(req.body.list);

    if (type == 'homeRoute') {
        Item.deleteOne({ _id }, (err, docs) => {
            console.log('Item deleted');
            res.redirect('/');
        });
    } else {
        List.findOneAndUpdate({ name: list }, { $pull: { items: { _id: _id } } }, (err, docs) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Item deleted from list");
                res.redirect('/' + list);
            }
        });
    }
});

const port = process.env.PORT ? process.env.PORT : 3000;

app.listen(port, function() {
    console.log("Server started on port " + port);
});