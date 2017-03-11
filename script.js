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
    $.ajax({
      url: '/finished',
      data: {answeredQuestions: answeredQuestions},
      type: 'POST',
    });
  }else{
    nextQuestion();
  }
}

function nextQuestion() {
  console.log(questions[0].questions)
  var q = $(".question");
  q.text(questions[0].questions);
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
