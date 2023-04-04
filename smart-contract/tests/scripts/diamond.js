const Web3 = require('web3');
const ApeFathersABI = require('ApeFathersABI.json');

// Connect to the Ethereum network using Infura
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'));

// Set the address of the deployed contract
const contractAddress = 'CONTRACT-ADDRESS-HERE';

// Create a new instance of the contract using the ABI
const ApeFathersContract = new web3.eth.Contract(ApeFathersABI, contractAddress);

// Get the total number of ApeFathers
ApeFathersContract.methods.totalSupply().call().then((totalSupply) => {
  console.log(`Total ApeFathers: ${totalSupply}`);
}).catch((error) => {
  console.error(`Error getting total ApeFathers: ${error}`);
});

// Get the owner of a specific ApeFather
const apeFatherId = 1;
ApeFathersContract.methods.ownerOf(apeFatherId).call().then((ownerAddress) => {
  console.log(`Owner of ApeFather #${apeFatherId}: ${ownerAddress}`);
}).catch((error) => {
  console.error(`Error getting owner of ApeFather #${apeFatherId}: ${error}`);
});

// Mint a new ApeFather
const privateKey = 'YOUR-PRIVATE-KEY-HERE';
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
const mintToAddress = 'ADDRESS-TO-MINT-TO-HERE';
const tokenURI = 'TOKEN-URI-HERE';

ApeFathersContract.methods.mint(mintToAddress, tokenURI).send({
  from: account.address,
  gasPrice: web3.utils.toWei('5', 'gwei')
}).then((receipt) => {
  console.log(`ApeFather minted. Transaction hash: ${receipt.transactionHash}`);
}).catch((error) => {
  console.error(`Error minting ApeFather: ${error}`);
});
