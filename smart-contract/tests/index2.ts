import chai, { expect } from 'chai';
import ChaiAsPromised from 'chai-as-promised';
import { BigNumber, ContractFactory, utils } from 'ethers';
const { ethers, upgrades } = require("hardhat");
import CollectionConfig from '../config/CollectionConfig';
import { NftContractType } from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApeFathers } from '../typechain';
import { deployContract } from './helpers.js';
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
})