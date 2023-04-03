import { beforeEach } from 'mocha';
import { Contract, ContractFactory } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';


export function loadFixtured(
  deployFn: () => Promise<{
    readonly [key: string]: Contract | SignerWithAddress;
  }>
) {
  let context: { [key: string]: Contract | SignerWithAddress } = {};

  beforeEach(async function () {
    context = await deployFn();
  });

  return function <T>(test: (context: {
    [key: string]: Contract | ContractFactory | SignerWithAddress;
  }) => Promise<T>) {
    return test(context);
  };
}