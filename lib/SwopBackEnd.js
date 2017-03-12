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
	var url = "http://data.riksdagen.se/voteringlistagrupp/?rm=" + riksmote + "&bet=" + beteckning + "&punkt=" + forslagspunkt + "&grupp1=C&grupp2=MP&grupp3=SD&grupp4=L&grupp5=M&grupp6=V&grupp7=KD&grupp8=S&utformat=xml";
	//console.log(url)
	xhr.open("GET", url, false)
	xhr.send()
	return xhr.responseText
}

function getProbabilityOfParty(party) {
	var data = getVoteResults();
	var sumOfParty = 0;
	var sumOfPeople = 0;
	for (var i = 0; i < (data[0].resultat).length; i++) {
		var resultat = data[0].resultat[i];
		var tempSumOfParty = 0;
		for (answer in resultat.fordelning[0]) {
			tempSumOfParty += resultat.fordelning[0][answer];
		}
		if(resultat.parti == party) {
			sumOfParty = tempSumOfParty;
		}
		sumOfPeople += tempSumOfParty;

	}
	return sumOfParty/sumOfPeople;
}

function getProbabilityOfVotes(listOfVotes) {
	var data = getVoteResults();
	var totalProbebility = 1;
	for (var i = 0; i < data.length; i++) {
		var question = data[i];
		var userDoAgree = listOfVotes.find(function(t){return t.id === question.forslag}).agree;
		var votesAsUser = 0;
		var totalNrOfVotes = 0;
		for (var j = 0; j < question.resultat.length; j++) {
			var partyVote = question.resultat[j];
			totalNrOfVotes += partyVote.fordelning[0].ja;
			totalNrOfVotes += partyVote.fordelning[0].nej;
			if(userDoAgree) {
				votesAsUser += partyVote.fordelning[0].ja;
			} else {
				votesAsUser += partyVote.fordelning[0].nej;
			}
		}
		var PVoteOnQuestion = votesAsUser/totalNrOfVotes;
		totalProbebility *= PVoteOnQuestion;
	}
	return totalProbebility;
}

