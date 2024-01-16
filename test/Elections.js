var Elections = artifacts.require("./Elections.sol");

var exptectedCandidateNumber = 2;

contract("Elections", function(accounts) {

	if("Initializes with expected number of candidates", function() {
		return Elections.deployed().then(function(instance) {
			return instance.candidatesCount();
		}).then(function(count) {
			assert.equal(count, exptectedCandidateNumber);
		});
	});
});