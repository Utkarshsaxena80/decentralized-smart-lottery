//Raffle
//enter the lottery (some paying amount)
//pick a random winner(verifiably random)
//winner to be selected every x minutes
//chainlink oracle-> randomness, automated execution(chainlink keepers)

//SPDX-License-Identifier:MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";



contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum RaffleState{
        OPEN,
        CALCULATING
    }
    
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callBackGasLimit;
    uint32 private constant NUM_WORDS = 1;
    uint256 private immutable i_interval;

    address private s_recentWinner;
    RaffleState private s_RaffleState;
    uint256 private s_lastTimeStamp;

    error Raffle__NotEnoughETHEntered();
    error Raffle_TransferFailed();
    error Raffle__NotOpen();
    error Raffle__UpkeepNotNeeded(uint256 currentBalance,uint256 numPlayers,uint256 RaffleState);

    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winnerId);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callBackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callBackGasLimit = callBackGasLimit;
        s_RaffleState=RaffleState.OPEN;
        s_lastTimeStamp= block.timestamp;
        i_interval=interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
        if(s_RaffleState!=RaffleState.OPEN){
            revert Raffle__NotOpen();
        }
        //events
        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep (
        bytes memory /*checkData*/
    ) public view override returns (bool upkeepNeeded, bytes memory /*performData*/) {

     bool isOpen=(RaffleState.OPEN==s_RaffleState);
     bool timePassed=((block.timestamp-s_lastTimeStamp)>i_interval);
     bool hasPlayers = (s_players.length>0);
     bool hasBalance= address(this).balance>0;
    upkeepNeeded=(isOpen&&timePassed&&hasPlayers&&hasBalance);
    return (upkeepNeeded,"");
    
    }
    function performUpkeep( bytes calldata /*perform data*/) external override{
        //request the random number
     (bool upKeepNeeded, )=checkUpkeep("");
     if(!upKeepNeeded){
        revert Raffle__UpkeepNotNeeded(address(this).balance,s_players.length,uint256(s_RaffleState));
     }
       s_RaffleState=RaffleState.CALCULATING;
            uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callBackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal virtual override {
        //pick random winnwer using module
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];

        s_recentWinner = recentWinner;
        s_RaffleState=RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp=block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");

        if (!success) {
            revert Raffle_TransferFailed();
        }
            emit WinnerPicked(recentWinner);
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    
   function checkRaffleState() public view returns (RaffleState){
    return s_RaffleState;
   }
   function getNumWords()  public pure returns(uint256){
     return NUM_WORDS;
   }
    function getNumberOfPlayers() public view returns(uint256){
        return s_players.length;
    }
     function getLatestTimeStamp() public view returns(uint256){
        return s_lastTimeStamp;
     }
     function getRequestConfirmations() public pure returns(uint256){
        return REQUEST_CONFIRMATIONS;
     }
     function getInterval () public view returns(uint256){
        return i_interval;
     }
}