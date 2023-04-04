import chai, { expect } from 'chai';
import ChaiAsPromised from 'chai-as-promised';
import { BigNumber, ContractFactory, utils } from 'ethers';
const { ethers, upgrades } = require("hardhat");
import CollectionConfig from './../config/CollectionConfig';
import { loadFixtured } from './loadFixure';
import { NftContractType } from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApeFathers, ApeFathersAdmin, IApeDads, ApeDadsApprovals } from '../typechain';
import { deployContract } from '@nomiclabs/hardhat-ethers/types';
require('@openzeppelin/hardhat-upgrades');

chai.use(ChaiAsPromised);

enum SaleType {
  BURN_CLAIM = CollectionConfig.burnClaim.price,
  PRE_SALE = CollectionConfig.preSale.price,
  PUBLIC_SALE = CollectionConfig.publicSale.price,
  MAX_SUPPLY = CollectionConfig.MAX_SUPPLY,
};

const { gasLimit } = ethers.provider.getBlock("latest");
async function main() {
  const Box = await ethers.getContractFactory("Box");
  const box = await upgrades.deployProxy(Box, [42]);
  await box.deployed();
  console.log("Box deployed to:", box.address);
}
async function loadFixture(fn: () => Promise<any>) {
  const contracts = await fn();
  return contracts;
}

