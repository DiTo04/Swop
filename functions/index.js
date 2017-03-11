var functions = require('firebase-functions');

// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
})

exports.getSomeAPIData = functions.https.onRequest((request, response) => {
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "http://data.riksdagen.se/personlista/?iid=&fnamn=Tobias&enamn=Billström&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=xml&termlista=", false ); // false for synchronous request
    xmlHttp.send( null );
 	response.send(xmlHttp.responseText);
})
