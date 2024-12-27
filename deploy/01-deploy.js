const {deployments,getNamedAccounts,network, ethers}= require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")
const VRF_SUB_FUND_AMOUNT= ethers.parseEther("2");
console.log(VRF_SUB_FUND_AMOUNT);

module.exports=async function(){
    const {deploy,log}=deployments;
    const {deployer}= await getNamedAccounts();
    let vrfCoordinatorV2Address ,subscriptionId;
    let VRFCoordinatorV2Mock1;
  
    const chainId=network.config.chainId;
    log(chainId);
    if(developmentChains.includes(network.name)){
     const VRFCoordinatorV2Mock=await deployments.get("VRFCoordinatorV2Mock");
     VRFCoordinatorV2Mock1= await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      VRFCoordinatorV2Mock.address
    );
    vrfCoordinatorV2Address= VRFCoordinatorV2Mock.address;
    const txResponse= await VRFCoordinatorV2Mock1.createSubscription();
    //log("txResponse:",txResponse);
    const txReceipt= await txResponse.wait(1);
    //console.log("Transaction logs:", txReceipt.logs);
    subscriptionId= txReceipt.logs[0].args[0];
    await VRFCoordinatorV2Mock1.fundSubscription(subscriptionId,VRF_SUB_FUND_AMOUNT)
    
    }else{
      vrfCoordinatorV2Address=networkConfig[chainId]["vrfCoordinatorV2"];
      subscriptionId= networkConfig[chainId]["subscriptionId"]; 
    }
  const   callBackGasLimit= networkConfig[chainId]["callBackGasLimit"];
   const  interval=networkConfig[chainId]["interval"];
    
  const entranceFee= networkConfig[chainId]["entranceFee"];
  const gasLane= networkConfig[chainId]["gasLane"];
  
  const args=[ vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callBackGasLimit,
    interval];
    log("deploying raffle contract ...");
     const raffle= await deploy("Raffle",{
        from:deployer,
        args:args,//raffle ke constructor ke arguments yha se jayenge
        log:true,
        waitForConfirmations:network.config.blockConfirmations || 1,
     });
     log(`raffle deployed at ${raffle.address}`);
try{
  await VRFCoordinatorV2Mock1.addConsumer(subscriptionId, raffle.address);
}catch(error){
  console.error(error);
  throw error;
}



}
module.exports.tags=["all"];