describe(CollectionConfig.contractName, async function () {
  let owner!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let Contracted!: ApeFathers;
  let contracted: ContractFactory;
  let ApeDadsApprovals: ApeDadsApprovals;
  let ApeFathersAdmin: ApeFathersAdmin;
  let IApeDads: IApeDads;

  before(async () => {
    const { owner: o, holder: h, externalUser: e, Contracted: C, contracted: c } = await loadFixture(deploy);
    owner = o;
    holder = h;
    externalUser = e;
    Contracted = C;
    contracted = c;
  });

  function getPrice(saleType: SaleType, numTokens: number): BigNumber {
    const publicPrice = CollectionConfig.publicSale.price;
    const burnClaimPrice = CollectionConfig.burnClaim.price;
    const price = saleType === SaleType.PUBLIC_SALE ? publicPrice : burnClaimPrice;
    return BigNumber.from(price).mul(numTokens);
  }

async function deploy() {
  const [owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const Contracted = await ethers.getContractFactory("ApeFathers",{ signer: owner });
  const contracted = await Contracted.deploy({ gasLimit: 600000 });
  console.log("Account balance:", (await owner.getBalance()).toString());
  console.log("Contract Prepared", contracted.address);
  return { contracted, owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient };
}

it("CheckRevealed", async function () { 
  const { contracted, owner } = await loadFixture(deploy);
  const result = await contracted.revealed();
  expect(result).to.equal(false);
})

it("Deploy only2", async function () { 
  const { owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient } = await loadFixture(deploy);        
})

it("CheckBurn", async function() {
  const { contracted, owner } = await loadFixture(deploy);
  const result = await contracted.isBurnClaimActive();
  expect(result).to.equal(false);
});

it("CheckPublicSale", async function() {
  const { contracted, owner } = await loadFixture(deploy);
  const result = await contracted.isPublicSaleActive();
  expect(result).to.equal(false);
});

it("Check_MAX_SUPPLY", async function() {
  const { contracted, owner } = await loadFixture(deploy);
  const result = await contracted.MAX_SUPPLY();
  expect(result).to.equal(4000);
});

it("CheckbatchSize", async function() {
  const { contracted, owner } = await loadFixture(deploy);
  const result = await contracted.batchSizePerTx();
  expect(result).to.equal(10);
});

  it('Check initial data', async function () {
    const { contracted, owner } = await loadFixture(deploy);
    expect(await contracted.hiddenMetadataUri()).to.equal(CollectionConfig.hiddenMetadataUri);
    expect(await contracted.paused()).to.equal(true);
    await expect(contracted.tokenURI(1)).to.be.rejectedWith('ERC721Metadata: URI query for nonexistent token');
  });

  it('Check Name/Symbol/Price data', async function () {
    const { contracted } = await loadFixture(deploy);
    expect(await contracted.name()).to.equal(CollectionConfig.tokenName); // fixed assertion
    expect(await contracted.symbol()).to.equal(CollectionConfig.tokenSymbol);
    expect(await contracted.publicPrice()).to.equal(getPrice(SaleType.PUBLIC_SALE, 1));
  })

it('Before any sale', async function () {
  const { contracted: contract, holder } = await loadFixture(deploy);
  // Nobody should be able to mintPublic from a paused contract
  await expect(contract.connect(holder).mintPublic(ethers.BigNumber.from(1), { value: getPrice(SaleType.PUBLIC_SALE, 1) })).to.be.rejectedWith('The contract is paused!');
  await expect(contract.connect(holder).burnClaim([ethers.BigNumber.from(1)], new BigNumber(0))).to.be.rejectedWith('The contract is paused!');
  await expect(contract.connect(owner).mintPublic(ethers.BigNumber.from(1), { value: getPrice(SaleType.BURN_CLAIM, 1) })).to.be.rejectedWith('The contract is paused!');
  await expect(contract.connect(owner).burnClaim([ethers.BigNumber.from(1)], new BigNumber(0))).to.be.rejectedWith('The whitelist sale is not enabled!');
});

const burnClaimPrice = 0;

it('Gift tokens', async function () {
  const { contracted: contract, holder } = await loadFixture(deploy);
// The owner should always be able to run gift
await contract.gift([await owner.getAddress()], [1]).wait();
await contract.gift([await holder.getAddress()], [2]).wait();

const numTokens = [3, 4, 5];
const recipient = await holder.getAddress();
const bigNumbers = numTokens.map((value) => ethers.BigNumber.from(value));
const initialBalance = await contract.balanceOf(recipient);
const totalNumTokens = numTokens.reduce((a, b) => a + b, 0);

await contract.gift([recipient], bigNumbers);

const finalBalance = await contract.balanceOf(recipient);
expect(finalBalance).to.equal(initialBalance.add(totalNumTokens));

// Test with a larger array of mint amounts
const numTokens2 = Array.from({ length: 50 }, (_, i) => i + 1);
const totalNumTokens2 = numTokens2.reduce((a, b) => a + b, 0);

const recipient2 = await holder.getAddress();
const bigNumbers2 = numTokens2.map((value) => ethers.BigNumber.from(value));
await contract.gift([recipient2], bigNumbers2);

const finalBalance2 = await contract.balanceOf(recipient2);
expect(finalBalance2).to.equal(initialBalance.add(totalNumTokens2));

// Test with an even larger array of mint amounts
const numTokensArray3 = Array.from({ length: 100 }, (_, i) => i + 1);
const totalNumTokens3 = numTokensArray3.reduce((a, b) => a + b, 0);

const recipient3 = await holder.getAddress();
const bigNumbers3 = numTokensArray3.map((value) => ethers.BigNumber.from(value));
await contract.gift([recipient3], bigNumbers3);

const finalBalance3 = await contract.balanceOf(recipient3);
expect(finalBalance3).to.equal(initialBalance.add(totalNumTokens3));

// Check balances
expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
});

it("Should mint a token", async function () {
  const { contracted, owner } = await loadFixture(deploy);
  const isPublicSaleActive = contracted.isPublicSaleActive;
   // Call the mint function from the contract using the owner account
   await contracted.connect(owner).setPublicSaleState(true);
   await contracted.connect(owner).mintPublic(10);

  // Check if the token was minted
  expect(isPublicSaleActive).to.be.true;
  const tokenExists = await contracted.exists(10);
  expect(tokenExists).to.be.true;
}); 

it('Owner only functions', async function () {
  const { contracted: contract } = await loadFixture(deploy);
  await expect(contract.connect(externalUser).setRevealed(false)).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).setPublicPrice(utils.parseEther('0.0000001'))).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).setBatchSizePerTx(99999)).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).setHiddenMetadataUri('INVALID_URI')).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).setUriAttributes('INVALID_PREFIX', 'INVALID_SUFFIX')).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).isBurnClaimActive()).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).isPublicSaleActive()).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).setBurnClaimState(false)).to.be.rejectedWith('Ownable: caller is not the owner');
  await expect(contract.connect(externalUser).withdraw()).to.be.rejectedWith('Ownable: caller is not the owner');
});

