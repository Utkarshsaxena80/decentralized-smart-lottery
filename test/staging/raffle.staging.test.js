const { network, getNamedAccounts ,deployments, ethers} = require("hardhat");
const {developmentChains,networkConfig}= require("/root/folder/smartLot/helper-hardhat-config.js");
const { assert, expect } = require("chai");
!developmentChains.includes(network.name)
      ?describe.skip
        :describe("Raffle Unit tests",async function(){
             let raffle,RAFFLE1,raffleEntranceFee,deployer    
             beforeEach(async function(){
                deployer=( await getNamedAccounts()).deployer;
                raffle= await deployments.get("Raffle");
              RAFFLE1= await ethers.getContractAt(
                "Raffle",
                raffle.address
            )           
            raffleEntranceFee=await RAFFLE1.getEntranceFee();
             })

            describe("fulfillRandomWords", function (){
                it("works with live chainlink keepers and vrf, we get a random number",async function (){
                    const startingTimeStamp=await RAFFLE1.getLatestTimeStamp();
                    const accounts= await ethers.getSigners();
                    const winnerStartingBalance= await RAFFLE1.getLatestTimeStamp();
                    await new Promise(async function (resolve,reject){
                        RAFFLE1.once("WinnerPicked",async function(){
                            console.log("winner picked event  fired ");
                            try{
                                const recentWinner= await RAFFLE1.getRecentWinner();
                                const raffleState= await RAFFLE1.checkRaffleState();
                                const winnerEndingBalance= await ethers.provider.getBalance(accounts[0].address);
                                const endingTimeStamp= await RAFFLE1.getLatestTimeStamp();
                                 await expect(RAFFLE1.getPlayer(0)).to.be.reverted;
                                 assert.equal(recentWinner.toString(),accounts[0].address)
                                 assert.equal(raffleState,0);
                                 assert(endingTimeStamp>startingTimeStamp)
                            }    
                            catch(e){
                                console.error(e);
                                reject(e);
                            }
                        })
                            await RAFFLE1.enterRaffle({value:raffleEntranceFee})

                    } )
                })
            })








            })