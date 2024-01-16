const Elections = artifacts.require("./Elections.sol");

module.exports = function(deployer) {
  const candidateNames = ["Petr Pavel", "Andrej Babis"];
  const initialVoters = [
    0xE2396BbdF71077684e5FbF051a6E431cC135e28A,
    0x22Fc4173D0ada02926138994d13D161113eE4a39,
  ];

  deployer.deploy(Elections, candidateNames);
};
