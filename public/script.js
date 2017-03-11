var xhr = new XMLHttpRequest();

xhr.onreadystatechange = function(){
  console.log(this.response);
}
xhr.open("GET", "/question", true);
xhr.send();