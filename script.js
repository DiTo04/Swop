/*var xhr = new XMLHttpRequest();

xhr.onreadystatechange = function(){
  console.log(this.response);
}
xhr.open("GET", "/question", true);
xhr.send();*/
var answeredQuestions = [];
var questions = [];

$.get("/question", function(data, t, j){
  questions = data;
  nextQuestion();
});

function answerYes() {
  answering(true);
}
function answerNo() {
  answering(false);
}

function answering(state) {
  var id = parseInt($(".question").attr("questionID"));
  answeredQuestions.push({agree: state, id: id});
  if(questions.length === 0){
    console.log(answeredQuestions);
    //$.get("/finished", answeredQuestions, function(){}, )
  }else{
    nextQuestion();
  }
}

function nextQuestion() {
  var q = $(".question");
  q.text(questions[0].question);
  q.attr("questionID", questions[0].id);
  questions.shift();
}

$(document).ready(function(){
  $("#yesButton").on("click", function(){
    answerYes();
  });

  $("#noButton").on("click", function(){
    answerNo();
  });
})
