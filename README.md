

Smart Lottery

A decentralized lottery system built on Ethereum using Solidity, Hardhat, and Ethers.js. The Smart Lottery allows participants to enter the lottery, and a random winner is selected using Chainlink VRF for true randomness.


---

Features

Decentralized and trustless lottery.

Random winner selection using Chainlink VRF.

Automated payouts to the winner.

Configurable ticket price and lottery duration.



---

Prerequisites

Before you begin, ensure you have the following installed:

Node.js (v16 or later)

Hardhat

MetaMask

Alchemy or Infura account for an Ethereum node connection.



---

Installation

1. Clone the repository:

git clone https://github.com/your-username/smart-lottery.git
cd smart-lottery


2. Install dependencies:

npm install


3. Set up environment variables:

Create a .env file in the root directory with the following:

PRIVATE_KEY=your-private-key
ALCHEMY_API_KEY=your-alchemy-api-key
CHAINLINK_SUBSCRIPTION_ID=your-chainlink-subscription-id
VRF_COORDINATOR_ADDRESS=vrf-coordinator-address
LINK_TOKEN_ADDRESS=link-token-address




---

Scripts

Deploy the contract:

npx hardhat run scripts/deploy.js --network goerli

Enter the lottery:

npx hardhat run scripts/enterLottery.js --network goerli

Pick a winner (using Chainlink VRF):

npx hardhat run scripts/pickWinner.js --network goerli



---

Testing

Run the test suite to ensure the contract behaves as expected:

npx hardhat test


---

Contract Overview

Functions:

enterLottery: Allows users to participate by paying the ticket fee.

pickWinner: Selects a random winner using Chainlink VRF.

getLotteryBalance: Retrieves the total balance of the lottery.

getParticipants: Returns the list of participants.


Events:

LotteryEntered(address indexed player)

WinnerPicked(address indexed winner)




---

Deployment

1. Compile the smart contract:

npx hardhat compile


2. Deploy to a testnet (e.g., Goerli):

npx hardhat run scripts/deploy.js --network goerli


3. Fund the contract with LINK tokens for Chainlink VRF to work.




---

Built With

Solidity

Hardhat

Chainlink

Ethers.js



---

