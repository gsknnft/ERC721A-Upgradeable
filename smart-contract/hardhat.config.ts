import fs from 'fs';
import * as dotenv from 'dotenv';
import { HardhatUserConfig, task } from 'hardhat/config';
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require("@openzeppelin/hardhat-upgrades");
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import CollectionConfig from './config/CollectionConfig';
const extendConfig = require("./hardhatuser.config");

dotenv.config();
const { internalTask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT } = require('hardhat/builtin-tasks/task-names');
/*
 * If you have issues with stuck transactions or you simply want to invest in
 * higher gas fees in order to make sure your transactions will run smoother
 * and faster, then you can update the followind value.
 * This value is used by default in any network defined in this project, but
 * please make sure to add it manually if you define any custom network.
 * 
 * Example:
 * Setting the value to "1.1" will raise the gas values by 10% compared to the
 * estimated value.
 */
const DEFAULT_GAS_MULTIPLIER: number = 1;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
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

internalTask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, async (args, hre, runSuper) => {
  const input = await runSuper();
  input.settings.outputSelection['*']['*'].push('storageLayout');
  return input;
});

// The "ripemd160" algorithm is not available anymore in NodeJS 17+ (because of lib SSL 3).
// The following code replaces it with "sha256" instead.

const crypto = require('crypto');

try {
  crypto.createHash('ripemd160');
} catch (e) {
  const origCreateHash = crypto.createHash;
  crypto.createHash = (alg, opts) => {
    return origCreateHash(alg === 'ripemd160' ? 'sha256' : alg, opts);
}};

task('rename-contract', 'Renames the smart contract replacing all occurrences in source files', async (taskArgs: {newName: string}, hre) => {
  // Validate new name
  if (!/^([A-Z][A-Za-z0-9]+)$/.test(taskArgs.newName)) {
    throw 'The contract name must be in PascalCase: https://en.wikipedia.org/wiki/Camel_case#Variations_and_synonyms';
  }

  const oldContractFile = `${__dirname}/contracts/${CollectionConfig.contractName}.sol`;
  const newContractFile = `${__dirname}/contracts/${taskArgs.newName}.sol`;

  if (!fs.existsSync(oldContractFile)) {
    throw `Contract file not found: "${oldContractFile}" (did you change the configuration manually?)`;
  }

  if (fs.existsSync(newContractFile)) {
    throw `A file with that name already exists: "${oldContractFile}"`;
  }

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
})
.addPositionalParam('newName', 'The new name');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig & ExtendConfig = {
  solidity: { extendConfig,
   compilers: [
      {
        version: "0.8.^19",
      },
      {
        version: "0.8.19",
      },
      {
        version: "^0.8.0",
      },
      {
        version: "^0.8.2",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.8.18",
      },
    ],
    
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
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
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    coinmarketcap: process.env.GAS_REPORTER_COIN_MARKET_CAP_API_KEY,
  },
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

// Setup "testnet" network
if (process.env.NETWORK_TESTNET_URL !== undefined) {
  config.networks!.testnet = {
    url: process.env.NETWORK_TESTNET_URL,
    accounts: [process.env.NETWORK_TESTNET_PRIVATE_KEY!],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

// Setup "mainnet" network
if (process.env.NETWORK_MAINNET_URL !== undefined) {
  config.networks!.mainnet = {
    url: process.env.NETWORK_MAINNET_URL,
    accounts: [process.env.NETWORK_MAINNET_PRIVATE_KEY!],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

export default config;

/**
 * Replaces all occurrences of a string in the given file. 
 */
function replaceInFile(file: string, search: string, replace: string): void
{
  const fileContent = fs.readFileSync(file, 'utf8').replace(new RegExp(search, 'g'), replace);

  fs.writeFileSync(file, fileContent, 'utf8');
}
