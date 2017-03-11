var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

exports.getSmallAPIMsg = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	console.log("LOL")
	return xhr.responseText;
}

console.log(exports.getSmallAPIMsg());