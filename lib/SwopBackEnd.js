var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var fs = require("fs");




exports.getKommunListFromUserAnswers = function (answerList) {
	var kommunData = getkommunData();
	var probabilityForUser = getUsersPartyDistrobutionFrom(answerList);
	return getListOfJuristictionMatch(probabilityForUser,kommunData);
}

exports.getSmallAPIString = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	return xhr.responseText;
}

getKommunData = function() {
	var json = importFile("valres_kommun_static.json")
	console.log(json.dataset.dimension.Partimm.category.index.C)
	console.log(json.dataset.dimension.Region.category.label["0114"])
	console.log(json.dataset.value[0])

	var result = [];

	for (kommun in json.dataset.dimension.Region.category.label){
		var str = json.dataset.dimension.Region.category.label[kommun]
		var namn = str.substring(5, str.length);
		var index = json.dataset.dimension.Region.category.index[kommun]
		var fordelning = [
			{"parti":"M", "andel": json.dataset.value[8*index+0]},
			{"parti":"C", "andel": json.dataset.value[8*index+1]},
			{"parti":"FP", "andel": json.dataset.value[8*index+2]},
			{"parti":"KD", "andel": json.dataset.value[8*index+3]},
			{"parti":"MP", "andel": json.dataset.value[8*index+4]},
			{"parti":"S", "andel": json.dataset.value[8*index+5]},
			{"parti":"V", "andel": json.dataset.value[8*index+6]},
			{"parti":"SD", "andel": json.dataset.value[8*index+7]}
			]
		if(fordelning[0].andel != null){
			result.push({"kommun":namn, "fordelning":fordelning})
		}
	}

	console.log(JSON.stringify(result))
}

// Få voteringsresultat för en given votering.
// @riksmote String för årtal, typ "2015/16"
// @beteckning String för beteckning, typ "AU1"
// @forslagspunkt String för punkt, typ "1"
// @return String för XML som ges som svar av servern.
exports.getVotering = function(riksmote, beteckning, forslagspunkt) {
	riksmote = riksmote.replace("/", "%2F")
	var url = "http://data.riksdagen.se/voteringlistagrupp/?rm=" + riksmote + "&bet=" + beteckning + "&punkt=" + forslagspunkt + "&grupp1=C&grupp2=MP&grupp3=SD&grupp4=L&grupp5=M&grupp6=V&grupp7=KD&grupp8=S&utformat=xml";//console.log(url)
	xhr.open("GET", url, false)
	xhr.send()
	return xhr.responseText
}


function compareKommuner(a,b) {
	if( a.match > b.match) {
		return -1;
	} else if (a.match < b.match) {
		return 1;
	} else {
		return 0;
	}
}

function getListOfJuristictionMatch(partyProbs, kommunProbs) {
	var result =  kommunProbs.map(function(kommunProb){
						var kommun = {};
						kommun.namn = kommunProb.kommun;
						var sum = 0;
						for(party in partyProbs){
							sum += Math.pow(partyProbs[party] - (kommunProb.fordelning.find(function(p){return p.parti == party}).andel/100), 2)
						}
						kommun.match = 1 - sum/2; //Should be correct. assume sum:max = 2 and sum:min = 0;
						return kommun;
					}).sort(compareKommuner);
	return result;
}

exports.getUsersPartyDistrobutionFrom = function(userResults) {
	var votes = {};
	var parties = ["V","S","MP","C","L","M","KD","SD"];
	parties.forEach(function(p){
		votes[p] = 0;
	});
	var data = getVoteResults();
	var totalVotes = 0;
	data.forEach(function(f) {
		var id = f.forslag;
		f.resultat.forEach(function(r) {
			var fordelning = r.fordelning[0];
			var parti = r.parti;
			var totalPartieVotes = 0;
			var partieVotes = 0;
			if(userResults.find(function(q){return q.id === id;}).agree){
				partieVotes += fordelning.ja;
			} else if (!userResults.find(function(q){return q.id === id;}).agree){
				partieVotes += fordelning.nej;
			}
			for (val in fordelning){
				totalPartieVotes +=fordelning[val];
			}
			votes[parti] += partieVotes/totalPartieVotes;
			totalVotes += partieVotes/totalPartieVotes;
		})
	})
	for(p in votes) {
		votes[p] = votes[p]/totalVotes;
	}

	//console.log(resultat);
	return votes;
}

