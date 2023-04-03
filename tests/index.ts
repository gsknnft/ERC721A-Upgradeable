import chai, { expect } from 'chai';
import ChaiAsPromised from 'chai-as-promised';
import { BigNumber, Contract, ContractFactory, utils } from 'ethers';
import { ethers } from 'hardhat';
import CollectionConfig from './../config/CollectionConfig';
import { NftContractType } from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { loadFixtured } from './loadFixture';
import { ApeFathers, ERC721AUpgradeable, ApeFathersAdmin, IApeDads, ApeFathers, ApeFathersInit, ApeDadsApprovals } from '../typechain';
require('@openzeppelin/hardhat-upgrades');
require('@openzeppelin/upgrades-core');
import { deployContract, getBlockTimestamp, mineBlockTimestamp, offsettedIndex } from './helpers.js';
const { constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const RECEIVER_MAGIC_VALUE = '0x150b7a02';
const GAS_MAGIC_VALUE = 800000;
// import { deployContract } from '@nomiclabs/hardhat-ethers/types';

chai.use(ChaiAsPromised);

enum SaleType {
  BURN_CLAIM = CollectionConfig.burnClaim.price,
  PRE_SALE = CollectionConfig.preSale.price,
  PUBLIC_SALE = CollectionConfig.publicSale.price,
  MAX_SUPPLY = CollectionConfig.MAX_SUPPLY,
};

async function loadFixture(fn: () => Promise<any>) {
  const contracts = await fn();
  return contracts;
}

const createTestSuite = ({ contract }) =>
    function () { }
    let offsetted;
    
context(`${Contract}`, function () {
  beforeEach(async function () {
    this.erc721a = await deployContract(Contract);
    this.receiver = await deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, this.erc721a.address]);
    this.startTokenId = this.erc721a.startTokenId ? (await this.erc721a.startTokenId()).toNumber() : 0;

    offsetted = (...arr) => offsettedIndex(this.startTokenId, arr);
  });

  describe('EIP-165 support', async function () {
    it('supports ERC165', async function () {
      expect(await this.erc721a.supportsInterface('0x01ffc9a7')).to.eq(true);
    });
  })
})


