// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Elections {

    address[] public defaultVoters = [
        0xE2396BbdF71077684e5FbF051a6E431cC135e28A,
        0x22Fc4173D0ada02926138994d13D161113eE4a39,
        0x55fE80891495223deba5E2603BB24FACd6494a72,
        0x1f96B9704c0EDB5c6490d93713bd62d2c9A967cd,
        0xE1A1bDd16fCbEf19F83db908eaC052ABe2DB0cA9,
        0x1b33c03D5f880d3CDa8Ba91a772A9E8e5DBa36A0,
        0xf924e3eAA33965C47a116ca68EA93ca105385a3c,
        0xd2AFb069F61Cf099BfD0Dd9f8140AE18bAB658c9,
        0x079d12076e79Ba335da5D8999Df747C5a1f09CaC
    ];

    struct Voter {
        bool eligibleToVote; 
        bool voted;  
        uint votedCandidate; 
    }

    struct Proposal { 
        uint id;
        string name; 
        uint voteCount;
    }

    struct Winner {
        uint id;
        string name; 
        uint voteCount;
        uint256 startOfElection;
        uint256 endOfElection;
    }

    event votedEvent (
        uint indexed _candidateId
    );

    Proposal[] public candidates;
    Winner public winner;

    address public owner;
    bool electionInProgress;
    uint256 public startOfElection;
    uint public candidatesCount;

    mapping(address => Voter) public votersMap;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can give right to vote.");
        _;
    }

    constructor(string[] memory candidateNames) {
        owner = msg.sender;
        electionInProgress = true;

        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Proposal({
                id: i,
                name: candidateNames[i],
                voteCount: 0
            }));

            candidatesCount ++;
        }

        startOfElection = block.timestamp;
        giveVotingRightsToDefaultAddresses();
    }

    function showOwner() public view returns (address) {
        return owner;
    }

    function showCandidateCounts() public view returns (uint256) {
        return candidatesCount;
    }

    function showCandidateNames() external view returns (string[] memory) {
        string[] memory candidateNames = new string[](candidates.length);

        for (uint256 i = 0; i < candidates.length; i++) {
            candidateNames[i] = candidates[i].name;
        }

        return candidateNames;
    }

    function giveVotingRightsToDefaultAddresses() internal {
        for (uint256 i = 0; i < defaultVoters.length; i++) {
            giveRightToVote(defaultVoters[i]);
        }
    }

    function giveRightToVote(address voter) public onlyOwner {
        votersMap[voter].eligibleToVote = true;
    }

    function removeRightToVote(address voter) public onlyOwner {
        votersMap[voter].eligibleToVote = false;
    }

    function hasRightToVote(address voter) public view returns (bool) {
        if (votersMap[voter].eligibleToVote == true && votersMap[voter].voted == false) {
            return true;
        } else {
            return false;
        }
    }

    function vote(uint proposal) public {
        Voter storage sender = votersMap[msg.sender];
        require(sender.eligibleToVote, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.votedCandidate = proposal;

        candidates[proposal].voteCount += 1;

        emit votedEvent(proposal);
    }
    
    function endElection() public onlyOwner {
        electionInProgress = false;

        uint winningVoteCount = 0;
        uint winningCandidateId;

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }

        // Set the winner details and timestamp
        winner.id = candidates[winningCandidateId].id;
        winner.name = candidates[winningCandidateId].name;
        winner.voteCount = winningVoteCount;
        winner.startOfElection = startOfElection;
        winner.endOfElection = block.timestamp;
    }

    function getElectionStatus() public view returns (bool) {
        return electionInProgress;
    }

    function displayWinner() public view
            returns (string memory winnerName_, uint winningVoteCount_, uint256 startOfElection_, uint256 endOfElection_)
    {
        require(electionInProgress == false, "Can't declare winner while elections are in progress");
        winnerName_ = winner.name;
        winningVoteCount_ = winner.voteCount;
        startOfElection_ = winner.startOfElection;
        endOfElection_ = winner.endOfElection;
    }
}
