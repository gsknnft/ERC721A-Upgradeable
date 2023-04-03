import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import * as Networks from '../lib/Networks';
import * as Marketplaces from '../lib/Marketplaces';

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.ethereumTestnet,
  mainnet: Networks.ethereumMainnet,
  // The contract name can be updated using the following command:
  // yarn rename-contract NEW_CONTRACT_NAME
  // Please DO NOT change it manually!
  contractName: 'ApeFathers',
  tokenName: 'ApeFathers',
  tokenSymbol: 'DAPES',
  hiddenMetadataUri: 'ipfs://__CID__/hidden.json',
  MAX_SUPPLY: 4000,
  burnClaim: {
    price: 0,
    batchSizePerTx: 100,
  },
  preSale: {
    price: 0.05,
    batchSizePerTx: 6,
  },
  publicSale: {
    price: 0.06,
    batchSizePerTx: 5,
  },
  contractAddress: null,
  marketplaceIdentifier: 'apefathersnft',
  marketplaceConfig: Marketplaces.openSea,
};

export default CollectionConfig;
