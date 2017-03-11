var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var fs = require("fs");
exports.SwopBackEnd = {
	getSmallAPIString: getSmallAPIString,
	getVotering: getVotering,
	getUsersPartyDistrobutionFrom: getUsersPartyDistrobutionFrom
}

getSmallAPIString = function() {
	xhr.open("GET", "http://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&from=&tom=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&sort=rel&sortorder=desc&rapport=&utformat=xml&a=s", false);
	xhr.send()
	return xhr.responseText;
}

// Få voteringsresultat för en given votering.
// @riksmote String för årtal, typ "2015/16"
// @beteckning String för beteckning, typ "AU1"
// @forslagspunkt String för punkt, typ "1"
// @return String för XML som ges som svar av servern.
getVotering = function(riksmote, beteckning, forslagspunkt) {
	riksmote = riksmote.replace("/", "%2F")
	var url = "http://data.riksdagen.se/voteringlistagrupp/?rm=" + riksmote + "&bet=" + beteckning + "&punkt=" + forslagspunkt + "&grupp1=C&grupp2=MP&grupp3=SD&grupp4=FP&grupp5=M&grupp6=V&grupp7=KD&grupp8=S&utformat=xml";
	xhr.open("GET", url, false)
	xhr.send()
	return xhr.responseText
}

function getVoteResults() {
	return [{forslag:"2016/17", resultat:[{parti:"s",fordelning:{ja:12,nej:10}},{parti:"mp",fordelning:{ja:2,nej:3}}]}];
}

function getProbabilityOfParty(party) {
	var data = getVoteResults();
	var sumOfParty = 0;
	var sumOfPeople = 0;
	for (var i = 0; i < (data[0].resultat).length; i++) {
		var resultat = data[0].resultat[i];
		var tempSumOfParty = 0;
		for (answer in resultat.fordelning) {
			tempSumOfParty += (resultat.fordelning)[answer];
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
			totalNrOfVotes += partyVote.fordelning.ja;
			totalNrOfVotes += partyVote.fordelning.nej;
			if(userDoAgree) {
				votesAsUser += partyVote.fordelning.ja;
			} else {
				votesAsUser += partyVote.fordelning.nej;
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
		var userAnswer = listOfVotes.find(function(v){return v.id === question.forslag}).agree;
		var partiResult = question.resultat.find(function(p){return p.parti === party});
		
		//Sum all votes
		var totalVotes = 0;
		for(answer in partiResult.fordelning) {
			totalVotes += partiResult.fordelning[answer];
		}
		//Get  votes as user.
		var result;
		if(userAnswer == true) {
			result = partiResult.fordelning.ja;
		} else {
			result = partiResult.fordelning.nej;
		}
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

getUsersPartyDistrobutionFrom = function(userResults) {
	var parties = ["v","s","mp","c","l","m","kd","sd"];
	var resultat;
	for (var i = 0; i < parties.length; i++) {
		var partiString = parties[i];
		resultat[partiString] = getProbabilityOfVotesGivenParty(userResults, partiString) * getProbabilityOfParty(partiString)/getProbabilityOfVotes(userResults);
	}
}

console.log(getProbabilityOfVotesGivenParty([{id:"2016/17",agree:true}], "s"))
//console.log(getListOfJuristictionMatch({s:0.4,kd:0.1,m:0.3,c:0.2}, [{namn:"sthlm", s:0.3,kd:0.2,m:0.3,c:0.2}, {namn:"gbg",s:0.4,kd:0.1,m:0.3,c:0.2}]));
//console.log(exports.getSmallAPIString());
//console.log(getProbabilityOfParty("s"));

// var questions = fs.ReadFileSync("questions.json")
// console.log(questions)

// var parseString = require('xml2js').parseString;
// var xml = exports.getVotering("2015/16","AU1","1");
// parseString(xml, function (err, result) {
// 	//console.log(xml)
//   //console.dir(JSON.stringify(result));
// 	//console.log(result.dokumentlista.dokument[0].titel)
// 	console.log(result)
// });
