import fs from 'fs';
const dotenv = require('dotenv');
const { task } = require('hardhat/config');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('@openzeppelin/hardhat-upgrades');
require('@typechain/hardhat');
require('hardhat-gas-reporter');
require('solidity-coverage');
const CollectionConfig = require('./config/CollectionConfig');

dotenv.config();
const { internalTask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT } = require('hardhat/builtin-tasks/task-names');

const DEFAULT_GAS_MULTIPLIER = 1;

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

if (process.env.REPORT_GAS) {
  require('hardhat-gas-reporter');
}

if (process.env.REPORT_COVERAGE) {
  require('solidity-coverage');
}

internalTask(
  TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
  async (args, hre, runSuper) => {
    const input = await runSuper();
    input.settings.outputSelection['*']['*'].push('storageLayout');
    return input;
  }
);

const crypto = require('crypto');

try {
  crypto.createHash('ripemd160');
} catch (e) {
  const origCreateHash = crypto.createHash;
  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === 'ripemd160' ? 'sha256' : alg, opts);
  };
}

// Replace names in source files
function replaceInFile(file, search, replace) {
  const fileContent = fs.readFileSync(file, 'utf8').replace(new RegExp(search, 'g'), replace);
  fs.writeFileSync(file, fileContent, 'utf8');
}

task('rename-contract', 'Renames the contract and updates references to its name', async (taskArgs, hre) => {
  const CollectionConfig = require('./config/CollectionConfig').default;
  const oldContractFile = __dirname + '/../contracts/MyNFT.sol';
  const newContractFile = __dirname + `/../contracts/${taskArgs.newName}.sol`;

  // Replace names in source files
  replaceInFile(__dirname + '/../minting-dapp/src/scripts/lib/NftContractType.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(__dirname + '/config/CollectionConfig.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(__dirname + '/lib/NftContractProvider.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(oldContractFile, CollectionConfig.contractName, taskArgs.newName);



  // Rename the contract file
  fs.renameSync(oldContractFile, newContractFile);

  console.log(`Contract renamed successfully from "${CollectionConfig.contractName}" to "${taskArgs.newName}"!`);

  // Rebuilding types
  await hre.run('typechain');
}).addPositionalParam('newName', 'The new name');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
module.exports = {
  solidity: {
    version: '0.8.19',
    compilers: [
      {
        version: "^0.8.19",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      upgrades: {
        legacyContract: false,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    truffle: {
      url: 'http://localhost:24012/rpc',
      timeout: 60000,
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    showTimeSpent: true,
  },
  plugins: ['solidity-coverage'],
  etherscan: {
    apiKey: {
      // Ethereum
      goerli: process.env.BLOCK_EXPLORER_API_KEY,
      mainnet: process.env.BLOCK_EXPLORER_API_KEY,
      rinkeby: process.env.BLOCK_EXPLORER_API_KEY,

      // Polygon
      polygon: process.env.BLOCK_EXPLORER_API_KEY,
      polygonMumbai: process.env.BLOCK_EXPLORER_API_KEY,
    },
  },
};

// The "ripemd160" algorithm is not available anymore in NodeJS 17+ (because of lib SSL 3).
// The following code replaces it with "sha256" instead.

try {
  crypto.createHash('ripemd160');
} catch (e) {
  const origCreateHash = crypto.createHash;
  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === 'ripemd160' ? 'sha256' : alg, opts);
  };
}

// Setup "testnet" network
if (process.env.NETWORK_TESTNET_URL !== undefined) {
  config.networks.testnet = {
    url: process.env.NETWORK_TESTNET_URL,
    accounts: [process.env.NETWORK_TESTNET_PRIVATE_KEY],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

// Setup "mainnet" network
if (process.env.NETWORK_MAINNET_URL !== undefined) {
  config.networks.mainnet = {
    url: process.env.NETWORK_MAINNET_URL,
    accounts: [process.env.NETWORK_MAINNET_PRIVATE_KEY],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

module.exports.default = module.exports;