"use strict";

let express = require("express");
let app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

let swopbackend = require("./lib/SwopBackEnd");
app.use(express.static(__dirname));


app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/question.html")
})

app.get("/question", (req, res) => {
  res.send(swopbackend.getQuestions());
})

app.post("/finished", (req, res) => {
  console.log(swopbackend)
  swopbackend.getUsersPartyDistrobutionFrom(req.body.answeredQuestion);
  
  console.log(JSON.stringify(req.body));
})

app.listen(3000, () => {
  console.log("Listening to port 3000");
})