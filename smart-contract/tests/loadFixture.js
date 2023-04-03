const { beforeEach } = require('mocha');
const { Contract, ContractFactory } = require('ethers');
const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');

function loadFixtured(deployFn) {
  let context = {};

  beforeEach(async function () {
    context = await deployFn();
  });

  return function (test) {
    return test(context);
  };
}

module.exports = {
  loadFixtured,
};
