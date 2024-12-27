const { network, getNamedAccounts ,deployments, ethers} = require("hardhat");
const {developmentChains,networkConfig}= require("../helper-hardhat-config.js");
const { assert, expect } = require("chai");
const chainId= network.config.chainId;

describe("Raffle Unit tests",async function(){
             let raffle,RAFFLE1,vrfCoordinatorV2Mock,raffleEntranceFee,deployer,interval,VRFCoordinatorV2Mock
              
             beforeEach(async function(){
                deployer=( await getNamedAccounts()).deployer;
                await deployments.fixture(["all"]);
                raffle= await deployments.get("Raffle");
              //console.log(raffle);
              RAFFLE1= await ethers.getContractAt(
                "Raffle",
                raffle.address
            )
            vrfCoordinatorV2Mock= await deployments.get("VRFCoordinatorV2Mock");
           VRFCoordinatorV2Mock= await ethers.getContractAt(
            "VRFCoordinatorV2Mock",
            vrfCoordinatorV2Mock.address
           )
           
            raffleEntranceFee=await RAFFLE1.getEntranceFee();
            interval= await RAFFLE1.getInterval();
             })

      describe("constructor", function (){
        it("initializes the raffle correctly",async function(){
            //one assert per one it ideally
            const raffleState=await RAFFLE1.checkRaffleState();
            assert.equal(raffleState.toString(),"0");
            assert.equal(interval.toString(),networkConfig[chainId]["interval"]);
        })
      })

      describe("enter raffle",function(){
        it("reverts when you dont pay enough",async function (){
            try{
            await expect(RAFFLE1.enterRaffle()).to.be.revertedWithCustomError(
                RAFFLE1,
                "Raffle__NotEnoughETHEntered"
            )}catch(error){
                console.error(error);
                throw error;
            }
        })
        it("records players when entered", async function (){
            await RAFFLE1.enterRaffle({value:ethers.parseEther("2")});
            const playerFromContract= await RAFFLE1.getPlayer(0)
            assert.equal(playerFromContract,deployer);
        })
        it("emits events on enter ",async function (){
            await expect (RAFFLE1.enterRaffle({value:raffleEntranceFee})).to.emit(
                RAFFLE1,
                "RaffleEnter"
            )
        })
        it("doesnt allow entrance when raffle is calculating", async function (){
        
      await RAFFLE1.enterRaffle({value:raffleEntranceFee});
      await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
      await network.provider.send("evm_mine",[]);
      await RAFFLE1.performUpkeep("0x");
      await expect (RAFFLE1.enterRaffle({value:raffleEntranceFee})).to.be.revertedWithCustomError(
        RAFFLE1,
        "Raffle__NotOpen"
      )})
});

   describe("checkupKeep", function(){
    it("returns false if people havent sent any ETH",async function(){
     await network.provider.send("evm_increaseTime",[Number(interval)+1]);
     await network.provider.send("evm_mine",[]);
    const { upKeepNeeded}=await RAFFLE1.checkUpkeep("0x");
     assert(!upKeepNeeded);
    })
     
    it("returns false when raffle isnt open ",async function (){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee});
        await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
        await network.provider.send("evm_mine",[]);
        await RAFFLE1.performUpkeep("0x");
        const raffleState=await RAFFLE1.checkRaffleState();
        const {upKeepNeeded}= await RAFFLE1.checkUpkeep("0x");
        assert.equal(raffleState.toString(),"1");
        assert(!upKeepNeeded);  
    })

    it("returns false if enough time hasnt passed",async function (){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee});
        await network.provider.send("evm_increaseTime", [Number(interval) - 1]);
        await network.provider.request({method:"evm_mine",params:[]})
        const {upKeepNeeded}= await RAFFLE1.checkUpkeep("0x");
        assert(!upKeepNeeded);  
    })
    it("returns true if enough time,has players,eth and is open",async function(){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee});
        await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
        await network.provider.request({method:"evm_mine",params:[]})
        const { upkeepNeeded } = await RAFFLE1.checkUpkeep("0x");
        try{
            assert(upkeepNeeded);  
        }catch(error){
            console.error(error);
            throw error;
        }
    })
   })
