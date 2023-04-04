import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";

interface ExtendedConfig extends HardhatUserConfig {
  // Add your custom config properties here
}

export default function (baseConfig: HardhatUserConfig): ExtendedConfig {
  const extendedConfig: ExtendedConfig = {
    ...baseConfig, // Make sure to spread the base config first
    // Add your custom config properties here
    solidity: {
      compilers: [
        {
          version: "0.8.0",
        },
        {
          version: "0.6.12",
        },
        {
          version: "0.8.0",
        },
        {
          version: "0.8.1",
        },
        {
          version: "0.8.2",
        },
        {
          version: "0.8.4",
        },
        {
          version: "0.7.0",
        },
        {
          version: "0.8.18",
        },
        {
          version: "0.8.19",
        }
      ],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    networks: {
      hardhat: {
        chainId: 1337,
      },
      goerli: {
        url: "https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID",
        accounts: ["0xYOUR_PRIVATE_KEY"],
      },
    },
    gasReporter: {
      enabled: true,
    },
    plugins: [
      "@nomiclabs/hardhat-waffle",
      "@nomiclabs/hardhat-etherscan",
      "hardhat-gas-reporter"
    ],
  };

  return extendConfig;
}
