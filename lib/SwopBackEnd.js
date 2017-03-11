var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

exports.getSmallAPIString = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	return xhr.responseText;
}

exports.getSmallAPIXML = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	return xhr.responseXML;
}

//console.log(exports.getSmallAPIString());

var parseString = require('xml2js').parseString;
var xml = exports.getSmallAPIString();
parseString(xml, function (err, result) {
	//console.log(xml)
  //console.dir(JSON.stringify(result));
	console.log(result.dokumentlista.dokument[0].titel)
});

// var xmlDoc = exports.getSmallAPIXML();
// var x = xmlDoc.getElementsByTagName("titel");
// for (i = 0; i < x.length; i++) {
//     txt += x[i].childNodes[0].nodeValue + "<br>";
// }
//console.log(txt)
