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

app.get("/stats",(req, res) => {
  res.sendFile(__dirname + "/stats.html")
})

app.get("/question", (req, res) => {
  res.send(swopbackend.getQuestions());
})

app.post("/finished", (req, res) => {
  console.log(res.body);
  console.log(swopbackend.getKommunListFromUserAnswers(req.body.answeredQuestions));
  res.send(swopbackend.getKommunListFromUserAnswers(req.body.answeredQuestions));
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening to port 3000");
})