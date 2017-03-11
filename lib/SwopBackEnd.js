var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var fs = require("fs");

exports.getSmallAPIString = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	return xhr.responseText;
}

// Få voteringsresultat för en given votering.
// @riksmote String för årtal, typ "2015/16"
// @beteckning String för beteckning, typ "AU1"
// @forslagspunkt String för punkt, typ "1"
// @return String för XML som ges som svar av servern.
exports.getVotering = function(riksmote, beteckning, forslagspunkt) {
	riksmote = riksmote.replace("/", "%2F")
	var url = "http://data.riksdagen.se/voteringlistagrupp/?rm=" + riksmote + "&bet=" + beteckning + "&punkt=" + forslagspunkt + "&grupp1=C&grupp2=MP&grupp3=SD&grupp4=FP&grupp5=M&grupp6=V&grupp7=KD&grupp8=S&utformat=xml";
	xhr.open("GET", url, false)
	xhr.send()
	return xhr.responseText
}

var questions = fs.ReadFileSync("questions.json")
console.log(questions)

var parseString = require('xml2js').parseString;
var xml = exports.getVotering("2015/16","AU1","1");
parseString(xml, function (err, result) {
	//console.log(xml)
  //console.dir(JSON.stringify(result));
	//console.log(result.dokumentlista.dokument[0].titel)
	console.log(result)
});
