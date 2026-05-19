require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
const isValidKey = privateKey && privateKey.length >= 64 && privateKey !== "0xYOUR_PRIVATE_KEY";
const accounts = isValidKey ? [privateKey] : [];

module.exports = {
  defaultNetwork: "mezotestnet",
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    mezotestnet: {
      url: process.env.TESTNET_RPC || "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts,
    },
    mezomainnet: {
      url: process.env.MAINNET_RPC || "https://mezo.drpc.org",
      chainId: 31612,
      accounts,
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "london",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  sourcify: {
    enabled: false
  },
  etherscan: {
    apiKey: {
      mezotestnet: process.env.ETHERSCAN_API_KEY || "any-value",
      mezomainnet: process.env.ETHERSCAN_API_KEY || "any-value",
    },
    customChains: [
      {
        network: "mezotestnet",
        chainId: 31611,
        urls: {
          apiURL: "https://api.explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
      {
        network: "mezomainnet",
        chainId: 31612,
        urls: {
          apiURL: "https://api.explorer.mezo.org/api",
          browserURL: "https://explorer.mezo.org",
        },
      },
    ],
  },
};
