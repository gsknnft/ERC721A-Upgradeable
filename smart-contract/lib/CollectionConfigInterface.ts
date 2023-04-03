import NetworkConfigInterface from '../lib/NetworkConfigInterface';
import MarketplaceConfigInterface from '../lib/MarketplaceConfigInterface';

interface SaleConfig {
  price: number;
  batchSizePerTx: number;
};

export default interface CollectionConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  hiddenMetadataUri: string;
  MAX_SUPPLY: number;
  burnClaim: SaleConfig;
  preSale: SaleConfig;
  publicSale: SaleConfig;
  contractAddress: string|null;
  marketplaceIdentifier: string;
  marketplaceConfig: MarketplaceConfigInterface;
};