it('Wallet of owner', async function () {
  const { contracted: contract, owner, holder, externalUser } = await loadFixture(deploy);
  const ownerBalance = await contract.balanceOf(await owner.getAddress());
  const holderBalance = await contract.balanceOf(await holder.getAddress());
  const externalUserBalance = await contract.balanceOf(await externalUser.getAddress());

  expect(ownerBalance).to.equal(BigNumber.from(1));
  expect(holderBalance).to.equal(BigNumber.from(2)); // Update this value based on the expected holder balance
  expect(externalUserBalance).to.equal(BigNumber.from(0));
});

it('Supply checks (long)', async function () {
  const { contracted: contract, owner, holder, externalUser } = await loadFixture(deploy);
  if (process.env.EXTENDED_TESTS === undefined) {
    this.skip();
  }

  const gasLimit = BigNumber.from('0xffffffffffffffff');
  const alreadyMinted = 6;
  const batchSizePerTx = 100;
  const iterations = Math.floor((CollectionConfig.MAX_SUPPLY - alreadyMinted) / batchSizePerTx);
  const expected_TotalSupply = iterations * batchSizePerTx + alreadyMinted;
  const lastMintPublicAmount = CollectionConfig.MAX_SUPPLY - expected_TotalSupply;
  expect(await contract.totalSupply()).to.equal(alreadyMinted);

  await contract.isPublicSaleActive();
  await contract.setBatchSizePerTx(batchSizePerTx);

  await Promise.all([...Array(iterations).keys()].map(async () => await contract.connect(owner).mintPublic(batchSizePerTx, { value: getPrice(SaleType.PUBLIC_SALE, batchSizePerTx) })));

  // Try to mintPublic over max supply (before sold-out)
  await expect(contract.connect(holder).mintPublic(lastMintPublicAmount + 1, { value: getPrice(SaleType.PUBLIC_SALE, lastMintPublicAmount + 1) })).to.be.rejectedWith('Max supply exceeded!');
  await expect(contract.connect(holder).mintPublic(lastMintPublicAmount + 2, { value: getPrice(SaleType.PUBLIC_SALE, lastMintPublicAmount + 2) })).to.be.rejectedWith('Max supply exceeded!');

  expect(await contract.totalSupply()).to.equal(expected_TotalSupply);

  // mintPublic last tokens with owner address and test walletOfOwner(...)
  await contract.connect(owner).mintPublic(lastMintPublicAmount, { value: getPrice(SaleType.PUBLIC_SALE, lastMintPublicAmount) });
  const expectedWalletOfOwner = [    BigNumber.from(1),  ];
  for (const i of [...Array(lastMintPublicAmount).keys()].reverse()) {
    expectedWalletOfOwner.push(BigNumber.from(CollectionConfig.MAX_SUPPLY - i));
  }
  expect(await contract.balanceOf(
    await owner.getAddress(),
    {
      // Set gas limit to the maximum value since this function should be used off-chain only and it would fail otherwise...
      gasLimit: gasLimit
    },
  )).deep.equal(expectedWalletOfOwner);

  // Try to mintPublic over max supply (after sold-out)
  await expect(contract.connect(holder).mintPublic(1, { value: getPrice(SaleType.PUBLIC_SALE, 1) })).to.be.rejectedWith('Max supply exceeded!');

  expect(await contract.totalSupply()).to.equal(CollectionConfig.MAX_SUPPLY);
});

it('Token URI generation', async function () {
  const { contracted: contract, owner, holder, externalUser } = await loadFixture(deploy);
  const uriPrefix = '';
  const uriSuffix = '.json';
  const totalSupply = await contract.totalSupply();

  expect(await contract.tokenURI(1)).to.equal(CollectionConfig.hiddenMetadataUri);

  // Reveal collection
  await contract.setUriAttributes(uriPrefix, uriSuffix);
  await contract.setRevealed(true);

  // ERC721A uses token IDs starting from 0 internally...
  await expect(contract.tokenURI(0)).to.be.rejectedWith('ERC721Metadata: URI query for nonexistent token');

  // Testing first and last mintPubliced tokens
  await expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}1${uriSuffix}`);
  await expect(await contract.tokenURI(totalSupply)).to.equal(`${uriPrefix}${totalSupply}${uriSuffix}`);
  });
})