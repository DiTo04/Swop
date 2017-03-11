"use strict";

let express = require("express");
let app = express();

//app.use('/static', express.static('public'))
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/question.html")
})

app.get("/question", (req, res) => {
  console.log("LOL2")
  //BYT UT med funktion som hämtar data

  res.send(data);
})

app.listen(3000, () => {
  console.log("Listening to port 3000");
})