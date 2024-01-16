App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (window.ethereum) {
      console.log("Detected window.etheurem")

      try {
        const accounts = window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        accounts.then(function(array) {
          for (var i = 0; i < array.length; i++) {
            console.log("Address " + (i) + ":", array[i]);
          }
        }).catch(function(error) {
              console.error("Error:", error);
        });

      } catch {
        console.log("Issues connecting to MetaMask")
      }

      App.web3Provider = window.ethereum;
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log("Detected window.web3")
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      console.log("Detected Web3.providers.HttpProvider")
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Elections.json", function(elections) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Elections = TruffleContract(elections);
      // Connect provider to interact with contract
      App.contracts.Elections.setProvider(App.web3Provider);

      return App.render();

      App.listenForEvents();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Elections.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        App.render();
      });
    });
  },  

  render: function() {
    var electionsInstance;
    var loader = $("#loader");
    var content = $("#content");
    var ownerContent = $("#owner-content");
    var winnerContent = $("#winner-content");
    var votingForm = $("#voting-form");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        console.log("Get Coinbase: " + App.account)
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // // Load contract data
    App.contracts.Elections.deployed().then(function(instance) {
      electionsInstance = instance;
      return electionsInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 0; i < candidatesCount.c; i++) {
        electionsInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      content.show();
      loader.hide();
    })

    // Check right to vote
    App.contracts.Elections.deployed().then(function(instance) {

      electionsInstance = instance;
      return electionsInstance.hasRightToVote(App.account);

    }).then(function(hasRightToVote) {
      console.log("Has Right to Vote: " + hasRightToVote);
      if(hasRightToVote) {
        $('form').show();
      } else {
        $('form').hide();
      }
      content.show();

    }).catch(function(error) {
      console.warn(error);
    })
    
    // Check ownership
    App.contracts.Elections.deployed().then(function(instance) {

      electionsInstance = instance;
      return electionsInstance.showOwner();

    }).then(function(showOwner) {
      console.log("Owner address: " + showOwner);
      console.log("Account address: " + App.account);
      if(App.account == showOwner) {
        console.log("Is the owner of the smart contract !");
        content.show();
        $('form').show();
        votingForm.hide();
        ownerContent.show();
      }
    }).catch(function(err) {
      console.error(err);
    });

    // Declare and show winner
    App.contracts.Elections.deployed().then(function(instance) {

      electionsInstance = instance;
      return electionsInstance.getElectionStatus({ from: App.account });

    }).then(function(getElectionStatus) {
      console.log("Election status: " + getElectionStatus);
      if (!getElectionStatus) {
        // Declare and show winner
        App.contracts.Elections.deployed().then(function(instance) {

          electionsInstance = instance;
          return electionsInstance.displayWinner({ from: App.account });

        }).then(function(declareWinner) {
          console.log(declareWinner)

          var winnerResults = $('#winnerResults');
          winnerResults.empty();

          var name = declareWinner[0];
          var voteCount = declareWinner[1];
          var electionsStart = convertTimestampToFormattedDate(declareWinner[2]);
          var electionsEnd = convertTimestampToFormattedDate(declareWinner[3]);

          // Render candidate ballot option
          var winnerTemplate = "<tr><th>" + name + "</th><td>" + voteCount + "</td><td>" + electionsStart + "</td><td>" + electionsEnd + "</td></tr>"
          winnerResults.append(winnerTemplate);

          winnerContent.show();
        }).catch(function(err) {
          console.error(err);
        });
      }
    });
    
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Elections.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      
    }).catch(function(err) {
      console.error(err);
    });
  },

  endElection: function() {
    App.contracts.Elections.deployed().then(function(instance) {
      electionsInstance = instance;
      return electionsInstance.endElection({ from: App.account });
      console.log("Elections ended !")
    }).then(function(result) {

    }).catch(function(err) {
      console.error(err);
    });
  },

  displayWinner: function() {

    App.contracts.Elections.deployed().then(function(instance) {

      electionsInstance = instance;
      return electionsInstance.displayWinner({ from: App.account });

    }).then(function(result) {
      
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

function convertTimestampToFormattedDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}