importFile = function(fileName) {
	var string = fs.readFileSync(fileName, "utf8")
	var json = JSON.parse(string)
	return json
}

getQuestionsJSON = function() {
	return importFile("questions.json")
}

// Plocka ut året/rm/riksmöte "2015/16" ur "2015/16:AU10p1"
fp2Riksmote = function(forslagspunkt) {
	return forslagspunkt.substring(0,7)
}

// Plocka ut beteckning "AU10" ur "2015/16:AU10p1"
fp2Beteckning = function(forslagspunkt) {
	return forslagspunkt.substring(8, forslagspunkt.length - (forslagspunkt.length - forslagspunkt.lastIndexOf("p")))
}

// Plocka ut förslagspunkt "1" ur "2015/16:AU10p1"
fp2Forslagspunkt = function(forslagspunkt) {
	return forslagspunkt.substring(forslagspunkt.lastIndexOf("p") + 1, forslagspunkt.length)
}

getQuestionsAndReturnVoteringJSON = function() {
	var json = [];
	for (var i = 0; i < getQuestionsJSON().questions.length; i++){
		var qf = getQuestionsJSON().questions[i].forslagspunkt
		var xml = exports.getVotering(fp2Riksmote(qf), fp2Beteckning(qf), fp2Forslagspunkt(qf))
		var parseString = require('xml2js').parseString;
		parseString(xml, function (err, result) {
			json.push(result)
		});
	}
	return  json
}

getVoteResults = function() {
	var pq = preloadedQuestionsJSON;
	console.log(pq)
	var json = [];
	for (var i = 0; i < pq.length; i++){
		json.push(
			{
				"forslag":pq[i].voteringlista.votering[0].forslagspunkt[0],
				"resultat":
				[
					{ "parti":pq[i].voteringlista.$.grupp1, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp1-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp1-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp1-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp1-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp2, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp2-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp2-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp2-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp2-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp3, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp3-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp3-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp3-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp3-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp4, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp4-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp4-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp4-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp4-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp5, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp5-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp5-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp5-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp5-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp6, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp6-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp6-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp6-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp6-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp7, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp7-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp7-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp7-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp7-Avstår"])) } ] },
					{ "parti":pq[i].voteringlista.$.grupp8, "fordelning": [ {
					"ja":parseInt(pq[i].voteringlista.votering[0]["Grupp8-Ja"]),
					"nej":parseInt(pq[i].voteringlista.votering[0]["Grupp8-Nej"]),
					"inget":parseInt((pq[i].voteringlista.votering[0]["Grupp8-Frånvarande"]+pq[i].voteringlista.votering[0]["Grupp8-Avstår"])) } ] }
				]
			}
		)
	}
	console.log(json)
	return json;
}

exports.getQuestions = function() {
	var q = getQuestionsJSON()
	var data = [
		{ id:q.questions[0].forslagspunkt, questions:q.questions[0].question },
		{ id:q.questions[1].forslagspunkt, questions:q.questions[1].question },
		{ id:q.questions[2].forslagspunkt, questions:q.questions[2].question },
		{ id:q.questions[3].forslagspunkt, questions:q.questions[3].question },
		{ id:q.questions[4].forslagspunkt, questions:q.questions[4].question },
		{ id:q.questions[5].forslagspunkt, questions:q.questions[5].question },
		{ id:q.questions[6].forslagspunkt, questions:q.questions[6].question },
		{ id:q.questions[7].forslagspunkt, questions:q.questions[7].question },
		{ id:q.questions[8].forslagspunkt, questions:q.questions[8].question },
		{ id:q.questions[9].forslagspunkt, questions:q.questions[9].question },
	]
	return data
}

var preloadedQuestionsJSON = getQuestionsAndReturnVoteringJSON();
getVoteResults()

console.log(exports.getUsersPartyDistrobutionFrom([ { agree: 'true', id: '2015/16:AU10p1' },
  { agree: 'true', id: '2015/16:JuU7p11' },
  { agree: 'true', id: '2015/16:FöU14p2' },
  { agree: 'true', id: '2015/16:NU15p2' } ]))
/*exports.SwopBackEnd = {
	getSmallAPIString: getSmallAPIString,
	getVotering: getVotering,
	getUsersPartyDistrobutionFrom: getUsersPartyDistrobutionFrom

}*/