async function deploy() {
  const [owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const Contracted = await ethers.getContractFactory("ApeFathers",{ signer: owner });
  const contracted = await Contracted.deploy({ gasLimit: GAS_MAGIC_VALUE });
  console.log("Account balance:", (await owner.getBalance()).toString());
  console.log("Contract Prepared", contracted.address);
  return { contracted, owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient };
}

function getPrice(saleType: SaleType, numTokens: number): BigNumber {
  const publicPrice = CollectionConfig.publicSale.price;
  const burnClaimPrice = CollectionConfig.burnClaim.price;
  const price = saleType === SaleType.PUBLIC_SALE ? publicPrice : burnClaimPrice;
  return BigNumber.from(price).mul(numTokens);
}

describe(CollectionConfig.contractName, function () {
  let owner!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let apeFathers: Contract;
  let erc721a: ERC721AUpgradeable;
  let externalUser!: SignerWithAddress;
  let Contracted!: ApeFathers;
  let contracted: ContractFactory;
  let ApeDadsApprovals: ApeDadsApprovals;
  let ApeFathersInit: ApeFathersInit;
  let ApeFathersAdmin: ApeFathersAdmin;
  let IApeDads: IApeDads;

  before(async () => {
    const { owner: o, holder: h, externalUser: e, 
      Contracted: C, contracted: c, ApeDadsApprovals: ada,
      ApeFathersInit: afi, ApeFathersAdmin: afa, IApeDads: iad } =
      await loadFixture(
        deploy
      );
    owner = o;
    holder = h;
    externalUser = e;
    Contracted = C;
    contracted = c;
    ApeDadsApprovals: ada;
    ApeFathersInit: afi;
    ApeFathersAdmin: afa;
    IApeDads: iad;
  });

  beforeEach(async function () {
    let apeFathers = await ethers.getContractFactory('ApeFathers');
    apeFathers = await apeFathers.deploy();

    erc721a = await ethers.getContractAt('ERC721AUpgradeable', erc721a.address);
  });
});

describe('ApeFathers', createTestSuite({ contract: 'ApeFathers'}));

describe(
  'ApeFathers override _startTokenId()',
  createTestSuite({ contract: 'ApeFathers'})
);

  it("CheckRevealed", async function () { 
    const { contracted, owner } = await loadFixture(deploy);
    const result = await contracted.revealed();
    expect(result).to.equal(false);
  })
  it("Deploy only2", async function () { 
    const { owner, allowedAccount, custodianAccount, unwantedAccount, promoAccount, promoMinter, recipient } = await loadFixture(deploy);        
  })
  
  it("CheckBurnClaim", async function() {
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
      const { contractedInit} = await loadFixture(deploy);
      expect(await contractedInit.name()).to.equal(CollectionConfig.tokenName); // fixed assertion
      expect(await contractedInit.symbol()).to.equal(CollectionConfig.tokenSymbol);
      expect(await contractedInit.publicPrice()).to.equal(getPrice(SaleType.PUBLIC_SALE, 1));
    })
  
  it('Before any sale', async function () {
    const { contract, holder, owner } = await loadFixture(deploy);
    // Nobody should be able to mintPublic from a paused contract
    await expect(contract.connect(holder).mintPublic(ethers.BigNumber.from(1), { value: getPrice(SaleType.PUBLIC_SALE, 1) })).to.be.rejectedWith('The contract is paused!');
    await expect(contract.connect(holder).burnClaim([ethers.BigNumber.from(1)], new BigNumber(0))).to.be.rejectedWith('The contract is paused!');
    await expect(contract.connect(owner).mintPublic(ethers.BigNumber.from(1), { value: getPrice(SaleType.PUBLIC_SALE, 1) })).to.be.rejectedWith('The contract is paused!');
    await expect(contract.connect(owner).burnClaim([ethers.BigNumber.from(1)], new BigNumber(0))).to.be.rejectedWith('The whitelist sale is not enabled!');
  });

  const burnClaimPrice = 0;

  it('Gift tokens', async function () {
    const { contract, holder } = await loadFixture(deploy);
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
  expect(await contract.balanceOf(await External.getAddress())).to.equal(0);
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
    await expect(contract.connect(External).setRevealed(false)).to.be.rejectedWith('Ownable: caller is not the owner');
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


describe('Another', async function () {

    this.apefathers = await deployContract('ApeFathers');
    this.erc721aMint10 = await deployContract('ApeFathers');
  });

  it('emits a ConsecutiveTransfer event for single mint', async function () {    
    expect(this.ape.deployTransaction)
      .to.emit(this.erc721aMint1, 'ConsecutiveTransfer')
      .withArgs(0, 0, ZERO_ADDRESS, this.owner.address);
  });

  it('emits a ConsecutiveTransfer event for a batch mint', async function () {    
    expect(this.erc721aMint10.deployTransaction)
      .to.emit(this.erc721aMint10, 'ConsecutiveTransfer')
      .withArgs(0, 9, ZERO_ADDRESS, this.owner.address);
  });

  it('requires quantity to be below mint limit', async function () {
    let args;
    const mintLimit = 4001;
    args = [this.owner.address, mintLimit, true];
    await mint('ApeFathers', args);
    args = [this.owner.address, mintLimit + 1, true];
    await expect(mint(args)).to.be.rejectedWith('MintQuantityExceedsLimit');
  })

  it('rejects mints to the zero address', async function () {
    let args = [ZERO_ADDRESS, 1, true];
    await expect(publicMint(args)).to.be.rejectedWith('MintToZeroAddress');
  });

  it('requires quantity to be greater than 0', async function () {
    let args = ['Azuki', 'AZUKI', this.owner.address, 0, true];
    await expect(deployContract('ERC721AWithERC2309Mock', args)).to.be.rejectedWith('MintZeroQuantity');
  });
