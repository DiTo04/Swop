"use strict";

let express = require("express");
let app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

let swopbackend = require("./lib/SwopBackEnd");
app.use(express.static(__dirname));

let data = [
  {
    id: 1,
    question: "Nu fan får det räcka med att beskatta dansband"
  },
  {
    id: 2,
    question: "Alkohol ska vara gratis tycker jag."
  },
  {
    id: 3,
    question: "Inför scientologin som officiell statsreligion"
  }
];

app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/question.html")
})

app.get("/question", (req, res) => {
  //BYT UT med funktion som hämtar data
  data = swopbackend.getQuestions();
  console.log(data);
  res.send(swopbackend.getQuestions());
})

app.post("/finished", (req, res) => {
  console.log(JSON.stringify(req.body));
})

app.listen(3000, () => {
  console.log("Listening to port 3000");
})