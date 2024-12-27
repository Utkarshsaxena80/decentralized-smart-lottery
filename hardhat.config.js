const {config: dotEnvConfig}= require("dotenv");
dotEnvConfig();
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
/** @type import('hardhat/config').HardhatUserConfig */
const SEPOLIA_RPC_url=process.env.SEPOLIA_RPC_URL;
const SEPOLIA_PRIVATE_key=process.env.SEPOLIA_PRIVATE_KEY;
module.exports = {
  solidity: "0.8.28",
  defaultNetwork:"hardhat",
  networks:{
    hardhat:{
      chainId:31337,
      blockConfirmations:1,
    },
    sepolia:{
      blockConfirmations:6,
      chainId:11155111,
    url:SEPOLIA_RPC_url,
    accounts:[SEPOLIA_PRIVATE_key],
    }
  },

   namedAccounts:{
      deployer:{
      default:0,
    },
       player:{
       default:1,
    },
   },
   mocha:{
    setTimeout:600000,
   }

};
