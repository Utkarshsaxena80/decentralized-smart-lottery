const {developmentChains}=require("../helper-hardhat-config.js");
const {deployments,getNamedAccounts,network}= require("hardhat");
const {ethers}=require("hardhat");

const BASE_FEE= ethers.parseEther("0.25");
const GAS_PRICE_LINK=1e9;

module.exports=async function () {
    const {deploy,log}=deployments;
    const {deployer}= await getNamedAccounts();
    const chainId=network.config.chainId;

  const args=[BASE_FEE,GAS_PRICE_LINK];
    if(developmentChains.includes(network.name)){
        console.log(network.name);
        log("local network detected, deploying mocks ...");
        await deploy("VRFCoordinatorV2Mock",{
            from:deployer,
            log:true,
            args:args,
            
        })
        log("mocks deployed ...");
        log("--------------------------");

    }
}
module.exports.tags=["all","mocks"];