//[{forslag:"2016/17", resultat:[{parti:"s",fordelning:{ja:12,nej:10}},{parti:"mp",fordelning:{ja:2,nej:3}}]}]
function getProbabilityOfVotesGivenParty(listOfVotes, party) {
	var data = getVoteResults();
	var totalProbGivenParty = data.map(function(question) {
		//console.log(question)
		var userAnswer = listOfVotes.find(function(v){return v.id === question.forslag}).agree;
		var partiResult = question.resultat.find(function(p){return p.parti === party});
		
		//Sum all votes
		var totalVotes = 0;
		for(answer in partiResult.fordelning[0]) {
			totalVotes += partiResult.fordelning[0][answer];
		}
		//Get  votes as user.
		var result;
		if(userAnswer == true) {
			result = partiResult.fordelning[0].ja;
		} else {
			result = partiResult.fordelning[0].nej;
		}
		//console.log(totalVotes)
		return result/totalVotes;
	}).reduce(function(a,b){return a*b}, 1)

	return totalProbGivenParty;
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

function compareForslagspunk(a,b) {
	if(a.forslagspunkt < b.forslagspunkt) {
		return 1;
	} else if (a.forslagspunkt > b.forslagspunkt){
		return -1;
	} else {
		return 0;
	}
}

function getListOfJuristictionMatch(partyProbs, kommunProbs) {
	var result =  kommunProbs.map(function(kommunProb){
						var kommun = {};
						kommun.namn = kommunProb.namn;
						var sum = 0;
						for(party in partyProbs){
							sum += Math.pow(partyProbs[party] - kommunProb[party], 2)
						}
						kommun.match = 1 - sum/2; //Should be correct. assume sum:max = 2 and sum:min = 0;
						return kommun;
					}).sort(compareKommuner);
	return result;
}

exports.getUsersPartyDistrobutionFrom = function(userResults) {
	var parties = ["V","S","MP","C","L","M","KD","SD"];
	var resultat = {};
	for (var i = 0; i < parties.length; i++) {
		var partiString = parties[i];
		//console.log("Dubbelcheck, här är debuggkoden")
		console.log(getProbabilityOfVotesGivenParty(userResults, partiString))
		console.log(getProbabilityOfParty(partiString))
		//console.log("test")
		console.log(getProbabilityOfVotes(userResults))
		resultat[partiString] = getProbabilityOfVotesGivenParty(userResults, partiString) * getProbabilityOfParty(partiString)/getProbabilityOfVotes(userResults);
	}
	//console.log(resultat);
	return resultat;
}

var importQuestionsFile = function() {
	var string = fs.readFileSync("questions.json", "utf8")
	var json = JSON.parse(string)
	return json
}

getQuestionsJSON = function() {
	return importQuestionsFile()
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
	//TODO har bara en question för tillfället.
	var i = 0
	var qf = getQuestionsJSON().questions[i].forslagspunkt
	var xml = exports.getVotering(fp2Riksmote(qf), fp2Beteckning(qf), fp2Forslagspunkt(qf))
	var json;
	var parseString = require('xml2js').parseString;
	parseString(xml, function (err, result) {
		json = result
	});
	return  json
}

getVoteResults = function() {
	var pq = preloadedQuestionsJSON;
	// var json = [];
	// var i = 0;
	// for (votering in pq.voteringlista){
	// 	json[i].forslag = votering.forslagspunkt
	// 	for ()
	// }

	var json = [
			{
				"forslag":pq.voteringlista.votering[0].forslagspunkt[0],
				"resultat":
				[
					{ "parti":pq.voteringlista.$.grupp1, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp1-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp1-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp1-Frånvarande"]+pq.voteringlista.votering[0]["Grupp1-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp2, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp2-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp2-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp2-Frånvarande"]+pq.voteringlista.votering[0]["Grupp2-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp3, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp3-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp3-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp3-Frånvarande"]+pq.voteringlista.votering[0]["Grupp3-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp4, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp4-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp4-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp4-Frånvarande"]+pq.voteringlista.votering[0]["Grupp4-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp5, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp5-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp5-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp5-Frånvarande"]+pq.voteringlista.votering[0]["Grupp5-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp6, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp6-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp6-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp6-Frånvarande"]+pq.voteringlista.votering[0]["Grupp6-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp7, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp7-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp7-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp7-Frånvarande"]+pq.voteringlista.votering[0]["Grupp7-Avstår"])) } ] },
					{ "parti":pq.voteringlista.$.grupp8, "fordelning": [ {
					"ja":parseInt(pq.voteringlista.votering[0]["Grupp8-Ja"]),
					"nej":parseInt(pq.voteringlista.votering[0]["Grupp8-Nej"]),
					"inget":parseInt((pq.voteringlista.votering[0]["Grupp8-Frånvarande"]+pq.voteringlista.votering[0]["Grupp8-Avstår"])) } ] }
				]
			}
		]
	return json;
}

exports.getQuestions = function() {
	var q = getQuestionsJSON()
	var data = [
		{ id:q.questions[0].forslagspunkt, questions:q.questions[0].question },
		{ id:q.questions[1].forslagspunkt, questions:q.questions[1].question },
		{ id:q.questions[2].forslagspunkt, questions:q.questions[2].question },
		{ id:q.questions[3].forslagspunkt, questions:q.questions[3].question },
		/*{ id:q.questions[4].forslagspunkt, questions:q.questions[4].question },
		{ id:q.questions[5].forslagspunkt, questions:q.questions[5].question },
		{ id:q.questions[6].forslagspunkt, questions:q.questions[6].question },
		{ id:q.questions[7].forslagspunkt, questions:q.questions[7].question },
		{ id:q.questions[8].forslagspunkt, questions:q.questions[8].question },*/
		//{ id:q.questions[9].forslagspunkt, questions:q.questions[9].question },
	]
	return data
}

var preloadedQuestionsJSON = getQuestionsAndReturnVoteringJSON();

/*exports.SwopBackEnd = {
	getSmallAPIString: getSmallAPIString,
	getVotering: getVotering,
	getUsersPartyDistrobutionFrom: getUsersPartyDistrobutionFrom
}*/