describe("performUpkeep",function(){
    it("can only run if checkupkeep is true",async function(){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee});
        await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
        await network.provider.send("evm_mine",[]);
        const tx=await RAFFLE1.performUpkeep("0x");
        assert (tx);
    })
    it("reverts when checkupkeep is false",async function(){
        await expect(RAFFLE1.performUpkeep("0x")).to.be.revertedWithCustomError(
            RAFFLE1,
            "Raffle__UpkeepNotNeeded"
        )
    })

    it("checks the emission of RaffleWinner",async function(){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee});
        await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
        await network.provider.send("evm_mine",[]);
        try{
            await  expect(RAFFLE1.performUpkeep("0x")).to.emit(
                 RAFFLE1,
                "RequestedRaffleWinner"
             ).withArgs(1);
        }catch(error){
            console.error(error);
            throw error;
        }
        console.log(raffle.events);
    })
})

describe("fulfillRandomWords",function(){
    beforeEach(async function (){
        await RAFFLE1.enterRaffle({value:raffleEntranceFee})
        await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
        await network.provider.send("evm_mine",[]);  
    })
    
    it("can only be call after performupkeep",async function (){
        await expect(
        VRFCoordinatorV2Mock.fulfillRandomWords(0,raffle.address)
      ).to.be.revertedWith("nonexistent request");
        
     await expect(
        VRFCoordinatorV2Mock.fulfillRandomWords(1,raffle.address)
     ).to.be.revertedWith("nonexistent request");
    })

    it("picks a winner , resets the lottery and sends money",async function (){
        const additionalEntrants=3;
        const startingAccountIndex=1//deployer=0
        const accounts= await ethers.getSigners();

        for(let i=startingAccountIndex;i<startingAccountIndex+additionalEntrants;i++){
            const accountConnectRaffle=RAFFLE1.connect(accounts[i]);
            await accountConnectRaffle.enterRaffle({value:raffleEntranceFee}); 
        }

         const startingTimeStamp= await RAFFLE1.getLatestTimeStamp();
         const winnerStartingBalance= await ethers.provider.getBalance(accounts[1].address);
           await new Promise(async(resolve,reject)=>{

            RAFFLE1.once("WinnerPicked",async ()=>{
                console.log("found the event");
                try{ 
                    const recentWinner= await RAFFLE1.getRecentWinner();
                    console.log("winner :",recentWinner);
                    console.log(accounts[0].address);
                    console.log(accounts[1].address);
                    console.log(accounts[2].address);
                    console.log(accounts[3].address);
                    const raffleState=await RAFFLE1.checkRaffleState();
                    const endingTimeStamp=await RAFFLE1.getLatestTimeStamp();
                    const numPlayers=await RAFFLE1.getNumberOfPlayers();
                    const winnerEndingBalance= await ethers.provider.getBalance(accounts[1].address);
                   assert.equal(numPlayers.toString(),"0");
                   assert.equal(raffleState.toString(),"0");
                   assert(endingTimeStamp>startingTimeStamp);
                   const expectedBalance = BigInt(winnerStartingBalance) + 
                   (BigInt(raffleEntranceFee) * BigInt(additionalEntrants)) + BigInt(raffleEntranceFee);
                 assert.equal(BigInt(winnerEndingBalance), BigInt(expectedBalance));
                 
                   resolve();                    
                }catch(e){
                    reject(e)
                }
            })
            try{
                const tx= await RAFFLE1.performUpkeep("0x");
                const txReciept= await tx.wait(1);
               //
               //  console.log("hi", txReciept.provider.getLogs())

                 await VRFCoordinatorV2Mock.fulfillRandomWords(1,
                    raffle.address
                 )

            }catch(error){
                reject(error);
            }
                 
           })
    })
})
})